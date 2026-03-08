"""
Model loader with singleton pattern.
Loads each disease model once and caches it for reuse.
Supports YOLO models (via ultralytics) and plain PyTorch models (via torch.load).
"""

import logging
from collections import OrderedDict
from pathlib import Path

import torch

logger = logging.getLogger(__name__)

# Model registry: cache_key -> (model, kind)
_model_cache: dict = {}

# Supported disease types and their expected model filenames
DISEASE_MODELS = {
    "ALL": "best.pt",
    "Thalassemia": "best_smart_hybrid.pt",
    "SCD": "yolo11_scd_cls_best.pt",
    "IDA": "resnet.pt",
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


def _load_file(model_path: Path) -> tuple:
    """
    Try loading a .pt file — YOLO first, then torch.load fallback.

    Returns:
        (model_object, kind_str)  where kind is "yolo" or "torch".

    Raises:
        RuntimeError: if the file is a bare state_dict (OrderedDict of tensors).
    """
    # --- attempt 1: YOLO ---
    try:
        from ultralytics import YOLO
        model = YOLO(str(model_path))
        logger.info("Loaded as YOLO model: %s", model_path.name)
        return model, "yolo"
    except Exception as yolo_err:
        logger.debug("YOLO load failed for %s: %s", model_path.name, yolo_err)

    # --- attempt 2: plain torch ---
    obj = torch.load(str(model_path), map_location="cpu", weights_only=False)

    # Guard: if it's just a state_dict, we can't call it directly
    if isinstance(obj, OrderedDict):
        # Check if values are tensors (state_dict signature)
        sample_vals = list(obj.values())[:3]
        if sample_vals and all(isinstance(v, torch.Tensor) for v in sample_vals):
            raise RuntimeError(
                f"{model_path.name} contains only model weights (state_dict), not a "
                f"complete model. Use a custom pipeline that defines the architecture "
                f"and loads these weights."
            )

    if not callable(obj):
        raise RuntimeError(
            f"{model_path.name} loaded but is not callable "
            f"(type: {type(obj).__name__}). Cannot run inference."
        )

    obj.eval()
    logger.info("Loaded as PyTorch model: %s", model_path.name)
    return obj, "torch"


def load_model(disease_type: str) -> tuple:
    """
    Load and cache a model for the given disease type.

    Args:
        disease_type: One of the keys in DISEASE_MODELS.

    Returns:
        (model, kind) — kind is "yolo" or "torch".

    Raises:
        ValueError:  If disease_type is not in DISEASE_MODELS.
        FileNotFoundError: If the model file does not exist on disk.
        RuntimeError: If the file is a bare state_dict.
    """
    if disease_type not in DISEASE_MODELS:
        raise ValueError(
            f"Unsupported disease type: {disease_type!r}. "
            f"Supported types: {list(DISEASE_MODELS.keys())}"
        )

    if disease_type in _model_cache:
        return _model_cache[disease_type]

    model_dir = get_model_dir()
    model_path = model_dir / DISEASE_MODELS[disease_type]

    if not model_path.exists():
        raise FileNotFoundError(
            f"Model file not found: {model_path}. "
            f"Place the trained .pt file at that path."
        )

    result = _load_file(model_path)
    _model_cache[disease_type] = result
    logger.info("Model for %s loaded and cached (kind=%s).", disease_type, result[1])
    return result


def load_model_by_filename(filename: str, cache_key: str | None = None) -> tuple:
    """
    Load a model by filename (not by disease key).

    Used by custom pipelines (scd.py, thalassemia.py) that need to load
    multiple model files for a single disease.

    Args:
        filename:  File name inside the model directory (e.g. "scd_yolo_detect.pt").
        cache_key: Optional cache key. Defaults to the filename.

    Returns:
        (model, kind) — kind is "yolo" or "torch".
    """
    key = cache_key or filename
    if key in _model_cache:
        return _model_cache[key]

    model_dir = get_model_dir()
    model_path = model_dir / filename

    if not model_path.exists():
        raise FileNotFoundError(
            f"Model file not found: {model_path}. "
            f"Place the trained .pt file at that path."
        )

    result = _load_file(model_path)
    _model_cache[key] = result
    logger.info("Model '%s' loaded and cached (kind=%s).", filename, result[1])
    return result


def clear_cache():
    """Clear the in-memory model cache (useful for testing)."""
    _model_cache.clear()
