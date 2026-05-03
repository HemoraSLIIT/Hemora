"""
Beta Thalassemia Minor detector.

Pipeline (from Colab notebooks):
  1. YOLOv8s object detection → detects hypochromic_cell, microcyte, target_cell
  2. Extract 10 medical features from YOLO detection counts
  3. StandardScaler normalizes features
  4. SmartHybridNet (ResNet-inspired DNN) → sigmoid probability (0-1)

Required model files in models_dir:
  - thal_yolo_best.pt       (Ultralytics YOLOv8s detection model)
  - thal_hybrid_best.pt     (SmartHybridNet state_dict)
  - thal_scaler.pkl         (sklearn StandardScaler, fitted during training)
"""

import logging
import os
import pickle

import cv2
import numpy as np
import torch
import torch.nn as nn

from ..base_detector import ABCBaseDetector, DetectionResult

logger = logging.getLogger(__name__)

CLASS_NAMES = ["hypochromic_cell", "microcyte", "target_cell"]

COLORS_RGB = {
    0: (50, 200, 50),   # hypochromic_cell → Green
    1: (50, 100, 255),  # microcyte        → Blue
    2: (255, 50, 50),   # target_cell      → Red
}


class SmartHybridNet(nn.Module):
    """Exact architecture from HEMORA_SmartHybrid_Training_Only.ipynb."""

    def __init__(self, input_dim=10, dropout=0.3):
        super().__init__()

        self.input_layer = nn.Sequential(
            nn.Linear(input_dim, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Dropout(dropout),
        )

        self.res1 = nn.Sequential(
            nn.Linear(64, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(64, 64),
            nn.BatchNorm1d(64),
        )
        self.relu1 = nn.ReLU()

        self.res2 = nn.Sequential(
            nn.Linear(64, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(128, 128),
            nn.BatchNorm1d(128),
        )
        self.proj2 = nn.Linear(64, 128)
        self.relu2 = nn.ReLU()

        self.output = nn.Sequential(
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Sigmoid(),
        )

    def forward(self, x):
        x = self.input_layer(x)

        residual = x
        x = self.relu1(self.res1(x) + residual)

        residual = self.proj2(x)
        x = self.relu2(self.res2(x) + residual)

        return self.output(x).squeeze(1)


class ThalassemiaDetector(ABCBaseDetector):
    YOLO_WEIGHTS = "thal_yolo_best.pt"
    HYBRID_WEIGHTS = "thal_hybrid_best.pt"
    SCALER_FILE = "thal_scaler.pkl"

    def __init__(self, models_dir):
        self.models_dir = models_dir
        self.yolo_model = None
        self.hybrid_model = None
        self.scaler = None

    @property
    def disease_name(self):
        return "Beta Thalassemia Minor"

    def is_available(self):
        return all(
            os.path.exists(os.path.join(self.models_dir, f))
            for f in [self.YOLO_WEIGHTS, self.HYBRID_WEIGHTS, self.SCALER_FILE]
        )

    def load_models(self):
        from ultralytics import YOLO

        yolo_path = os.path.join(self.models_dir, self.YOLO_WEIGHTS)
        hybrid_path = os.path.join(self.models_dir, self.HYBRID_WEIGHTS)
        scaler_path = os.path.join(self.models_dir, self.SCALER_FILE)

        self.yolo_model = YOLO(yolo_path)
        logger.info("Loaded YOLO detection model: %s", yolo_path)

        self.hybrid_model = SmartHybridNet(input_dim=10, dropout=0.3)
        state_dict = torch.load(hybrid_path, map_location="cpu", weights_only=True)
        self.hybrid_model.load_state_dict(state_dict)
        self.hybrid_model.eval()
        logger.info("Loaded SmartHybridNet: %s", hybrid_path)

        with open(scaler_path, "rb") as f:
            self.scaler = pickle.load(f)
        logger.info("Loaded feature scaler: %s", scaler_path)

    def predict(self, image_path: str) -> DetectionResult:
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not read image: {image_path}")

        h, w = img.shape[:2]
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        annotated = img_rgb.copy()

        # Stage 1: YOLO detection
        pred = self.yolo_model(image_path, conf=0.25, iou=0.45, verbose=False)[0]

        counts = {name: 0 for name in CLASS_NAMES}
        if pred.boxes is not None:
            for box in pred.boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                x1, y1, x2, y2 = map(int, box.xyxy[0])

                if cls_id < len(CLASS_NAMES):
                    counts[CLASS_NAMES[cls_id]] += 1
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

        target = counts["target_cell"]
        hypochromic = counts["hypochromic_cell"]
        microcyte = counts["microcyte"]
        total = target + hypochromic + microcyte

        # Stage 2: Extract 10 features (same as Colab notebook)
        features = np.array(
            [[
                float(target),
                float(hypochromic),
                float(microcyte),
                float(total),
                target / max(total, 1),
                hypochromic / max(total, 1),
                microcyte / max(total, 1),
                (target * 0.5 + hypochromic * 0.3 + microcyte * 0.2)
                / max(total, 1),
                total / ((h * w) / 1e6),
                float(target > hypochromic and target > microcyte),
            ]],
            dtype=np.float32,
        )

        # Stage 3: Scale features
        features_scaled = self.scaler.transform(features)

        # Stage 4: SmartHybridNet prediction
        with torch.no_grad():
            feat_tensor = torch.FloatTensor(features_scaled)
            probability = self.hybrid_model(feat_tensor).item()

        probability = min(0.999, probability)

        # Encode annotated image as PNG bytes
        annotated_bgr = cv2.cvtColor(annotated, cv2.COLOR_RGB2BGR)
        _, buffer = cv2.imencode(".png", annotated_bgr)
        annotated_bytes = buffer.tobytes()

        return DetectionResult(
            disease_name=self.disease_name,
            probability=probability,
            confidence=probability,
            detected_cells=[
                {"class": "target_cell", "count": target},
                {"class": "hypochromic_cell", "count": hypochromic},
                {"class": "microcyte", "count": microcyte},
            ],
            annotated_image_bytes=annotated_bytes,
            feature_vector=features[0].tolist(),
            raw_detections=total,
        )
