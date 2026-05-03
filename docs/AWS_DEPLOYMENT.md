# AWS Deployment Guide

## Architecture Overview

Production deployment spans AWS services:

```
┌──────────────────────────────────────────────────────┐
│                    AWS VPC (Private)                  │
│                                                       │
│  ┌────────────────────────────────────────────────┐ │
│  │              ECS Cluster (Fargate)              │ │
│  │                                                 │ │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │ │
│  │ │ Backend  │ │ ML Svc   │ │ Worker (×N)      │ │ │
│  │ │ (×2)     │ │ (×2)     │ │                  │ │ │
│  │ └──────────┘ └──────────┘ └──────────────────┘ │ │
│  │        ↓          ↓               ↑↓            │ │
│  │    ┌──────────────────────────────────┐        │ │
│  │    │    RDS PostgreSQL (Multi-AZ)     │        │ │
│  │    └──────────────────────────────────┘        │ │
│  │                                                 │ │
│  │    ┌──────────────────────────────────┐        │ │
│  │    │  ElastiCache Redis (optional)    │        │ │
│  │    └──────────────────────────────────┘        │ │
│  └────────────────────────────────────────────────┘ │
│                        ↑                              │
│  ┌────────────────────────────────────────────────┐ │
│  │         CloudFront / ALB                        │ │
│  └────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
         ↑                                  ↑
    ┌─────┴──────┐                  ┌──────┴─────┐
    │  S3 Bucket │                  │ CloudWatch │
    │  (Artifacts)│                  │  (Logs)    │
    └────────────┘                  └────────────┘
```

## Prerequisites

- AWS Account with permissions for ECS, ECR, RDS, S3, CloudWatch
- AWS CLI configured
- Docker images pushed to ECR
- RDS PostgreSQL instance created

## Step 1: Set Up ECR Repositories

```bash
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Create repositories
aws ecr create-repository --repository-name hemora/backend
aws ecr create-repository --repository-name hemora/ml-inference
aws ecr create-repository --repository-name hemora/worker
```

## Step 2: Build and Push Docker Images

```bash
# Authenticate with ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_REGISTRY

# Backend
docker build -t $ECR_REGISTRY/hemora/backend:latest ./backend
docker push $ECR_REGISTRY/hemora/backend:latest

# ML Service
docker build -t $ECR_REGISTRY/hemora/ml-inference:latest ./ml_inference
docker push $ECR_REGISTRY/hemora/ml-inference:latest

# Worker
docker build -t $ECR_REGISTRY/hemora/worker:latest ./worker
docker push $ECR_REGISTRY/hemora/worker:latest
```

## Step 3: Create RDS PostgreSQL Instance

```bash
aws rds create-db-instance \
  --db-instance-identifier hemora-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.3 \
  --master-username postgres \
  --master-user-password $(openssl rand -base64 32) \
  --allocated-storage 20 \
  --storage-type gp3 \
  --backup-retention-period 30 \
  --multi-az \
  --publicly-accessible false \
  --db-subnet-group-name hemora-subnet-group \
  --vpc-security-group-ids sg-xxxxx \
  --enable-cloudwatch-logs-exports postgresql
```

**Store the password in AWS Secrets Manager:**

```bash
aws secretsmanager create-secret \
  --name hemora/rds/password \
  --secret-string $(openssl rand -base64 32)
```

## Step 4: Set Up S3 for Artifacts

```bash
aws s3 mb s3://hemora-artifacts-prod-us-east-1 \
  --region $AWS_REGION

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket hemora-artifacts-prod-us-east-1 \
  --versioning-configuration Status=Enabled

# Set up lifecycle policy
cat > lifecycle.json << EOF
{
  "Rules": [
    {
      "Id": "DeleteOldObjects",
      "Status": "Enabled",
      "Expiration": {"Days": 90}
    }
  ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
  --bucket hemora-artifacts-prod-us-east-1 \
  --lifecycle-configuration file://lifecycle.json
```

## Step 5: Create ECS Cluster and Task Definitions

