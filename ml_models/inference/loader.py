"""
YOLO model loader with singleton pattern.
Loads each disease model once and caches it for reuse.
"""

import os
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# Model registry: disease_type -> loaded model instance
_model_cache: dict = {}

# Supported disease types and their expected model filenames
DISEASE_MODELS = {
    "ALL": "all_yolo_model.pt",
    "Thalassemia": "thalassemia_yolo_model.pt",
    "SCD": "yolo11_scd_cls_best.pt",
}


def get_model_dir() -> Path:
    """Return the configured model directory from Django settings or env."""
    try:
        from django.conf import settings
        model_path = getattr(settings, "ML_MODEL_PATH", None)
        if model_path:
            return Path(model_path)
    except Exception:
        pass
    # Fallback: resolve relative to this file -> project root / data / models
    return Path(__file__).resolve().parent.parent.parent / "data" / "models"


def load_model(disease_type: str):
    """
    Load and cache a YOLO model for the given disease type.

    Args:
        disease_type: One of the keys in DISEASE_MODELS ("ALL", "Thalassemia")

    Returns:
        Loaded ultralytics YOLO model instance.

    Raises:
        ValueError: If disease_type is not supported.
        FileNotFoundError: If the model file does not exist.
    """
    if disease_type not in DISEASE_MODELS:
        raise ValueError(
            f"Unsupported disease type: {disease_type!r}. "
            f"Supported types: {list(DISEASE_MODELS.keys())}"
        )

    if disease_type in _model_cache:
        return _model_cache[disease_type]

    from ultralytics import YOLO  # imported here to avoid hard dep at module load

    model_dir = get_model_dir()
    model_filename = DISEASE_MODELS[disease_type]
    model_path = model_dir / model_filename

    if not model_path.exists():
        raise FileNotFoundError(
            f"Model file not found: {model_path}. "
            f"Place the trained YOLO .pt file at that path."
        )

    logger.info("Loading YOLO model for %s from %s", disease_type, model_path)
    model = YOLO(str(model_path))
    _model_cache[disease_type] = model
    logger.info("Model for %s loaded and cached.", disease_type)
    return model


def clear_cache():
    """Clear the in-memory model cache (useful for testing)."""
    _model_cache.clear()
