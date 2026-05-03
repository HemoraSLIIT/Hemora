# Migration Validation Checklist

## Pre-Deployment (Local Testing)

### Database & Models
- [ ] Django migration `0003_add_diagnosis_job.py` created
- [ ] DiagnosisJob model has all required fields (id, status, job_id, etc.)
- [ ] DiagnosisJob indexes created for performance
- [ ] `python manage.py migrate` runs without errors
- [ ] `python manage.py makemigrations --check` passes

### Django Backend
- [ ] `/api/patients/<id>/diagnose/` returns 202 Accepted
- [ ] Response includes `jobId` and status=pending
- [ ] `GET /api/patients/<id>/diagnosis-jobs/` lists jobs
- [ ] `GET /api/patients/<id>/diagnosis-jobs/<job_id>/` returns job status
- [ ] Correlation IDs propagated across calls
- [ ] Old `GET /api/patients/<id>/diagnose/` still works for legacy support

### ML Inference Service
- [ ] `docker build -t hemora-ml-inference ./ml_inference` succeeds
- [ ] `curl http://localhost:8001/health` returns 200 with healthy status
- [ ] `curl http://localhost:8001/api/inference/models/available` lists diseases
- [ ] `POST /api/inference/diagnose` accepts request and returns response
- [ ] Model registry initializes without crashing
- [ ] Service gracefully handles missing model files

### Worker Service
- [ ] `docker build -t hemora-worker ./worker` succeeds
- [ ] Worker starts without errors
- [ ] Worker polls database for pending jobs
- [ ] Worker fetches image paths from Django
- [ ] Worker calls ML service successfully
- [ ] Worker updates job status in Django
- [ ] `curl http://localhost:8002/health` returns 200

### Docker Compose
- [ ] `docker-compose build` succeeds for all services
- [ ] `docker-compose up -d` starts all services
- [ ] `docker-compose logs` shows no startup errors
- [ ] All services pass health checks
- [ ] Services can communicate across network
- [ ] Volume mounts work correctly

### Integration Tests
- [ ] Create patient via API
- [ ] Submit diagnosis job (POST /diagnose)
- [ ] Poll job status until completion
- [ ] Verify DiagnosisResult created in DB
- [ ] Verify notifications sent to doctors
- [ ] Run with multiple concurrent jobs
- [ ] Test with missing images
- [ ] Test with invalid parameters

### Performance
- [ ] Single diagnosis job < 30 seconds (mock ML)
- [ ] 10 concurrent jobs don't crash worker
- [ ] Worker processes at least 5 jobs/min
- [ ] Database queries don't N+1

## Production Deployment (Staging)

### Infrastructure
- [ ] RDS PostgreSQL instance created and accessible
- [ ] S3 bucket created for artifacts
- [ ] ECR repositories created for 3 services
- [ ] Docker images built and pushed to ECR
- [ ] ECS cluster created
- [ ] Task definitions registered
- [ ] Services created with auto-scaling

### Secrets Management
- [ ] Database password in AWS Secrets Manager
- [ ] API keys stored securely
- [ ] Environment variables in ECS task definition
- [ ] No secrets in code or docker-compose
- [ ] Rotation policy documented

### Monitoring & Logging
- [ ] CloudWatch log groups created
- [ ] Application logs flowing to CloudWatch
- [ ] CPU/Memory alarms configured
- [ ] Job processing duration tracked
- [ ] Error rate monitored
- [ ] Database connection pool monitored

### Load Testing
- [ ] 100 concurrent patients creating jobs
- [ ] Worker can process 50+ jobs/hour
- [ ] No database connection pool exhaustion
- [ ] Memory usage stays under 80%
- [ ] No memory leaks after 24 hours

### Security
- [ ] VPC security groups configured
- [ ] RDS not publicly accessible
- [ ] S3 bucket versioning enabled
- [ ] Database backups enabled
- [ ] Encryption at rest enabled
- [ ] TLS/HTTPS enforced

### Rollback Testing
- [ ] Previous monolith version available
- [ ] Database backup created
- [ ] Rollback procedure tested in staging
- [ ] All services come down cleanly
- [ ] Previous version starts without issues
- [ ] Data integrity verified after rollback

## Post-Deployment (Production)

### Smoke Tests
- [ ] Frontend loads without errors
- [ ] Login works
- [ ] Create patient works
- [ ] Submit diagnosis works
- [ ] Poll job status works
- [ ] View results works
- [ ] Notifications appear

### Monitoring
- [ ] Dashboard shows all services healthy
- [ ] Job processing metrics nominal
- [ ] No unusual error rates
- [ ] Database performance normal
- [ ] Logs showing expected activity

### User Communication
- [ ] Release notes published
- [ ] FAQ updated
- [ ] Support team briefed
- [ ] Monitoring dashboard shared

### Documentation
- [ ] LOCAL_RUN.md validated
- [ ] AWS_DEPLOYMENT.md accurate
- [ ] ROLLBACK_STRATEGY.md tested
- [ ] Runbooks updated

## Decommission Old Code (Optional)

After successful staging + production validation:

- [ ] Remove old monolithic diagnosis endpoint code (backend/ml_inference/)
- [ ] Archive old model loading code
- [ ] Update README to reference microservices
- [ ] Remove backwards-compatibility shims
- [ ] Tag release with microservices version

## Sign-Off

- [ ] Dev team: Code reviewed and tested
- [ ] QA team: All test cases passing
- [ ] DevOps team: Infrastructure ready
- [ ] Product: Requirements met
- [ ] Security: No vulnerabilities

## Troubleshooting Guide

| Issue | Symptom | Check |
|-------|---------|-------|
| ML models not loading | 503 from ML service | `ls data/models/*/weights` |
| Worker not processing | Jobs stuck in pending | Worker logs, DB connection |
| Slow responses | API latency high | Database query performance |
| Out of memory | Worker crashes | Memory limits in docker-compose |
| Jobs never finish | Status always running | Worker and ML service logs |

---

**Date Deployed**: ___________
**Deployed By**: ___________
**Status**: [ ] Success [ ] Issues [ ] Rolled Back
**Notes**: ___________________________________________________________
