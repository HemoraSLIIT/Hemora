"""
Sickle Cell Anemia detector — STUB.

Will be implemented when the hybrid model is trained.
Required files: sickle_yolo_best.pt, sickle_classifier_best.pt, sickle_scaler.pkl
"""

from ..base_detector import ABCBaseDetector, DetectionResult


class SickleCellDetector(ABCBaseDetector):

    def __init__(self, models_dir):
        self.models_dir = models_dir

    @property
    def disease_name(self):
        return "Sickle Cell Anemia"

    def is_available(self):
        return False

    def load_models(self):
        raise NotImplementedError("Sickle Cell detector not yet implemented")

    def predict(self, image_path: str) -> DetectionResult:
        raise NotImplementedError("Sickle Cell detector not yet implemented")
