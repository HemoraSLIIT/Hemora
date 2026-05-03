"""Standardized detection result dataclass."""

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class DetectedCell:
	"""Single detected cell type and count."""
	cell_class: str
	count: int


@dataclass
class DetectionResult:
	"""Standardized output from any disease detector.

	Represents the result of running a single ML detector on a blood smear image.
	"""

	disease_name: str
	probability: float  # 0.0 - 1.0
	confidence: float   # 0.0 - 1.0
	detected_cells: List[DetectedCell] = field(default_factory=list)
	annotated_image_bytes: Optional[bytes] = None  # PNG bytes of YOLO-annotated image
	feature_vector: List[float] = field(default_factory=list)
	raw_detections: int = 0

	def to_dict(self) -> dict:
		"""Convert to dictionary for JSON serialization."""
		return {
			"diseaseName": self.disease_name,
			"probability": round(self.probability, 4),
			"confidence": round(self.confidence, 4),
			"detectedCells": [
				{"cellClass": cell.cell_class, "count": cell.count}
				for cell in self.detected_cells
			],
			"rawDetections": self.raw_detections,
		}
