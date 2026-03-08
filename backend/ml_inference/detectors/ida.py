"""
Iron Deficiency Anemia (IDA) detector.

Pipeline (from Colab notebooks):
  1. ResNet50 (PyTorch, state_dict) — binary classification: Healthy vs IDA
  2. YOLOv8s — detects 4 cell types: Anisocytosis, Hypochromia, Microcytosis, Pencil cells
  3. Hybrid scoring: ResNet50 probability (60%) + YOLO-based score (40%)

Required model files in models_dir:
  - ida_yolo_best.pt           (YOLOv8s detection model)
  - ida_resnet50_best.pt       (ResNet50 state_dict, 2-class)
"""

import logging
import os

import cv2
import numpy as np
import torch
import torch.nn as nn
from torchvision import models, transforms

from ..base_detector import ABCBaseDetector, DetectionResult

logger = logging.getLogger(__name__)

# YOLO class names (alphabetical from data.yaml)
CLASS_NAMES = ["Anisocytosis", "Hypochromia", "Microcytosis", "Pencil cells"]

# Colors for each class (RGB)
COLORS_RGB = {
    0: (255, 165, 0),    # Anisocytosis  → Orange
    1: (50, 100, 255),   # Hypochromia   → Blue
    2: (255, 50, 50),    # Microcytosis  → Red
    3: (50, 200, 50),    # Pencil cells  → Green
}

# ResNet50 classes (ImageFolder alphabetical)
RESNET_CLASSES = ["Healthy", "IDA"]


class IDADetector(ABCBaseDetector):
    YOLO_WEIGHTS = "ida_yolo_best.pt"
    RESNET_WEIGHTS = "ida_resnet50_best.pt"

    def __init__(self, models_dir):
        self.models_dir = models_dir
        self.yolo_model = None
        self.resnet_model = None
        # Matches notebook: Resize + ToTensor, no ImageNet normalization
        self.resnet_transform = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
        ])

    @property
    def disease_name(self):
        return "Iron Deficiency Anemia (IDA)"

    def is_available(self):
        return all(
            os.path.exists(os.path.join(self.models_dir, f))
            for f in [self.YOLO_WEIGHTS, self.RESNET_WEIGHTS]
        )

    def load_models(self):
        from ultralytics import YOLO

        yolo_path = os.path.join(self.models_dir, self.YOLO_WEIGHTS)
        resnet_path = os.path.join(self.models_dir, self.RESNET_WEIGHTS)

        # Load YOLO
        self.yolo_model = YOLO(yolo_path)
        logger.info("Loaded IDA YOLO model: %s", yolo_path)

        # Load ResNet50 (state_dict)
        self.resnet_model = models.resnet50(weights=None)
        self.resnet_model.fc = nn.Linear(self.resnet_model.fc.in_features, 2)
        state_dict = torch.load(resnet_path, map_location="cpu", weights_only=True)
        self.resnet_model.load_state_dict(state_dict)
        self.resnet_model.eval()
        logger.info("Loaded IDA ResNet50 model: %s", resnet_path)

    def predict(self, image_path: str) -> DetectionResult:
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not read image: {image_path}")

        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        annotated = img_rgb.copy()

        # ----- Stage 1: ResNet50 classification -----
        img_tensor = self.resnet_transform(img_rgb).unsqueeze(0)
        with torch.no_grad():
            output = self.resnet_model(img_tensor)
            probs = torch.softmax(output, dim=1)
            # IDA class is index 1
            resnet_prob = probs[0][1].item()

        # ----- Stage 2: YOLO detection -----
        pred = self.yolo_model(image_path, conf=0.25, iou=0.45, imgsz=640, verbose=False)[0]

        counts = {name: 0 for name in CLASS_NAMES}
        total_detections = 0

        if pred.boxes is not None:
            for box in pred.boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                x1, y1, x2, y2 = map(int, box.xyxy[0])

                if cls_id < len(CLASS_NAMES):
                    counts[CLASS_NAMES[cls_id]] += 1
                    total_detections += 1
                    c = COLORS_RGB.get(cls_id, (255, 255, 0))
                    cv2.rectangle(annotated, (x1, y1), (x2, y2), c, 2)
                    label = f"{CLASS_NAMES[cls_id]} {conf:.2f}"
                    (lw, lh), _ = cv2.getTextSize(
                        label, cv2.FONT_HERSHEY_SIMPLEX, 0.42, 1
                    )
                    cv2.rectangle(
                        annotated, (x1, y1 - lh - 5), (x1 + lw + 2, y1), c, -1
                    )
                    cv2.putText(
                        annotated, label, (x1 + 1, y1 - 3),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.42, (255, 255, 255), 1,
                    )

        # ----- Stage 3: YOLO-based score -----
        # Score based on how many of the 4 markers are present
        markers_present = sum(1 for c in counts.values() if c > 0)
        yolo_score = min(markers_present / 4.0, 1.0)

        # Boost if many detections found
        if total_detections >= 10:
            yolo_score = min(yolo_score + 0.2, 1.0)

        # ----- Hybrid scoring -----
        probability = (resnet_prob * 0.6) + (yolo_score * 0.4)
        probability = min(0.999, probability)

        # Encode annotated image
        annotated_bgr = cv2.cvtColor(annotated, cv2.COLOR_RGB2BGR)
        _, buffer = cv2.imencode(".png", annotated_bgr)
        annotated_bytes = buffer.tobytes()

        return DetectionResult(
            disease_name=self.disease_name,
            probability=probability,
            confidence=probability,
            detected_cells=[
                {"class": name, "count": counts[name]}
                for name in CLASS_NAMES
            ],
            annotated_image_bytes=annotated_bytes,
            feature_vector=[resnet_prob, yolo_score, float(total_detections)],
            raw_detections=total_detections,
        )
