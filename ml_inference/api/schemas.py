"""Pydantic schemas for FastAPI endpoints."""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime


class DetectedCellSchema(BaseModel):
	"""Detected cell in image."""
	cell_class: str = Field(..., alias="cellClass")
	count: int

	class Config:
		populate_by_name = True


class ImageAnalysisResultSchema(BaseModel):
	"""Result from single detector model."""
	disease_name: str = Field(..., alias="diseaseName")
	probability: float
	confidence: float
	detected_cells: List[DetectedCellSchema] = Field(default_factory=list, alias="detectedCells")
	raw_detections: int = Field(default=0, alias="rawDetections")

	class Config:
		populate_by_name = True


class MLInferenceRequestSchema(BaseModel):
	"""Request to ML inference service."""
	job_id: str = Field(..., alias="jobId")
	image_paths: List[str] = Field(..., alias="imagePaths")
	cbc_parameters: Dict[str, float] = Field(..., alias="cbcParameters")
	correlation_id: Optional[str] = Field(default="", alias="correlationId")
	timeout_seconds: int = Field(default=300, alias="timeoutSeconds")

	class Config:
		populate_by_name = True


class MLInferenceResponseSchema(BaseModel):
	"""Response from ML inference service."""
	job_id: str = Field(..., alias="jobId")
	status: str  # "succeeded" or "failed"
	image_results: Dict[str, ImageAnalysisResultSchema] = Field(
		default_factory=dict,
		alias="imageResults"
	)
	cbc_analysis: Optional[Dict[str, Any]] = Field(default=None, alias="cbcAnalysis")
	error: Optional[str] = None
	correlation_id: str = Field(default="", alias="correlationId")

	class Config:
		populate_by_name = True


class HealthCheckSchema(BaseModel):
	"""Health check response."""
	status: str  # "healthy", "degraded", "unhealthy"
	timestamp: datetime
	service_name: str = Field(default="ml-inference-service", alias="serviceName")
	version: str = "0.1.0"
	details: Dict[str, Any] = Field(default_factory=dict)

	class Config:
		populate_by_name = True
