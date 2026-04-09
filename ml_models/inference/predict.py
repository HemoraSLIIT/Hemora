"""
Inference utilities for blood disease detection.

run_inference() accepts a bytes/file-like image and optional CBC data,
runs all available models, and returns structured prediction results.
Supports YOLO classification, YOLO detection, and plain PyTorch models.
"""

import io
import time
import logging
import tempfile
import os
from typing import Any

import numpy as np
import torch
from PIL import Image
from torchvision import transforms

from .loader import DISEASE_MODELS, load_model

logger = logging.getLogger(__name__)

# Class names expected in each model (must match classes used during training)
# SCD class names are read directly from the model (auto-detected from training folders)
DISEASE_CLASSES = {
    "ALL": ["ALLNeg", "ALLPos"],
    "Thalassemia": ["Normal", "Thalassemia"],
    "SCD": [],
    "IDA": []  # auto-detected from model — matches folder names used during training
}

_EXT_MAP = {
    "JPEG": ".jpg",
    "PNG": ".png",
    "TIFF": ".tiff",
    "BMP": ".bmp",
    "WEBP": ".webp",
}

# Default transform for plain PyTorch models (ImageNet-style)
_TORCH_TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])


def _preprocess_image(image_bytes: bytes) -> tuple[str, Image.Image]:
    """
    Validate image bytes with PIL, convert to RGB, and write to a
    temp file with the correct extension. Returns (temp_file_path, PIL_image).
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

    # Step 4: convert to RGB — models require 3-channel images
    img = img.convert("RGB")

    # Step 5: write to a temp file with the correct extension
    tmp_fd, tmp_path = tempfile.mkstemp(suffix=ext)
    os.close(tmp_fd)
    img.save(tmp_path)
    return tmp_path, img


def _parse_yolo_classification(result, class_names: list[str]) -> dict:
    """Parse a YOLO classification result. Returns prediction + probabilities."""
    probs_tensor = result.probs.data.cpu().numpy()
    class_probs: dict[str, float] = {}
    names = result.names

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


def _parse_yolo_detection(result, class_names: list[str]) -> dict:
    """Parse a YOLO detection result. Aggregates detections into class counts/confidences."""
    boxes = result.boxes
    names = result.names

    if boxes is None or len(boxes) == 0:
        return {
            "prediction": "No detections",
            "confidence": 0.0,
            "probabilities": {},
            "detection_count": 0,
        }

    # Aggregate: count detections per class and average confidence
    class_counts: dict[str, list[float]] = {}
    for box in boxes:
        cls_id = int(box.cls.item())
        conf = float(box.conf.item())
        label = names.get(cls_id, class_names[cls_id] if cls_id < len(class_names) else str(cls_id))
        class_counts.setdefault(label, []).append(conf)

    class_probs = {}
    for label, confs in class_counts.items():
        class_probs[label] = round(sum(confs) / len(confs), 6)

    top_label = max(class_probs, key=class_probs.__getitem__)

    return {
        "prediction": top_label,
        "confidence": class_probs[top_label],
        "probabilities": class_probs,
        "detection_count": len(boxes),
    }


def _run_torch_inference(model, pil_image: Image.Image, class_names: list[str]) -> dict:
    """Run plain PyTorch model inference on a PIL image."""
    tensor = _TORCH_TRANSFORM(pil_image).unsqueeze(0)

    with torch.no_grad():
        output = model(tensor)

    # Handle different output shapes
    if isinstance(output, (tuple, list)):
        output = output[0]

    probs = torch.softmax(output, dim=1).squeeze().cpu().numpy()

    # If model outputs a single value (binary sigmoid)
    if probs.ndim == 0 or (probs.ndim == 1 and len(probs) == 1):
        prob_val = float(probs) if probs.ndim == 0 else float(probs[0])
        # Use class names if provided, otherwise default
        pos_label = class_names[1] if len(class_names) > 1 else "positive"
        neg_label = class_names[0] if len(class_names) > 0 else "negative"
        class_probs = {neg_label: round(1 - prob_val, 6), pos_label: round(prob_val, 6)}
    else:
        class_probs = {}
        for idx, prob in enumerate(probs):
            label = class_names[idx] if idx < len(class_names) else str(idx)
            class_probs[label] = round(float(prob), 6)

    top_label = max(class_probs, key=class_probs.__getitem__)
    top_confidence = class_probs[top_label]

    return {
        "prediction": top_label,
        "confidence": top_confidence,
        "probabilities": class_probs,
    }


def _run_model(model, kind: str, image_path: str, pil_image: Image.Image, class_names: list[str]) -> dict:
    """Route inference to the correct handler based on model kind."""
    if kind == "yolo":
        # Single inference call, then dispatch based on result type
        results = model(image_path, verbose=False)
        result = results[0]
        if result.probs is not None:
            return _parse_yolo_classification(result, class_names)
        elif result.boxes is not None:
            return _parse_yolo_detection(result, class_names)
        else:
            raise RuntimeError("YOLO model returned neither classification probabilities nor detection boxes.")
    elif kind == "torch":
        return _run_torch_inference(model, pil_image, class_names)
    else:
        raise RuntimeError(f"Unknown model kind: {kind}")


def run_inference(image_bytes: bytes, cbc_data: dict | None = None) -> dict[str, Any]:
    """
    Run blood disease inference on an image using all available models.

    Args:
        image_bytes: Raw bytes of the blood smear image (JPG/PNG).
        cbc_data: Optional CBC values dict. Stored in results but not
                  fed into the model (image-only models).

    Returns:
        {
            "diseases": {
                "ALL": {"prediction": "ALLPos", "confidence": 0.92, "probabilities": {...}},
                "Thalassemia": {...},
            },
            "cbc_data": {...},
            "models_used": [...],
            "processing_time_ms": 123,
        }
    """
    start = time.monotonic()

    tmp_path, pil_image = _preprocess_image(image_bytes)
    try:
        disease_results: dict[str, Any] = {}
        models_used: list[str] = []
        errors: dict[str, str] = {}

        # Diseases with custom pipelines — handled separately
        CUSTOM_PIPELINES = {"Thalassemia", "SCD"}

        for disease_type in DISEASE_MODELS:
            if disease_type in CUSTOM_PIPELINES:
                continue
            try:
                model, kind = load_model(disease_type)
                class_names = DISEASE_CLASSES.get(disease_type, [])
                result = _run_model(model, kind, tmp_path, pil_image, class_names)
                disease_results[disease_type] = result
                models_used.append(disease_type)
                logger.info("Inference OK for %s (kind=%s): %s", disease_type, kind, result.get("prediction"))
            except FileNotFoundError as exc:
                logger.warning("Model not available for %s: %s", disease_type, exc)
                errors[disease_type] = "Model file not found"
            except Exception as exc:
                logger.error("Inference error for %s: %s", disease_type, exc, exc_info=True)
                errors[disease_type] = str(exc)

        # Thalassemia — custom hybrid pipeline (YOLO detection + SmartHybridNet)
        if "Thalassemia" in DISEASE_MODELS:
            try:
                from .thalassemia import run_thalassemia_inference
                result = run_thalassemia_inference(tmp_path)
                disease_results["Thalassemia"] = result
                models_used.append("Thalassemia")
                logger.info("Inference OK for Thalassemia (hybrid): %s", result.get("prediction"))
            except (FileNotFoundError, ImportError) as exc:
                logger.warning("Thalassemia pipeline not available: %s", exc)
                errors["Thalassemia"] = str(exc)
            except Exception as exc:
                logger.error("Thalassemia inference error: %s", exc, exc_info=True)
                errors["Thalassemia"] = str(exc)

        # SCD — custom hybrid pipeline (YOLO detection + cell classifier)
        if "SCD" in DISEASE_MODELS:
            try:
                from .scd import run_scd_inference
                result = run_scd_inference(tmp_path)
                disease_results["SCD"] = result
                models_used.append("SCD")
                logger.info("Inference OK for SCD (%s): %s", result.get("pipeline"), result.get("prediction"))
            except (FileNotFoundError, ImportError) as exc:
                logger.warning("SCD pipeline not available: %s", exc)
                errors["SCD"] = str(exc)
            except Exception as exc:
                logger.error("SCD inference error: %s", exc, exc_info=True)
                errors["SCD"] = str(exc)
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
