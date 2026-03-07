"""
Inference utilities for blood disease detection using YOLO models.

run_inference() accepts a bytes/file-like image and optional CBC data,
runs all available YOLO models, and returns structured prediction results.
"""

import io
import time
import logging
import tempfile
import os
from typing import Any

import numpy as np
from PIL import Image

from .loader import DISEASE_MODELS, load_model

logger = logging.getLogger(__name__)

# Class names expected in each model (must match classes used during training)
# SCD class names are read directly from the model (auto-detected from training folders)
DISEASE_CLASSES = {
    "ALL": ["ALLNeg", "ALLPos"],
    "Thalassemia": ["Normal", "Thalassemia"],
    "SCD": [],  # auto-detected from model — matches folder names used during training
}

_EXT_MAP = {
    "JPEG": ".jpg",
    "PNG": ".png",
    "TIFF": ".tiff",
    "BMP": ".bmp",
    "WEBP": ".webp",
}


def _preprocess_image(image_bytes: bytes) -> str:
    """
    Validate image bytes with PIL, convert to RGB, and write to a
    temp file with the correct extension. Returns the temp file path.
    """
    # Step 1: verify the image is not corrupted
    try:
        buf = io.BytesIO(image_bytes)
        img = Image.open(buf)
        img.verify()          # raises if file is corrupt or not a real image
    except Exception as exc:
        raise ValueError(f"Invalid or corrupted image file: {exc}")

    # Step 2: re-open after verify() — verify() exhausts the stream
    buf = io.BytesIO(image_bytes)
    img = Image.open(buf)

    # Step 3: detect the actual format for a correct file extension
    fmt = (img.format or "JPEG").upper()
    ext = _EXT_MAP.get(fmt, ".jpg")

    # Step 4: convert to RGB — YOLO requires 3-channel images
    # This handles RGBA, palette (P), grayscale (L), and 16-bit TIFF
    img = img.convert("RGB")

    # Step 5: write to a temp file with the correct extension
    tmp_fd, tmp_path = tempfile.mkstemp(suffix=ext)
    os.close(tmp_fd)
    img.save(tmp_path)
    return tmp_path


def _run_yolo_classification(model, image_path: str, class_names: list[str]) -> dict:
    """
    Run YOLO classification inference on a single image.

    Returns a dict of {class_name: probability} and the top prediction.
    """
    results = model(image_path, verbose=False)
    result = results[0]

    if result.probs is None:
        raise RuntimeError("Model did not return classification probabilities.")

    probs_tensor = result.probs.data.cpu().numpy()

    # Map each class index to its probability
    class_probs: dict[str, float] = {}
    names = result.names  # dict from model: {0: "ALLNeg", 1: "ALLPos", ...}

    for idx, prob in enumerate(probs_tensor):
        label = names.get(idx, class_names[idx] if idx < len(class_names) else str(idx))
        class_probs[label] = round(float(prob), 6)

    top_label = max(class_probs, key=class_probs.__getitem__)
    top_confidence = class_probs[top_label]

    return {
        "prediction": top_label,
        "confidence": top_confidence,
        "probabilities": class_probs,
    }


def run_inference(image_bytes: bytes, cbc_data: dict | None = None) -> dict[str, Any]:
    """
    Run blood disease inference on an image using all available YOLO models.

    Args:
        image_bytes: Raw bytes of the blood smear image (JPG/PNG).
        cbc_data: Optional CBC values dict. Stored in results but not
                  fed into the YOLO model (image-only model).

    Returns:
        {
            "diseases": {
                "ALL": {"prediction": "ALLPos", "confidence": 0.92, "probabilities": {...}},
                "Thalassemia": {...},
            },
            "cbc_data": {...},        # echoed back
            "models_used": [...],
            "processing_time_ms": 123,
        }
    """
    start = time.monotonic()

    tmp_path = _preprocess_image(image_bytes)
    try:
        disease_results: dict[str, Any] = {}
        models_used: list[str] = []
        errors: dict[str, str] = {}

        for disease_type in DISEASE_MODELS:
            try:
                model = load_model(disease_type)
                class_names = DISEASE_CLASSES.get(disease_type, [])
                result = _run_yolo_classification(model, tmp_path, class_names)
                disease_results[disease_type] = result
                models_used.append(disease_type)
            except FileNotFoundError as exc:
                logger.warning("Model not available for %s: %s", disease_type, exc)
                errors[disease_type] = "Model file not found"
            except Exception as exc:
                logger.error("Inference error for %s: %s", disease_type, exc, exc_info=True)
                errors[disease_type] = str(exc)
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

    elapsed_ms = round((time.monotonic() - start) * 1000, 1)

    return {
        "diseases": disease_results,
        "errors": errors,
        "cbc_data": cbc_data or {},
        "models_used": models_used,
        "processing_time_ms": elapsed_ms,
    }
