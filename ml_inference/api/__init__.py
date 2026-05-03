"""API module for ML inference service."""

from .health import router as health_router
from .routes import router as inference_router

__all__ = ["health_router", "inference_router"]
