# Rollback Strategy

## Overview

This document outlines procedures to revert the microservices migration if critical issues arise.

## Pre-Migration Checklist

Before deploying to production:

- [ ] Create full database backup
- [ ] Tag Docker images with version and commit hash
- [ ] Document current monolith commit hash
- [ ] Have previous Django Docker image ready
- [ ] Test rollback procedure in staging
- [ ] Document all environment variable changes
- [ ] Have runbooks for each service ready

## Rollback Levels

### Level 1: Minor Issue (< 30 min downtime)

**Scenario**: Worker or ML service has bug, but API is functioning

**Action**: Restart single service

```bash
# Restart worker
docker-compose restart worker

# Or in ECS
aws ecs update-service \
  --cluster hemora-prod \
  --service hemora-worker \
  --force-new-deployment

# Check logs
docker-compose logs worker
```

**Decision**: If resolved in 30 min, continue. Otherwise → Level 2.

### Level 2: Service Down (< 1 hour)

**Scenario**: ML service or worker completely down, backend still accepting requests

**Action**: Replace service with previous version

```bash
# Roll back ML inference image
docker pull $ECR_REGISTRY/hemora/ml-inference:previous-stable

docker tag $ECR_REGISTRY/hemora/ml-inference:previous-stable \
           $ECR_REGISTRY/hemora/ml-inference:latest

docker push $ECR_REGISTRY/hemora/ml-inference:latest

# Restart in ECS
aws ecs update-service \
  --cluster hemora-prod \
  --service hemora-ml-inference \
  --force-new-deployment

# Verify health
aws ecs describe-services \
  --cluster hemora-prod \
  --services hemora-ml-inference
```

### Level 3: Data Integrity Issue (< 2 hours)

**Scenario**: Job table corruption, DiagnosisJob model changed incorrectly

**Action**: Revert database migration and code

```bash
# Backend: Revert migration
docker-compose exec backend python manage.py migrate analysis <prev_migration_number>

# Example:
docker-compose exec backend python manage.py migrate analysis 0002

# Restart backend
docker-compose restart backend

# Verify
docker-compose exec backend python manage.py showmigrations analysis
```

**Manual Recovery** (if rollback fails):

```sql
-- Connect to PostgreSQL
psql -U postgres -h localhost hemoradb

-- Check job table
\dt analysis_diagnosisjob;

-- If corrupted, truncate and clear pending jobs
DELETE FROM analysis_diagnosisjob WHERE status = 'pending';

-- Or restore from backup
-- RESTORE FROM BACKUP <backup_timestamp>
```

### Level 4: Complete Rollback (Full Stack)

**Scenario**: Critical bug in async job system makes entire diagnosis flow broken

**Action**: Deploy previous monolithic version

#### Step 1: Verify Backup

```bash
# Check database backup exists
aws rds describe-db-snapshots \
  --db-instance-identifier hemora-prod \
  --query 'DBSnapshots[0]'

# Or point-in-time restore option
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier hemora-prod-restore \
  --db-snapshot-identifier hemora-prod-backup-timestamp
```

#### Step 2: Stop Microservices

```bash
# Local Docker Compose
docker-compose down

# Or in ECS
aws ecs update-service \
  --cluster hemora-prod \
  --service hemora-backend \
  --desired-count 0

aws ecs update-service \
  --cluster hemora-prod \
  --service hemora-worker \
  --desired-count 0

aws ecs update-service \
  --cluster hemora-prod \
  --service hemora-ml-inference \
  --desired-count 0
```

#### Step 3: Deploy Previous Monolith

```bash
# Use previous monolith Docker image
PREV_VERSION=$(git tag -l | sort -V | tail -2 | head -1)

docker pull $ECR_REGISTRY/hemora/monolith:$PREV_VERSION

# Docker Compose approach
docker run -d \
  --name hemora-backend-monolith \
  -p 8000:8000 \
  -e DB_HOST=postgres \
  -e DB_PASSWORD=$DB_PASSWORD \
  $ECR_REGISTRY/hemora/monolith:$PREV_VERSION
```

