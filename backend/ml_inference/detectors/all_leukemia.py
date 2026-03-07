"""
Acute Lymphoblastic Leukemia (ALL) detector — STUB.

Will be implemented when the YOLO + CNN hybrid model is trained.
Required files: all_yolo_best.pt, all_classifier_best.pt, all_scaler.pkl
"""

from ..base_detector import ABCBaseDetector, DetectionResult


class ALLDetector(ABCBaseDetector):

    def __init__(self, models_dir):
        self.models_dir = models_dir

    @property
    def disease_name(self):
        return "Acute Lymphoblastic Leukemia (ALL)"

    def is_available(self):
        return False

    def load_models(self):
        raise NotImplementedError("ALL detector not yet implemented")

    def predict(self, image_path: str) -> DetectionResult:
        raise NotImplementedError("ALL detector not yet implemented")
