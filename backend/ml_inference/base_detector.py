"""
Base class and data structures for all disease detectors.

Each disease detector implements the same interface:
  1. Load YOLO + classifier model files
  2. Run detection on a blood smear image
  3. Return a standardized DetectionResult
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class DetectionResult:
    """Standardized output from any disease detector."""

    disease_name: str
    probability: float  # 0.0 - 1.0
    confidence: float
    detected_cells: list = field(default_factory=list)  # [{class, count}, ...]
    annotated_image_bytes: bytes = None  # PNG bytes of YOLO-annotated image
    feature_vector: list = field(default_factory=list)
    raw_detections: int = 0


class ABCBaseDetector(ABC):
    """Abstract base class for disease detectors."""

    @property
    @abstractmethod
    def disease_name(self) -> str:
        """Human-readable disease name matching CBC analyzer keys."""

    @abstractmethod
    def load_models(self):
        """Load YOLO + classifier model files. Called once by registry."""

    @abstractmethod
    def predict(self, image_path: str) -> DetectionResult:
        """Run full pipeline on a blood smear image."""

    @abstractmethod
    def is_available(self) -> bool:
        """Check if required model weight files exist on disk."""
