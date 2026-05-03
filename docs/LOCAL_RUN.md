# Local Development Setup

## Prerequisites

- Docker & Docker Compose
- Python 3.11+ (if running services locally without Docker)
- Cloned Hemora repository

## Quick Start (Docker Compose)

### 1. Prepare Environment

```bash
cd /path/to/Hemora

# Copy environment template
cp .env.example .env

# Update .env with local values (optional, defaults are fine for dev)
# DEBUG=True
# DB_PASSWORD=hemora25
# LOG_LEVEL=DEBUG
```

### 2. Build Images

```bash
docker-compose build
```

### 3. Start Services

```bash
docker-compose up -d
```

Services will start in order:
- `postgres` (port 5432 → 5435)
- `backend` (port 8000)
- `ml_inference` (port 8001)
- `worker` (port 8002)
- `frontend` (port 5173)

### 4. Initialize Database

```bash
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

### 5. Verify Health

```bash
# API health
curl http://localhost:8000/health/

# ML service health
curl http://localhost:8001/health

# Worker health
curl http://localhost:8002/health

# Frontend
open http://localhost:5173
```

## Local Development (Without Docker)

### Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start server
python manage.py runserver
```

### ML Inference Service

```bash
cd ml_inference

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start service
python main.py
```

### Worker

```bash
cd worker

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start worker
python main.py
```

## Testing

### Run Backend Tests

```bash
docker-compose exec backend python -m pytest analysis/tests/test_jobs.py -v
```

### Run ML Service Tests

```bash
docker-compose exec ml_inference python -m pytest tests/ -v
```

### Run All Tests

```bash
docker-compose exec backend python manage.py test
```

## Common Tasks

### View Diagnosis Job Status

```bash
# Get pending jobs
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/diagnosis-jobs/pending/

# Get specific job
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/patients/1/diagnosis-jobs/<job-id>/
```

### Check Service Logs

```bash
# Backend
docker-compose logs -f backend

# ML Service
docker-compose logs -f ml_inference

# Worker
docker-compose logs -f worker
```

### Reset Database

```bash
docker-compose down -v
docker-compose up -d
docker-compose exec backend python manage.py migrate
```

### Debug Inference Manually

```bash
docker-compose exec ml_inference python -c "
from models import ModelRegistry
from core import config

models = ModelRegistry.available_diseases(config.BASE_MODELS_DIR)
print(f'Available models: {models}')
"
```

## Troubleshooting

### Backend can't connect to ML service

```bash
# Verify ML service is running
docker-compose ps ml_inference

# Check logs
docker-compose logs ml_inference

# Test connectivity from backend container
docker-compose exec backend curl http://ml_inference:8001/health
```

### Worker not picking up jobs

```bash
# Check worker logs
docker-compose logs -f worker

# Verify job table exists
docker-compose exec backend python manage.py shell
>>> from analysis.models import DiagnosisJob
>>> DiagnosisJob.objects.all().count()
```

### ML models not loading

```bash
# Verify model files exist
ls -la data/models/

# Check ML service startup logs
docker-compose logs ml_inference | grep "Model\|Failed"
```

## Performance Tuning

### Increase Worker Concurrency

Edit `docker-compose.yml` worker service:
```yaml
environment:
  - WORKER_BATCH_SIZE=10  # Process more jobs per loop
  - WORKER_POLL_INTERVAL=2  # Poll more frequently
```

### Scale ML Service (with load balancer)

```bash
# In production, use multiple ML service instances
# behind nginx/haproxy for load balancing
```

### Database Connection Pooling

Backend uses Django's connection pooling by default. To enable PgBouncer:

```yaml
services:
  pgbouncer:
    image: pgbouncer:latest
    environment:
      DATABASES_HOST: postgres
      DATABASES_PORT: 5432
      # ... pgbouncer config
```
