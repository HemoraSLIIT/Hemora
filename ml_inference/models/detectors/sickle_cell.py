"""Sickle Cell Disease (SCD) detector.

TODO: Refactor from backend/ml_inference/detectors/sickle_cell.py
"""

from pathlib import Path
from ..base_detector import BaseDetector
from ..detection_result import DetectionResult


class SickleCellDetector(BaseDetector):
	"""Detector for Sickle Cell Disease."""

	def __init__(self, models_dir: str):
		self.models_dir = Path(models_dir)
		self._model = None

	@property
	def disease_name(self) -> str:
		return "Sickle Cell Disease"

	def is_available(self) -> bool:
		"""Check if model files exist."""
		return (self.models_dir / "weights").exists()

	def load_models(self) -> None:
		"""Load SCD detection models."""
		# TODO: Implement model loading
		pass

	def predict(self, image_path: str) -> DetectionResult:
		"""Run SCD detection on image."""
		raise NotImplementedError("Refactor from backend implementation")
