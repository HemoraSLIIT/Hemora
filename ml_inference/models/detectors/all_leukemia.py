"""Acute Lymphoblastic Leukemia (ALL) detector.

TODO: Refactor from backend/ml_inference/detectors/all_leukemia.py
This detector should:
1. Load YOLO model for cell detection
2. Load CNN classifier for disease classification
3. Run inference pipeline on blood smear images
4. Return DetectionResult with probability, detected cells, and annotated image
"""

from pathlib import Path
from ..base_detector import BaseDetector
from ..detection_result import DetectionResult


class ALLDetector(BaseDetector):
	"""Detector for Acute Lymphoblastic Leukemia."""

	def __init__(self, models_dir: str):
		self.models_dir = Path(models_dir)
		self._model = None
		self._yolo_model = None

	@property
	def disease_name(self) -> str:
		return "Acute Lymphoblastic Leukemia"

	def is_available(self) -> bool:
		"""Check if model files exist."""
		# TODO: Check for specific weight files (e.g., all_leukemia_yolo.pt, all_leukemia_cnn.pth)
		return (self.models_dir / "weights").exists()

	def load_models(self) -> None:
		"""Load YOLO + CNN models."""
		# TODO: Implement model loading
		# - Load YOLO from self.models_dir / "yolo_weights.pt"
		# - Load CNN classifier from self.models_dir / "cnn_weights.pth"
		pass

	def predict(self, image_path: str) -> DetectionResult:
		"""Run ALL detection on image.

		TODO: Implement full pipeline:
		1. Load image from image_path
		2. Run YOLO detection to find cells
		3. Extract cell patches and classify with CNN
		4. Aggregate results and generate annotated image
		"""
		raise NotImplementedError("Refactor from backend implementation")
