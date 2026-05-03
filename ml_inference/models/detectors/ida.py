"""Iron Deficiency Anemia (IDA) detector.

TODO: Refactor from backend/ml_inference/detectors/ida.py
"""

from pathlib import Path
from ..base_detector import BaseDetector
from ..detection_result import DetectionResult


class IDADetector(BaseDetector):
	"""Detector for Iron Deficiency Anemia."""

	def __init__(self, models_dir: str):
		self.models_dir = Path(models_dir)
		self._model = None

	@property
	def disease_name(self) -> str:
		return "Iron Deficiency Anemia"

	def is_available(self) -> bool:
		"""Check if model files exist."""
		return (self.models_dir / "weights").exists()

	def load_models(self) -> None:
		"""Load IDA detection models."""
		# TODO: Implement model loading
		pass

	def predict(self, image_path: str) -> DetectionResult:
		"""Run IDA detection on image."""
		raise NotImplementedError("Refactor from backend implementation")
