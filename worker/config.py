"""Worker configuration and settings."""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


class WorkerConfig:
	"""Configuration for diagnosis job worker."""

	# Service
	SERVICE_NAME = "diagnosis-worker"
	SERVICE_VERSION = "0.1.0"

	# Django backend
	DJANGO_API_URL = os.getenv("DJANGO_API_URL", "http://backend:8000/api")
	DJANGO_API_KEY = os.getenv("DJANGO_API_KEY", "")  # TODO: Implement authentication

	# ML service
	ML_SERVICE_URL = os.getenv("ML_SERVICE_URL", "http://ml_inference:8001/api")
	ML_SERVICE_TIMEOUT = int(os.getenv("ML_SERVICE_TIMEOUT", "310"))

	# Worker settings
	POLL_INTERVAL_SECONDS = int(os.getenv("WORKER_POLL_INTERVAL", "5"))
	BATCH_SIZE = int(os.getenv("WORKER_BATCH_SIZE", "5"))
	MAX_RETRIES = int(os.getenv("WORKER_MAX_RETRIES", "3"))
	RETRY_DELAY_SECONDS = int(os.getenv("WORKER_RETRY_DELAY", "300"))

	# Storage
	STORAGE_TYPE = os.getenv("STORAGE_TYPE", "local")
	STORAGE_BASE_PATH = os.getenv("STORAGE_BASE_PATH", "/app/media")

	# Logging
	LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

	# Health check server
	HEALTHCHECK_PORT = int(os.getenv("WORKER_HEALTHCHECK_PORT", "8002"))

	@classmethod
	def validate(cls):
		"""Validate configuration."""
		if not cls.DJANGO_API_URL:
			raise ValueError("DJANGO_API_URL is required")
		if not cls.ML_SERVICE_URL:
			raise ValueError("ML_SERVICE_URL is required")


config = WorkerConfig()
