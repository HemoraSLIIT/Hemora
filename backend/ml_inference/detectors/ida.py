"""
Iron Deficiency Anemia (IDA) detector — STUB.

Will be implemented when the hybrid model is trained.
Required files: ida_yolo_best.pt, ida_classifier_best.pt, ida_scaler.pkl
"""

from ..base_detector import ABCBaseDetector, DetectionResult


class IDADetector(ABCBaseDetector):

    def __init__(self, models_dir):
        self.models_dir = models_dir

    @property
    def disease_name(self):
        return "Iron Deficiency Anemia (IDA)"

    def is_available(self):
        return False

    def load_models(self):
        raise NotImplementedError("IDA detector not yet implemented")

    def predict(self, image_path: str) -> DetectionResult:
        raise NotImplementedError("IDA detector not yet implemented")
