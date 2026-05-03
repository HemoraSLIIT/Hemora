"""Health check endpoints for ML service."""

from fastapi import APIRouter, status
from datetime import datetime
from typing import Dict, Any

from ..core import config, logger
from ..models import ModelRegistry
from .schemas import HealthCheckSchema

router = APIRouter(prefix="/health", tags=["health"])


@router.get(
	"/",
	response_model=HealthCheckSchema,
	status_code=status.HTTP_200_OK,
)
async def health_check() -> HealthCheckSchema:
	"""Basic health check - service is running.

	Returns:
		HealthCheckSchema with service status
	"""
	try:
		available_models = ModelRegistry.available_diseases(config.BASE_MODELS_DIR)
		details = {
			"availableModels": available_models,
			"modelCount": len(available_models),
		}

		return HealthCheckSchema(
			status="healthy",
			timestamp=datetime.utcnow(),
			service_name=config.SERVICE_NAME,
			version=config.SERVICE_VERSION,
			details=details,
		)
	except Exception as e:
		logger.error(f"Health check failed: {e}")
		return HealthCheckSchema(
			status="degraded",
			timestamp=datetime.utcnow(),
			service_name=config.SERVICE_NAME,
			version=config.SERVICE_VERSION,
			details={"error": str(e)},
		)


@router.get(
	"/ready",
	status_code=status.HTTP_200_OK,
)
async def readiness_check():
	"""Readiness check - service is ready to serve requests.

	Returns 200 if all models are loaded, 503 if not ready.
	"""
	try:
		available_models = ModelRegistry.available_diseases(config.BASE_MODELS_DIR)
		if not available_models:
			return {
				"ready": False,
				"message": "No models loaded",
			}

		return {
			"ready": True,
			"availableModels": available_models,
		}
	except Exception as e:
		logger.error(f"Readiness check failed: {e}")
		return {
			"ready": False,
			"error": str(e),
		}
