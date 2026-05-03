"""API contracts and schemas for inter-service communication."""

from dataclasses import dataclass, field, asdict
from typing import List, Optional, Dict, Any
from enum import Enum
import json


class DiagnosisJobStatus(str, Enum):
	"""Job status enum."""
	PENDING = "pending"
	RUNNING = "running"
	SUCCEEDED = "succeeded"
	FAILED = "failed"


class AnalysisMethod(str, Enum):
	"""Analysis method enum."""
	CBC_ONLY = "cbc_only"
	HYBRID = "hybrid"


# ===== REQUEST SCHEMAS =====

@dataclass
class MLInferenceRequest:
	"""Request from Django worker to ML inference service.

	Fields:
		job_id: UUID string of the diagnosis job
		image_paths: List of local file paths to blood smear images
		cbc_parameters: Dict of CBC values extracted from report
		correlation_id: Trace ID for logging
		timeout_seconds: Timeout for inference (default: 300s)
	"""
	job_id: str
	image_paths: List[str]
	cbc_parameters: Dict[str, float]
	correlation_id: str = ""
	timeout_seconds: int = 300

	def to_json(self) -> str:
		return json.dumps(asdict(self))

	@staticmethod
	def from_json(data: str) -> "MLInferenceRequest":
		obj = json.loads(data)
		return MLInferenceRequest(**obj)


# ===== RESPONSE SCHEMAS =====

@dataclass
class DetectedCell:
	"""Single detected cell class and count."""
	cell_class: str
	count: int


@dataclass
class ImageAnalysisResult:
	"""Result from a single detector model."""
	disease_name: str
	probability: float  # 0.0-1.0
	confidence: float   # 0.0-1.0
	detected_cells: List[DetectedCell] = field(default_factory=list)
	annotated_image_bytes: Optional[bytes] = None
	raw_detections: int = 0

	def to_dict(self) -> Dict[str, Any]:
		return {
			"diseaseName": self.disease_name,
			"probability": round(self.probability, 4),
			"confidence": round(self.confidence, 4),
			"detectedCells": [
				{"cellClass": c.cell_class, "count": c.count}
				for c in self.detected_cells
			],
			"rawDetections": self.raw_detections,
		}


@dataclass
class MLInferenceResponse:
	"""Response from ML inference service to Django worker.

	On success:
		- status = "succeeded"
		- image_results populated with per-model scores
		- error = None

	On failure:
		- status = "failed"
		- error populated
		- image_results = {}
	"""
	job_id: str
	status: str  # "succeeded" or "failed"
	image_results: Dict[str, ImageAnalysisResult] = field(default_factory=dict)
	cbc_analysis: Optional[Dict[str, Any]] = None
	error: Optional[str] = None
	correlation_id: str = ""

	def to_json(self) -> str:
		data = {
			"jobId": self.job_id,
			"status": self.status,
			"imageResults": {
				name: result.to_dict() for name, result in self.image_results.items()
			},
			"cbcAnalysis": self.cbc_analysis,
			"error": self.error,
			"correlationId": self.correlation_id,
		}
		return json.dumps(data)

	@staticmethod
	def from_json(data: str) -> "MLInferenceResponse":
		obj = json.loads(data)
		return MLInferenceResponse(
			job_id=obj["jobId"],
			status=obj["status"],
			image_results={
				name: ImageAnalysisResult(
					disease_name=result["diseaseName"],
					probability=result["probability"],
					confidence=result["confidence"],
					detected_cells=[
						DetectedCell(cell["cellClass"], cell["count"])
						for cell in result.get("detectedCells", [])
					],
					raw_detections=result.get("rawDetections", 0),
				)
				for name, result in obj.get("imageResults", {}).items()
			},
			cbc_analysis=obj.get("cbcAnalysis"),
			error=obj.get("error"),
			correlation_id=obj.get("correlationId", ""),
		)


@dataclass
class HealthCheckResponse:
	"""Response from service health check."""
	status: str  # "healthy", "degraded", "unhealthy"
	timestamp: str
	service_name: str
	version: str = "0.1.0"
	details: Dict[str, Any] = field(default_factory=dict)
