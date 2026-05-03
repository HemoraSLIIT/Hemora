"""Tests for ML service API contracts and schemas."""

import pytest
from ml_inference.api.schemas import (
	MLInferenceRequestSchema,
	MLInferenceResponseSchema,
	DetectedCellSchema,
	ImageAnalysisResultSchema,
)


class TestMLInferenceSchemas:
	"""Test ML inference request/response schemas."""

	def test_inference_request_schema_valid(self):
		"""Valid inference request should pass validation."""
		data = {
			"jobId": "550e8400-e29b-41d4-a716-446655440000",
			"imagePaths": ["/path/to/image1.png", "/path/to/image2.png"],
			"cbcParameters": {"wbc": 12.5, "rbc": 4.5, "hemoglobin": 13.2},
			"correlationId": "trace-123",
			"timeoutSeconds": 300,
		}
		request = MLInferenceRequestSchema(**data)
		assert request.job_id == data["jobId"]

	def test_inference_request_camelcase_conversion(self):
		"""camelCase field names should be converted."""
		data = {
			"jobId": "550e8400-e29b-41d4-a716-446655440000",
			"imagePaths": ["/path/to/image1.png"],
			"cbcParameters": {"wbc": 12.5},
		}
		request = MLInferenceRequestSchema(**data)
		assert request.image_paths == ["/path/to/image1.png"]

	def test_detected_cell_schema(self):
		"""DetectedCellSchema should handle cell class and count."""
		data = {"cellClass": "blast", "count": 15}
		cell = DetectedCellSchema(**data)
		assert cell.cell_class == "blast"
		assert cell.count == 15

	def test_image_analysis_result_schema(self):
		"""ImageAnalysisResultSchema should aggregate detection results."""
		data = {
			"diseaseName": "Acute Lymphoblastic Leukemia",
			"probability": 0.85,
			"confidence": 0.92,
			"detectedCells": [
				{"cellClass": "blast", "count": 25},
				{"cellClass": "normal", "count": 175},
			],
			"rawDetections": 200,
		}
		result = ImageAnalysisResultSchema(**data)
		assert result.disease_name == "Acute Lymphoblastic Leukemia"
		assert result.probability == 0.85
		assert len(result.detected_cells) == 2

	def test_inference_response_schema_success(self):
		"""Valid success response should validate."""
		data = {
			"jobId": "550e8400-e29b-41d4-a716-446655440000",
			"status": "succeeded",
			"imageResults": {
				"Acute Lymphoblastic Leukemia": {
					"diseaseName": "Acute Lymphoblastic Leukemia",
					"probability": 0.87,
					"confidence": 0.93,
					"detectedCells": [{"cellClass": "blast", "count": 30}],
					"rawDetections": 200,
				}
			},
			"error": None,
			"correlationId": "trace-123",
		}
		response = MLInferenceResponseSchema(**data)
		assert response.status == "succeeded"
		assert len(response.image_results) == 1

	def test_inference_response_schema_failure(self):
		"""Failure response should have error populated."""
		data = {
			"jobId": "550e8400-e29b-41d4-a716-446655440000",
			"status": "failed",
			"imageResults": {},
			"error": "Image processing failed: file not found",
			"correlationId": "trace-123",
		}
		response = MLInferenceResponseSchema(**data)
		assert response.status == "failed"
		assert response.error is not None

	def test_inference_response_json_serialization(self):
		"""Response should serialize to/from JSON."""
		data = {
			"jobId": "550e8400-e29b-41d4-a716-446655440000",
			"status": "succeeded",
			"imageResults": {},
			"correlationId": "trace-123",
		}
		response = MLInferenceResponseSchema(**data)
		json_str = response.model_dump_json()
		assert "jobId" in json_str
		assert "succeeded" in json_str


class TestMLAPIContracts:
	"""Test ML service API contract compliance."""

	def test_health_endpoint_response_format(self):
		"""Health check response should include required fields."""
		from ml_inference.api.schemas import HealthCheckSchema
		from datetime import datetime

		data = {
			"status": "healthy",
			"timestamp": datetime.utcnow(),
			"serviceName": "ml-inference-service",
			"version": "0.1.0",
			"details": {"availableModels": ["ALL", "SCD", "IDA", "Thalassemia"]},
		}
		health = HealthCheckSchema(**data)
		assert health.status == "healthy"
		assert len(health.details["availableModels"]) > 0

	def test_job_polling_contract(self):
		"""Job status polling should follow contract."""
		# Initial job creation
		initial = {
			"jobId": "550e8400-e29b-41d4-a716-446655440000",
			"status": "pending",
			"imageResults": {},
			"error": None,
		}

		# Job running
		running = {
			"jobId": "550e8400-e29b-41d4-a716-446655440000",
			"status": "running",
			"imageResults": {},
			"error": None,
		}

		# Job completed
		completed = {
			"jobId": "550e8400-e29b-41d4-a716-446655440000",
			"status": "succeeded",
			"imageResults": {
				"ALL": {
					"diseaseName": "ALL",
					"probability": 0.85,
					"confidence": 0.92,
					"detectedCells": [],
					"rawDetections": 0,
				}
			},
			"error": None,
		}

		# All should validate
		MLInferenceResponseSchema(**initial)
		MLInferenceResponseSchema(**running)
		MLInferenceResponseSchema(**completed)
