"""Structured logging utilities with correlation ID support for request tracing."""

import logging
import json
import uuid
from contextlib import contextmanager
from typing import Optional, Dict, Any
from contextvars import ContextVar
from datetime import datetime

# Context variable to store correlation ID for this request
correlation_id_var: ContextVar[str] = ContextVar("correlation_id", default="")


def get_correlation_id() -> str:
	"""Get current correlation ID from context."""
	return correlation_id_var.get()


def set_correlation_id(correlation_id: str):
	"""Set correlation ID in context."""
	correlation_id_var.set(correlation_id)


@contextmanager
def correlation_context(correlation_id: Optional[str] = None):
	"""Context manager for setting correlation ID.

	Usage:
		with correlation_context(job_id):
			logger.info("Processing job")
	"""
	cid = correlation_id or str(uuid.uuid4())
	token = correlation_id_var.set(cid)
	try:
		yield cid
	finally:
		correlation_id_var.reset(token)


class CorrelationIdFilter(logging.Filter):
	"""Logging filter that adds correlation ID to all records."""

	def filter(self, record: logging.LogRecord) -> bool:
		record.correlation_id = get_correlation_id()
		return True


class StructuredFormatter(logging.Formatter):
	"""JSON structured formatter for logs."""

	def format(self, record: logging.LogRecord) -> str:
		log_obj = {
			"timestamp": datetime.utcnow().isoformat() + "Z",
			"level": record.levelname,
			"logger": record.name,
			"message": record.getMessage(),
			"correlation_id": getattr(record, "correlation_id", ""),
		}

		if record.exc_info:
			log_obj["exception"] = self.formatException(record.exc_info)

		# Add extra fields from LogRecord
		for key, value in record.__dict__.items():
			if key not in (
				"name", "msg", "args", "created", "filename", "funcName",
				"levelname", "levelno", "lineno", "module", "msecs", "message",
				"pathname", "process", "processName", "relativeCreated", "thread",
				"threadName", "exc_info", "exc_text", "stack_info", "getMessage",
				"correlation_id",
			):
				log_obj[key] = str(value)

		return json.dumps(log_obj)


def setup_logging(logger_name: str, level: int = logging.INFO) -> logging.Logger:
	"""Setup structured logging for a logger.

	Usage:
		logger = setup_logging(__name__)
		logger.info("Starting service")
	"""
	logger = logging.getLogger(logger_name)
	logger.setLevel(level)

	# Remove existing handlers
	logger.handlers = []

	# Create console handler
	handler = logging.StreamHandler()
	handler.setLevel(level)

	# Add correlation ID filter
	handler.addFilter(CorrelationIdFilter())

	# Setup structured formatter
	formatter = StructuredFormatter()
	handler.setFormatter(formatter)

	logger.addHandler(handler)
	return logger


def log_job_event(
	logger: logging.Logger,
	event: str,
	job_id: str,
	status: str,
	metadata: Optional[Dict[str, Any]] = None,
):
	"""Log a structured job event.

	Usage:
		log_job_event(logger, "job_started", job_id, "running", {"patient_id": 123})
	"""
	extra = {
		"event": event,
		"job_id": job_id,
		"status": status,
		**(metadata or {}),
	}
	logger.info(f"Job event: {event}", extra=extra)
