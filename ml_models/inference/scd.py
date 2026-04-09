"""
SCD (Sickle Cell Disease) hybrid inference pipeline.

Two-stage approach:
  1. YOLO detection → find individual cells via bounding boxes
  2. CNN classifier → classify each cropped cell as Sickle / Normal
  3. Aggregate → count sickle vs normal, compute ratio, final prediction

Falls back to the existing YOLO classification model (yolo11_scd_cls_best.pt)
if the hybrid model files are not yet available.

Required model files for hybrid mode (in data/models/):
  - scd_yolo_detect.pt      (YOLO detection model for cell bounding boxes)
  - scd_cell_classifier.pt  (CNN classifier: full model saved with torch.save)

Fallback model (already exists):
  - yolo11_scd_cls_best.pt  (YOLO classification model)
"""

import logging

import numpy as np
import torch
from PIL import Image
from torchvision import transforms

from .loader import load_model, load_model_by_filename

logger = logging.getLogger(__name__)

# ── File names ──
SCD_DET_MODEL_FILE = "scd_yolo_detect.pt"
SCD_CLF_MODEL_FILE = "scd_cell_classifier.pt"

# Minimum crop size in pixels (skip tiny detections)
MIN_CROP_PX = 16

# ImageNet-style transform for the cell classifier
_CLF_TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

# Expected class order from the classifier (index 0 = Normal, index 1 = Sickle)
CLF_CLASS_NAMES = ["Normal", "Sickle"]


def _load_scd_hybrid_models():
    """
    Load both hybrid model files.

    Returns:
        (det_model, clf_model)

    Raises:
        FileNotFoundError if either file is missing.
    """
    det_model, _ = load_model_by_filename(SCD_DET_MODEL_FILE, cache_key="scd_det")
    clf_model, _ = load_model_by_filename(SCD_CLF_MODEL_FILE, cache_key="scd_clf")
    return det_model, clf_model


def _detect_cells(det_model, image_path: str) -> list[dict]:
    """Run YOLO detection, return list of {x1,y1,x2,y2,conf}."""
    results = det_model(image_path, conf=0.25, verbose=False)
    boxes = results[0].boxes

    if boxes is None or len(boxes) == 0:
        return []

    detections = []
    for box in boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
        w, h = x2 - x1, y2 - y1
        if w < MIN_CROP_PX or h < MIN_CROP_PX:
            continue
        detections.append({
            "x1": x1, "y1": y1, "x2": x2, "y2": y2,
            "det_conf": float(box.conf[0]),
        })

    return detections


def _crop_and_classify(clf_model, pil_image: Image.Image, detections: list[dict]) -> list[dict]:
    """Crop each detected cell and classify it. Returns detections with label+conf added."""
    if not detections:
        return detections

    # Build batch of crop tensors
    crops = []
    for det in detections:
        crop = pil_image.crop((det["x1"], det["y1"], det["x2"], det["y2"]))
        crop = crop.convert("RGB")
        crops.append(_CLF_TRANSFORM(crop))

    batch = torch.stack(crops)

    # Run classifier
    with torch.no_grad():
        output = clf_model(batch)
        if isinstance(output, (tuple, list)):
            output = output[0]
        probs = torch.softmax(output, dim=1).cpu().numpy()

    for i, det in enumerate(detections):
        pred_idx = int(np.argmax(probs[i]))
        det["label"] = CLF_CLASS_NAMES[pred_idx]
        det["clf_conf"] = float(probs[i][pred_idx])
        det["probabilities"] = {
            CLF_CLASS_NAMES[j]: round(float(probs[i][j]), 6)
            for j in range(len(CLF_CLASS_NAMES))
        }

    return detections


def _aggregate_results(detections: list[dict]) -> dict:
    """Aggregate per-cell predictions into a final result."""
    sickle_count = sum(1 for d in detections if d.get("label") == "Sickle")
    normal_count = sum(1 for d in detections if d.get("label") == "Normal")
    total = sickle_count + normal_count

    sickle_ratio = sickle_count / max(total, 1)

    # Average confidence of sickle detections
    sickle_confs = [d["clf_conf"] for d in detections if d.get("label") == "Sickle"]
    avg_sickle_conf = sum(sickle_confs) / len(sickle_confs) if sickle_confs else 0.0

    if sickle_ratio >= 0.3:
        prediction = "SCD Positive"
        confidence = round(avg_sickle_conf * sickle_ratio, 6)
    else:
        prediction = "SCD Negative"
        normal_confs = [d["clf_conf"] for d in detections if d.get("label") == "Normal"]
        confidence = round(
            (sum(normal_confs) / len(normal_confs)) if normal_confs else 0.0, 6
        )

    return {
        "prediction": prediction,
        "confidence": confidence,
        "probabilities": {
            "SCD Negative": round(1 - sickle_ratio, 6),
            "SCD Positive": round(sickle_ratio, 6),
        },
        "sickle_count": sickle_count,
        "normal_count": normal_count,
        "detection_count": total,
        "sickle_ratio": round(sickle_ratio, 4),
        "pipeline": "hybrid",
    }


def _run_scd_fallback(image_path: str) -> dict:
    """Fall back to the existing YOLO classification model for SCD."""
    logger.info("SCD hybrid models not available. Falling back to YOLO classification.")
    model, kind = load_model("SCD")

    if kind != "yolo":
        raise RuntimeError("SCD fallback model is not a YOLO model.")

    results = model(image_path, verbose=False)
    result = results[0]

    if result.probs is None:
        raise RuntimeError("SCD fallback YOLO model did not return classification probabilities.")

    probs_tensor = result.probs.data.cpu().numpy()
    names = result.names
    class_probs = {}
    for idx, prob in enumerate(probs_tensor):
        label = names.get(idx, str(idx))
        class_probs[label] = round(float(prob), 6)

    top_label = max(class_probs, key=class_probs.__getitem__)

    return {
        "prediction": top_label,
        "confidence": class_probs[top_label],
        "probabilities": class_probs,
        "pipeline": "fallback_yolo_cls",
    }


def run_scd_inference(image_path: str) -> dict:
    """
    Entry point for SCD inference.

    Tries the hybrid pipeline first. If model files are missing,
    falls back to the existing YOLO classification model.
    """
    try:
        det_model, clf_model = _load_scd_hybrid_models()
    except FileNotFoundError:
        return _run_scd_fallback(image_path)

    # Open image for cropping
    pil_image = Image.open(image_path).convert("RGB")

    # Stage 1: detect cells
    detections = _detect_cells(det_model, image_path)

    if not detections:
        logger.warning("SCD hybrid: no cells detected, falling back to YOLO classification.")
        return _run_scd_fallback(image_path)

    # Stage 2: classify each cell
    detections = _crop_and_classify(clf_model, pil_image, detections)

    # Stage 3: aggregate
    return _aggregate_results(detections)
