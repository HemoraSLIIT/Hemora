"""
Sickle Cell Anemia detector.

Pipeline (from Colab notebooks):
  1. YOLOv8n detection → bounding boxes around cells
  2. Crop each detected cell (with 10% padding)
  3. R-CNN (ResNet-18) classifies each crop → Normal / Sickle
  4. Aggregate: sickle_ratio = sickle_count / total_cells
  5. If sickle_ratio > 0.3 → SCD Positive

Required model files in models_dir:
  - scd_yolov8_local_detect.pt       (YOLOv8n detection model)
  - scd_rcnn_local_classifier.pt     (ResNet-18 R-CNN classifier, full model)
"""

import logging
import os
import sys

import cv2
import numpy as np
import torch
import torch.nn as nn
from PIL import Image
from torchvision import transforms, models

from ..base_detector import ABCBaseDetector, DetectionResult

logger = logging.getLogger(__name__)

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

SICKLE_RATIO_THRESHOLD = 0.3

# Colors for annotation
COLOR_SICKLE = (255, 50, 50)   # Red
COLOR_NORMAL = (50, 200, 50)   # Green


class RCNNCellClassifier(nn.Module):
    """Exact architecture from rcnn_local.ipynb — needed for torch.load()."""

    def __init__(self, num_classes=2, backbone="resnet18", pretrained=False,
                 freeze_backbone=True):
        super().__init__()

        if backbone == "resnet18":
            base = models.resnet18(weights=None)
        elif backbone == "resnet34":
            base = models.resnet34(weights=None)
        elif backbone == "resnet50":
            base = models.resnet50(weights=None)
        else:
            raise ValueError(f"Unsupported backbone: {backbone}")

        self.features = nn.Sequential(*list(base.children())[:-2])
        feat_dim = base.fc.in_features

        self.roi_pool = nn.AdaptiveAvgPool2d((4, 4))

        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(feat_dim * 4 * 4, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(inplace=True),
            nn.Dropout(0.6),
            nn.Linear(256, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(inplace=True),
            nn.Dropout(0.4),
            nn.Linear(128, num_classes),
        )

    def forward(self, x):
        features = self.features(x)
        pooled = self.roi_pool(features)
        logits = self.classifier(pooled)
        return logits


class SickleCellDetector(ABCBaseDetector):
    YOLO_WEIGHTS = "scd_yolov8_local_detect.pt"
    RCNN_WEIGHTS = "scd_rcnn_local_classifier.pt"

    def __init__(self, models_dir):
        self.models_dir = models_dir
        self.yolo_model = None
        self.rcnn_model = None
        self.rcnn_classes = None
        self.rcnn_transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
        ])

    @property
    def disease_name(self):
        return "Sickle Cell Anemia"

    def is_available(self):
        return all(
            os.path.exists(os.path.join(self.models_dir, f))
            for f in [self.YOLO_WEIGHTS, self.RCNN_WEIGHTS]
        )

    def load_models(self):
        from ultralytics import YOLO

        yolo_path = os.path.join(self.models_dir, self.YOLO_WEIGHTS)
        rcnn_path = os.path.join(self.models_dir, self.RCNN_WEIGHTS)

        # Load YOLO
        self.yolo_model = YOLO(yolo_path)
        logger.info("Loaded SCD YOLO model: %s", yolo_path)

        # Load R-CNN (saved as full model, not state_dict)
        # Register class in __main__ so torch.load can unpickle it
        import __main__
        if not hasattr(__main__, "RCNNCellClassifier"):
            __main__.RCNNCellClassifier = RCNNCellClassifier
        self.rcnn_model = torch.load(rcnn_path, map_location="cpu", weights_only=False)
        self.rcnn_model.eval()
        logger.info("Loaded SCD R-CNN model: %s", rcnn_path)

        # Determine R-CNN output classes from last Linear layer
        num_classes = None
        for module in reversed(list(self.rcnn_model.classifier.modules())):
            if isinstance(module, torch.nn.Linear):
                num_classes = module.out_features
                break

        if num_classes and num_classes >= 2:
            self.rcnn_classes = ["Normal", "Sickle"]
        else:
            # Single class output — all detections are Sickle
            self.rcnn_classes = ["Sickle"]

        logger.info("SCD R-CNN classes (%d): %s", len(self.rcnn_classes), self.rcnn_classes)

    def predict(self, image_path: str) -> DetectionResult:
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not read image: {image_path}")

        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(img_rgb)
        w_img, h_img = pil_img.size
        annotated = img_rgb.copy()

        # Stage 1: YOLO detection
        pred = self.yolo_model(image_path, conf=0.25, iou=0.45, imgsz=640, verbose=False)[0]

        if pred.boxes is None or len(pred.boxes) == 0:
            annotated_bgr = cv2.cvtColor(annotated, cv2.COLOR_RGB2BGR)
            _, buffer = cv2.imencode(".png", annotated_bgr)
            return DetectionResult(
                disease_name=self.disease_name,
                probability=0.0,
                confidence=0.0,
                detected_cells=[
                    {"class": "sickle_cell", "count": 0},
                    {"class": "normal_cell", "count": 0},
                ],
                annotated_image_bytes=buffer.tobytes(),
                feature_vector=[0.0, 0.0, 0.0],
                raw_detections=0,
            )

        # Stage 2: Crop each detection and classify with R-CNN
        crop_tensors = []
        box_data = []

        for box in pred.boxes:
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
            yolo_conf = float(box.conf[0])

            # Add 10% padding
            bw = x2 - x1
            bh = y2 - y1
            pad_w = bw * 0.1
            pad_h = bh * 0.1

            cx1 = max(0, int(x1 - pad_w))
            cy1 = max(0, int(y1 - pad_h))
            cx2 = min(w_img, int(x2 + pad_w))
            cy2 = min(h_img, int(y2 + pad_h))

            crop = pil_img.crop((cx1, cy1, cx2, cy2))

            # Skip tiny crops
            if crop.size[0] < 10 or crop.size[1] < 10:
                continue

            crop_tensor = self.rcnn_transform(crop)
            crop_tensors.append(crop_tensor)
            box_data.append({
                "box": [float(x1), float(y1), float(x2), float(y2)],
                "yolo_conf": yolo_conf,
            })

        if not crop_tensors:
            annotated_bgr = cv2.cvtColor(annotated, cv2.COLOR_RGB2BGR)
            _, buffer = cv2.imencode(".png", annotated_bgr)
            return DetectionResult(
                disease_name=self.disease_name,
                probability=0.0,
                confidence=0.0,
                detected_cells=[
                    {"class": "sickle_cell", "count": 0},
                    {"class": "normal_cell", "count": 0},
                ],
                annotated_image_bytes=buffer.tobytes(),
                feature_vector=[0.0, 0.0, 0.0],
                raw_detections=0,
            )

        # Batch classify all crops
        batch = torch.stack(crop_tensors)
        with torch.no_grad():
            outputs = self.rcnn_model(batch)
            probs = torch.softmax(outputs, dim=1)
            pred_indices = probs.argmax(dim=1)
            pred_confs = probs.max(dim=1).values

        # Stage 3: Aggregate results and draw annotations
        sickle_count = 0
        normal_count = 0
        sickle_keywords = ["sickle", "positive", "abnormal", "scd"]

        for i, bd in enumerate(box_data):
            cls_idx = pred_indices[i].item()
            cls_conf = pred_confs[i].item()
            cls_name = (
                self.rcnn_classes[cls_idx]
                if cls_idx < len(self.rcnn_classes)
                else f"class_{cls_idx}"
            )

            is_sickle = any(kw in cls_name.lower() for kw in sickle_keywords)
            if is_sickle:
                sickle_count += 1
                color = COLOR_SICKLE
            else:
                normal_count += 1
                color = COLOR_NORMAL

            x1, y1, x2, y2 = map(int, bd["box"])
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
            label = f"{cls_name} {cls_conf:.2f}"
            (lw, lh), _ = cv2.getTextSize(
                label, cv2.FONT_HERSHEY_SIMPLEX, 0.42, 1
            )
            cv2.rectangle(
                annotated, (x1, y1 - lh - 5), (x1 + lw + 2, y1), color, -1
            )
            cv2.putText(
                annotated, label, (x1 + 1, y1 - 3),
                cv2.FONT_HERSHEY_SIMPLEX, 0.42, (255, 255, 255), 1,
            )

        total_cells = sickle_count + normal_count
        sickle_ratio = sickle_count / total_cells if total_cells > 0 else 0.0

        # Probability based on sickle ratio
        probability = min(0.999, sickle_ratio)

        # Encode annotated image
        annotated_bgr = cv2.cvtColor(annotated, cv2.COLOR_RGB2BGR)
        _, buffer = cv2.imencode(".png", annotated_bgr)
        annotated_bytes = buffer.tobytes()

        return DetectionResult(
            disease_name=self.disease_name,
            probability=probability,
            confidence=probability,
            detected_cells=[
                {"class": "sickle_cell", "count": sickle_count},
                {"class": "normal_cell", "count": normal_count},
            ],
            annotated_image_bytes=annotated_bytes,
            feature_vector=[sickle_ratio, float(sickle_count), float(total_cells)],
            raw_detections=total_cells,
        )