#### Step 4: Verify Monolith

```bash
# Health check
curl http://localhost:8000/health

# Run migrations
curl -X POST http://localhost:8000/api/health/

# Smoke test API
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/patients/

# Check frontend
open http://localhost:5173
```

#### Step 5: Restore Data (if needed)

```bash
# Restore RDS from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier hemora-prod-restore \
  --db-snapshot-identifier hemora-prod-snapshot-timestamp

# Wait for restore
aws rds wait db-instance-available \
  --db-instances hemora-prod-restore

# Update backend connection string
export DB_HOST=hemora-prod-restore.xyz.rds.amazonaws.com

# Restart backend
docker restart hemora-backend-monolith
```

## Data Migration Issues

### DiagnosisJob Table Not Created

**Problem**: Migration 0003_add_diagnosis_job failed

**Recovery**:

```bash
# Check migration status
docker-compose exec backend python manage.py showmigrations analysis

# If marked as applied but table missing:
docker-compose exec backend python manage.py migrate analysis 0002
docker-compose exec backend python manage.py migrate analysis 0003

# Or manually recreate
docker-compose exec backend python manage.py sqlmigrate analysis 0003 | \
  docker-compose exec postgres psql -U postgres hemoradb
```

### Pending Jobs Stuck in Queue

**Problem**: Jobs never finish, workers crash

**Recovery**:

```bash
# Stop workers
docker-compose stop worker

# Clear stuck jobs
docker-compose exec backend python manage.py shell << EOF
from analysis.models import DiagnosisJob
# Get stuck jobs (running for > 1 hour)
from django.utils import timezone
from datetime import timedelta

stuck = DiagnosisJob.objects.filter(
    status='running',
    started_at__lt=timezone.now() - timedelta(hours=1)
)
print(f"Found {stuck.count()} stuck jobs")

# Option 1: Reset to pending
stuck.update(status='pending', started_at=None)

# Option 2: Mark as failed
stuck.update(
    status='failed',
    error_message='Recovered from stuck state',
    finished_at=timezone.now()
)
EOF

# Restart workers
docker-compose up worker
```

## Testing Rollback in Staging

```bash
# Create staging environment
docker-compose -f docker-compose.staging.yml up -d

# Deploy microservices version
docker-compose -f docker-compose.staging.yml --file docker-compose-micro.yml up -d

# Run smoke tests
python tests/smoke_tests.py

# Simulate issue (chaos engineering)
docker-compose -f docker-compose.staging.yml kill ml_inference

# Execute rollback
# [Follow Level 1/2/3 procedures above]

# Verify services recovered
curl http://localhost:8001/health  # Should work
```

## Post-Rollback Actions

1. **Notify stakeholders** of rollback completion
2. **Document root cause** in postmortem
3. **Create GitHub issue** for reproduction + fix
4. **Review code** before next deployment attempt
5. **Update runbooks** based on lessons learned
6. **Schedule re-deployment** with additional testing

## Communication Template

```
Subject: Hemora Deployment Rollback - [Timestamp]

We've rolled back the Hemora microservices deployment due to [ISSUE].

Status: [Current state of system]
Affected: [Services/features]
ETA: [When normal service expected]
Updates: [Status URL/Slack channel]

We apologize for the inconvenience and appreciate your patience.

Root cause: [To be determined]
Next steps: [What we're doing to prevent recurrence]
```

## Prevention Checklist

- [ ] Automated integration tests before deployment
- [ ] Canary deployment (5% traffic) before full rollout
- [ ] Feature flags for new job system
- [ ] Backwards compatibility maintained for GET endpoint
- [ ] Database backup before every production change
- [ ] Dry-run migrations in staging first
- [ ] Load testing of worker service
- [ ] Chaos engineering (kill random services)
- [ ] Explicit rollback test every release cycle
