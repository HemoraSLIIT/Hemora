"""
Acute Lymphoblastic Leukemia (ALL) detector.

Pipeline (from Colab notebooks):
  1. EfficientNetB0 (Keras) — binary smear-level classification (ALLNeg/ALLPos)
  2. YOLOv8s — lymphoblast object detection (single class)
  3. Hybrid scoring: CNN probability (60%) + YOLO-based score (40%)

Required model files in models_dir:
  - all_yolo_best.pt           (Ultralytics YOLOv8s detection model)
  - all_cnn_best.keras         (EfficientNetB0 binary classifier)
"""

import logging
import os

import cv2
import numpy as np

from ..base_detector import ABCBaseDetector, DetectionResult

logger = logging.getLogger(__name__)

BLAST_COLOR_RGB = (255, 50, 50)  # Red for lymphoblasts


class ALLDetector(ABCBaseDetector):
    YOLO_WEIGHTS = "all_yolo_best.pt"
    CNN_WEIGHTS = "all_cnn_best.keras"

    def __init__(self, models_dir):
        self.models_dir = models_dir
        self.yolo_model = None
        self.cnn_model = None

    @property
    def disease_name(self):
        return "Acute Lymphoblastic Leukemia (ALL)"

    def is_available(self):
        return all(
            os.path.exists(os.path.join(self.models_dir, f))
            for f in [self.YOLO_WEIGHTS, self.CNN_WEIGHTS]
        )

    def load_models(self):
        from ultralytics import YOLO

        yolo_path = os.path.join(self.models_dir, self.YOLO_WEIGHTS)
        cnn_path = os.path.join(self.models_dir, self.CNN_WEIGHTS)

        # Load YOLO
        self.yolo_model = YOLO(yolo_path)
        logger.info("Loaded ALL YOLO model: %s", yolo_path)

        # Load EfficientNetB0 (Keras)
        import tensorflow as tf
        self.cnn_model = tf.keras.models.load_model(cnn_path)
        logger.info("Loaded ALL CNN model: %s", cnn_path)

    def predict(self, image_path: str) -> DetectionResult:
        import tensorflow as tf
        from tensorflow.keras.applications.efficientnet import preprocess_input

        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not read image: {image_path}")

        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        annotated = img_rgb.copy()

        # ----- Stage 1: CNN prediction -----
        img_resized = cv2.resize(img_rgb, (224, 224))
        img_array = np.expand_dims(img_resized.astype(np.float32), axis=0)
        img_array = preprocess_input(img_array)
        cnn_prob = float(self.cnn_model.predict(img_array, verbose=0)[0][0])

        # ----- Stage 2: YOLO detection -----
        pred = self.yolo_model(image_path, conf=0.35, iou=0.45, verbose=False)[0]

        blast_count = 0
        if pred.boxes is not None:
            for box in pred.boxes:
                conf = float(box.conf[0])
                x1, y1, x2, y2 = map(int, box.xyxy[0])

                blast_count += 1
                cv2.rectangle(annotated, (x1, y1), (x2, y2), BLAST_COLOR_RGB, 2)
                label = f"lymphoblast {conf:.2f}"
                (lw, lh), _ = cv2.getTextSize(
                    label, cv2.FONT_HERSHEY_SIMPLEX, 0.42, 1
                )
                cv2.rectangle(
                    annotated, (x1, y1 - lh - 5), (x1 + lw + 2, y1),
                    BLAST_COLOR_RGB, -1,
                )
                cv2.putText(
                    annotated, label, (x1 + 1, y1 - 3),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.42, (255, 255, 255), 1,
                )

        # ----- Stage 3: Hybrid scoring -----
        # YOLO score: scales with blast count, caps at 5+
        yolo_score = min(blast_count / 5.0, 1.0)

        # Weighted combination: CNN 60% + YOLO 40%
        probability = (cnn_prob * 0.6) + (yolo_score * 0.4)
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
                {"class": "lymphoblast", "count": blast_count},
            ],
            annotated_image_bytes=annotated_bytes,
            feature_vector=[cnn_prob, yolo_score, float(blast_count)],
            raw_detections=blast_count,
        )
