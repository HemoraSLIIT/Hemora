# Hemora Microservices Migration

## Overview

This migration decouples ML inference from the Django monolith into independent microservices:

- **Django API (backend)**: Handles patient management, CBC extraction, diagnosis result persistence, and orchestration
- **ML Inference Service (ml_inference)**: Standalone FastAPI service for blood smear image analysis
- **Diagnosis Worker (worker)**: Job processor that polls for pending diagnoses and coordinates between services
- **PostgreSQL**: Persistent data store (unchanged)

## Architecture

```
┌─────────────┐         ┌──────────────┐
│   Frontend  │◄────────┤ Django API   │
│  (React)    │         │   (Port 8000)│
└─────────────┘         └──────┬───────┘
                                │
                 ┌──────────────┼──────────────┐
                 │              │              │
            ┌────▼────┐    ┌────▼─────┐  ┌───▼───────┐
            │ Patient │    │ Diagnosis │  │PostgreSQL │
            │  Mgmt   │    │   Jobs    │  │           │
            └─────────┘    └──────┬────┘  └───────────┘
                                  │
                          ┌───────▼────────┐
                          │  Worker Loop   │
                          │  (Port 8002)   │
                          └───────┬────────┘
                                  │
                          ┌───────▼──────────┐
                          │ ML Inference Svc │
                          │  (Port 8001)     │
                          │ - ALL            │
                          │ - SCD            │
                          │ - IDA            │
                          │ - Thalassemia    │
                          └──────────────────┘
```

## Job Lifecycle

1. **Patient submits CBC + blood smears** → Django API creates patient
2. **Lab initiates diagnosis** → Frontend calls `POST /api/patients/<id>/diagnose/`
3. **Django creates job** → Returns `202 Accepted` with job ID
4. **Worker polls for pending jobs** → Gets job from database
5. **Worker calls ML service** → Sends image paths and CBC parameters
6. **ML service runs inference** → Returns disease probabilities and detected cells
7. **Worker computes hybrid analysis** → Combines CBC + image scores
8. **Worker stores result** → Updates job and creates DiagnosisResult
9. **Frontend polls job status** → Gets results when complete

## Key Features

- **Async/non-blocking**: Diagnosis submission returns immediately (202 Accepted)
- **Scalable**: Worker and ML service can be scaled independently
- **Resilient**: Job retry logic with exponential backoff
- **Traceable**: Correlation IDs for request tracing across services
- **Isolated**: ML inference cannot crash the API layer
- **Storage-agnostic**: Pluggable storage (local filesystem or S3)

## Backward Compatibility

- **Existing GET endpoint preserved**: `GET /api/patients/<id>/diagnose/` still returns latest diagnosis
- **Frontend polling**: Can poll `GET /api/patients/<id>/diagnosis-jobs/<job_id>/` for status
- **Job results in DB**: Same DiagnosisResult model persisted
