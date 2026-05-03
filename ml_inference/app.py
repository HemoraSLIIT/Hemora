"""FastAPI application for ML inference service."""

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from typing import Dict, Any
import logging

from .core import config, logger
from .api import health_router, inference_router

# Create FastAPI app
app = FastAPI(
	title="Hemora ML Inference Service",
	description="Microservice for blood disease ML inference",
	version=config.SERVICE_VERSION,
	docs_url="/docs",
	openapi_url="/openapi.json",
)

# Add middleware
app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],  # TODO: Restrict to Django backend URL
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

# Add trusted hosts middleware
app.add_middleware(
	TrustedHostMiddleware,
	allowed_hosts=["*"],  # TODO: Restrict to known hosts
)


# Include routers
app.include_router(health_router)
app.include_router(inference_router, prefix="/api")


# Root endpoint
@app.get("/", status_code=status.HTTP_200_OK)
async def root() -> Dict[str, Any]:
	"""Root endpoint - service information."""
	return {
		"service": config.SERVICE_NAME,
		"version": config.SERVICE_VERSION,
		"status": "running",
	}


# Startup event
@app.on_event("startup")
async def startup():
	"""Initialize service on startup."""
	try:
		logger.info(f"Starting {config.SERVICE_NAME} v{config.SERVICE_VERSION}")
		config.validate()

		# Pre-load models
		from .models import ModelRegistry
		available = ModelRegistry.available_diseases(config.BASE_MODELS_DIR)
		logger.info(f"Available models: {available}")

	except Exception as e:
		logger.error(f"Startup failed: {e}")
		raise


# Shutdown event
@app.on_event("shutdown")
async def shutdown():
	"""Cleanup on shutdown."""
	logger.info(f"Shutting down {config.SERVICE_NAME}")


if __name__ == "__main__":
	import uvicorn

	uvicorn.run(
		"app:app",
		host=config.HOST,
		port=config.PORT,
		workers=config.WORKERS,
		reload=config.DEBUG,
		log_level=config.LOG_LEVEL.lower(),
	)