```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name hemora-prod

# Create task execution role
aws iam create-role \
  --role-name hemora-ecs-task-execution-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach policy
aws iam attach-role-policy \
  --role-name hemora-ecs-task-execution-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
```

**Register task definitions** (update ECR URLs in JSON):

```bash
# backend-task-def.json
aws ecs register-task-definition \
  --cli-input-json file://backend-task-def.json

# ml-inference-task-def.json
aws ecs register-task-definition \
  --cli-input-json file://ml-inference-task-def.json

# worker-task-def.json
aws ecs register-task-definition \
  --cli-input-json file://worker-task-def.json
```

## Step 6: Create Services

```bash
# Backend service (with ALB)
aws ecs create-service \
  --cluster hemora-prod \
  --service-name hemora-backend \
  --task-definition hemora-backend:1 \
  --desired-count 2 \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=backend,containerPort=8000

# ML Inference service
aws ecs create-service \
  --cluster hemora-prod \
  --service-name hemora-ml-inference \
  --task-definition hemora-ml-inference:1 \
  --desired-count 2

# Worker service
aws ecs create-service \
  --cluster hemora-prod \
  --service-name hemora-worker \
  --task-definition hemora-worker:1 \
  --desired-count 3
```

## Step 7: Configure Auto Scaling

```bash
# Backend target group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name hemora-backend-asg \
  --launch-template LaunchTemplateName=hemora-backend,Version='$Latest' \
  --min-size 2 \
  --max-size 10 \
  --desired-capacity 2 \
  --target-group-arns arn:aws:elasticloadbalancing:...

# ML service target group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name hemora-ml-asg \
  --launch-template LaunchTemplateName=hemora-ml-inference,Version='$Latest' \
  --min-size 2 \
  --max-size 8 \
  --desired-capacity 2
```

## Step 8: Set Up CloudWatch Monitoring

```bash
# Create log group
aws logs create-log-group --log-group-name /ecs/hemora

# Set retention
aws logs put-retention-policy \
  --log-group-name /ecs/hemora \
  --retention-in-days 30

# Create alarms
aws cloudwatch put-metric-alarm \
  --alarm-name hemora-backend-cpu \
  --alarm-description "Backend CPU high" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 75 \
  --comparison-operator GreaterThanThreshold
```

## Step 9: Environment Variables

Create Secrets Manager secret:

```bash
aws secretsmanager create-secret \
  --name hemora/prod/env \
  --secret-string '{
    "SECRET_KEY": "...",
    "DEBUG": "False",
    "DB_NAME": "hemoradb",
    "DB_USER": "postgres",
    "DB_PASSWORD": "...",
    "DB_HOST": "hemora-prod.xyz.rds.amazonaws.com",
    "DJANGO_API_KEY": "...",
    "S3_BUCKET": "hemora-artifacts-prod-us-east-1",
    "S3_REGION": "us-east-1"
  }'
```

Reference in task definition using `secrets` field.

## Step 10: Domain and CDN

```bash
# Route 53 - point to ALB
aws route53 change-resource-record-sets \
  --hosted-zone-id ZONEID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.hemora.example.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z...",
          "DNSName": "hemora-alb-123.amazonaws.com",
          "EvaluateTargetHealth": true
        }
      }
    }]
  }'

# CloudFront for static assets
aws cloudfront create-distribution \
  --origin-domain-name hemora-artifacts-prod-us-east-1.s3.amazonaws.com \
  --default-root-object index.html
```

## Monitoring & Logs

```bash
# View logs
aws logs tail /ecs/hemora --follow

# Get task status
aws ecs list-tasks --cluster hemora-prod --service-name hemora-backend

# Describe service
aws ecs describe-services \
  --cluster hemora-prod \
  --services hemora-backend
```

## TODO: Production Checklist

- [ ] Enable VPC endpoints for private S3 access
- [ ] Set up AWS Backup for RDS
- [ ] Enable RDS encryption
- [ ] Configure WAF rules
- [ ] Set up SNS notifications for alarms
- [ ] Enable API rate limiting
- [ ] Configure CORS properly
- [ ] Implement API key rotation
- [ ] Set up DynamoDB for session store (optional)
- [ ] Configure cost alerts
