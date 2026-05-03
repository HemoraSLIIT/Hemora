"""Base class and interface for disease detectors.

Each concrete detector (ALL, SCD, Thalassemia, IDA) implements this interface.
"""

from abc import ABC, abstractmethod
from .detection_result import DetectionResult


class BaseDetector(ABC):
	"""Abstract base class for disease detectors.

	Subclasses must implement:
	- disease_name property: unique disease identifier
	- load_models(): load all required model files
	- predict(): run inference on a single image
	- is_available(): check if model files exist
	"""

	@property
	@abstractmethod
	def disease_name(self) -> str:
		"""Human-readable disease name matching CBC analyzer keys.

		Examples: "Acute Lymphoblastic Leukemia", "Sickle Cell Disease"
		"""

	@abstractmethod
	def load_models(self) -> None:
		"""Load YOLO + classifier model files into memory.

		Called once during initialization. Should raise an exception if models
		cannot be loaded.
		"""

	@abstractmethod
	def predict(self, image_path: str) -> DetectionResult:
		"""Run full inference pipeline on a blood smear image.

		Args:
			image_path: Local filesystem path to image file

		Returns:
			DetectionResult with probability, detected cells, annotated image, etc.

		Raises:
			Exception: If inference fails (bad image, file not found, etc.)
		"""

	@abstractmethod
	def is_available(self) -> bool:
		"""Check if required model weight files exist on disk.

		Returns False if any required model file is missing, so the detector
		can be skipped.
		"""
