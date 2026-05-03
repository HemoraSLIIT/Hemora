"""Core configuration and utilities for ML service."""

from .config import config
from .logging_config import setup_logging, logger

__all__ = ["config", "setup_logging", "logger"]
