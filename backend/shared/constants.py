"""Shared constants for Hemora microservices."""

# HTTP Status Codes
ACCEPTED_202 = 202
CONFLICT_409 = 409

# Job processing constants
DEFAULT_MAX_RETRIES = 3
JOB_PROCESSING_TIMEOUT_SECONDS = 300  # 5 minutes
JOB_POLL_INTERVAL_SECONDS = 5

# ML Service configuration
ML_SERVICE_REQUEST_TIMEOUT = 310  # 5+ minutes buffer for actual processing
ML_SERVICE_MAX_RETRIES = 3

# Image constraints
MAX_IMAGE_SIZE_MB = 50
ALLOWED_IMAGE_FORMATS = {"png", "jpg", "jpeg", "tiff"}

# Storage paths
BLOOD_SMEAR_UPLOAD_PREFIX = "patients/blood_smear"
ANNOTATED_IMAGE_PREFIX = "patients/annotated"
