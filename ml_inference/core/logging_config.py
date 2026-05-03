"""Logging configuration for ML service."""

import logging
import json
import sys
from datetime import datetime
from .config import config

class JSONFormatter(logging.Formatter):
	"""JSON formatter for structured logging."""

	def format(self, record: logging.LogRecord) -> str:
		log_obj = {
			"timestamp": datetime.utcnow().isoformat() + "Z",
			"level": record.levelname,
			"logger": record.name,
			"message": record.getMessage(),
		}

		# Add correlation ID if available
		if hasattr(record, "correlation_id"):
			log_obj["correlation_id"] = record.correlation_id

		# Add exception if present
		if record.exc_info:
			log_obj["exception"] = self.formatException(record.exc_info)

		return json.dumps(log_obj)


def setup_logging(logger_name: str = __name__) -> logging.Logger:
	"""Setup structured logging."""
	logger = logging.getLogger(logger_name)
	logger.setLevel(getattr(logging, config.LOG_LEVEL))

	# Remove existing handlers
	logger.handlers = []

	# Console handler with JSON formatter
	handler = logging.StreamHandler(sys.stdout)
	handler.setFormatter(JSONFormatter())
	logger.addHandler(handler)

	return logger


# Root logger for the service
logger = setup_logging("ml_inference")
