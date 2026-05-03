"""Core configuration for ML inference service."""

import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

# Load environment
load_dotenv()

class Config:
	"""Configuration for ML service."""

	# Service metadata
	SERVICE_NAME = "ml-inference-service"
	SERVICE_VERSION = "0.1.0"

	# Server
	HOST = os.getenv("ML_SERVICE_HOST", "0.0.0.0")
	PORT = int(os.getenv("ML_SERVICE_PORT", "8001"))
	WORKERS = int(os.getenv("ML_SERVICE_WORKERS", "1"))
	DEBUG = os.getenv("ML_SERVICE_DEBUG", "False").lower() == "true"

	# Model paths
	BASE_MODELS_DIR = os.getenv("ML_MODELS_DIR", "/app/models")

	# Storage
	STORAGE_TYPE = os.getenv("STORAGE_TYPE", "local")  # "local" or "s3"
	STORAGE_BASE_PATH = os.getenv("STORAGE_BASE_PATH", "/app/media")

	# S3 (if applicable)
	S3_ENDPOINT = os.getenv("S3_ENDPOINT", "")
	S3_BUCKET = os.getenv("S3_BUCKET", "")
	S3_REGION = os.getenv("S3_REGION", "us-east-1")

	# Inference
	INFERENCE_TIMEOUT = int(os.getenv("INFERENCE_TIMEOUT", "300"))
	MAX_IMAGE_SIZE_MB = int(os.getenv("MAX_IMAGE_SIZE_MB", "50"))

	# Logging
	LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

	# Django backend (for callbacks, if needed)
	DJANGO_API_URL = os.getenv("DJANGO_API_URL", "http://backend:8000/api")
	DJANGO_API_KEY = os.getenv("DJANGO_API_KEY", "")  # TODO: Implement API key auth

	@classmethod
	def validate(cls):
		"""Validate critical configuration."""
		if not Path(cls.BASE_MODELS_DIR).exists():
			raise ValueError(f"Model directory not found: {cls.BASE_MODELS_DIR}")

config = Config()
