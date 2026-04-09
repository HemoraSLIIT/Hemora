"""
Model registry — lazy-loads and caches disease detector instances.

Detectors are only loaded when first accessed. If model weight files
are missing for a disease, that detector is silently skipped (CBC-only
fallback will be used instead).
"""

import logging
import os

from django.conf import settings

logger = logging.getLogger(__name__)


class ModelRegistry:
    _detectors = {}
    _initialized = False

    @classmethod
    def _init(cls):
        if cls._initialized:
            return

        base_models_dir = os.path.join(settings.BASE_DIR, "models")

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
            models_dir = os.path.join(base_models_dir, subfolder)
            detector = DetectorClass(models_dir)
            name = detector.disease_name
            if detector.is_available():
                try:
                    detector.load_models()
                    cls._detectors[name] = detector
                    logger.info("Loaded ML model for: %s", name)
                except Exception as e:
                    logger.warning("Failed to load model for %s: %s", name, e)
            else:
                logger.info("Model files not found for: %s (skipping)", name)

        cls._initialized = True

    @classmethod
    def get_detector(cls, disease_name):
        cls._init()
        return cls._detectors.get(disease_name)

    @classmethod
    def available_diseases(cls):
        cls._init()
        return list(cls._detectors.keys())

    @classmethod
    def run_all(cls, image_path):
        """Run all available detectors on an image.

        Returns:
            dict of {disease_name: DetectionResult}
        """
        cls._init()
        results = {}
        for disease_name, detector in cls._detectors.items():
            try:
                results[disease_name] = detector.predict(image_path)
                logger.info(
                    "Detector %s: probability=%.2f, detections=%d",
                    disease_name,
                    results[disease_name].probability,
                    results[disease_name].raw_detections,
                )
            except Exception as e:
                logger.error("Detector failed for %s: %s", disease_name, e)
        return results

    @classmethod
    def reset(cls):
        """Reset registry (useful for testing)."""
        cls._detectors = {}
        cls._initialized = False
