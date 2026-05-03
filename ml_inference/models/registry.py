"""Model registry - lazy-loads and caches disease detector instances."""

import logging
from pathlib import Path
from typing import Dict, Optional

from .base_detector import BaseDetector
from .detection_result import DetectionResult

logger = logging.getLogger(__name__)


class ModelRegistry:
	"""Registry for loading and managing disease detector models."""

	_detectors: Dict[str, BaseDetector] = {}
	_initialized: bool = False

	@classmethod
	def _init(cls, models_base_dir: str) -> None:
		"""Initialize registry by loading available detectors.

		Args:
			models_base_dir: Root directory containing model subdirectories
		"""
		if cls._initialized:
			return

		base_dir = Path(models_base_dir)

		# Import concrete detectors
		from .detectors.all_leukemia import ALLDetector
		from .detectors.ida import IDADetector
		from .detectors.sickle_cell import SickleCellDetector
		from .detectors.thalassemia import ThalassemiaDetector

		detector_classes = [
			(ThalassemiaDetector, "thalassemia"),
			(ALLDetector, "all_leukemia"),
			(IDADetector, "ida"),
			(SickleCellDetector, "sickle_cell"),
		]

		for DetectorClass, subfolder in detector_classes:
			models_dir = base_dir / subfolder
			try:
				detector = DetectorClass(str(models_dir))
				name = detector.disease_name

				if detector.is_available():
					detector.load_models()
					cls._detectors[name] = detector
					logger.info(f"Loaded ML model for: {name}")
				else:
					logger.info(f"Model files not found for: {name} (skipping)")
			except Exception as e:
				logger.warning(f"Failed to load detector {subfolder}: {e}")

		cls._initialized = True

	@classmethod
	def get_detector(cls, disease_name: str, models_dir: Optional[str] = None) -> Optional[BaseDetector]:
		"""Get detector for a specific disease.

		Args:
			disease_name: Name of disease (e.g., "Acute Lymphoblastic Leukemia")
			models_dir: Base models directory (for initialization)

		Returns:
			BaseDetector instance or None if not available
		"""
		if not cls._initialized and models_dir:
			cls._init(models_dir)
		return cls._detectors.get(disease_name)

	@classmethod
	def available_diseases(cls, models_dir: Optional[str] = None) -> list:
		"""List available disease detectors.

		Args:
			models_dir: Base models directory (for initialization)

		Returns:
			List of disease names
		"""
		if not cls._initialized and models_dir:
			cls._init(models_dir)
		return list(cls._detectors.keys())

	@classmethod
	def run_all(cls, image_path: str, models_dir: Optional[str] = None) -> Dict[str, DetectionResult]:
		"""Run all available detectors on an image.

		Args:
			image_path: Path to blood smear image
			models_dir: Base models directory (for initialization)

		Returns:
			Dict of {disease_name: DetectionResult}
		"""
		if not cls._initialized and models_dir:
			cls._init(models_dir)

		results = {}
		for disease_name, detector in cls._detectors.items():
			try:
				result = detector.predict(image_path)
				results[disease_name] = result
				logger.info(
					f"Detector {disease_name}: probability={result.probability:.2f}, "
					f"detections={result.raw_detections}"
				)
			except Exception as e:
				logger.error(f"Detector failed for {disease_name}: {e}")

		return results

	@classmethod
	def reset(cls) -> None:
		"""Reset registry (useful for testing)."""
		cls._detectors = {}
		cls._initialized = False
