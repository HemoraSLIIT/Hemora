"""Inference API routes for ML service."""

from fastapi import APIRouter, status, HTTPException
from typing import Dict

from ..core import config, logger
from ..models import ModelRegistry, DetectionResult
from .schemas import MLInferenceRequestSchema, MLInferenceResponseSchema

router = APIRouter(prefix="/inference", tags=["inference"])


@router.post(
	"/diagnose",
	response_model=MLInferenceResponseSchema,
	status_code=status.HTTP_200_OK,
)
async def diagnose(request: MLInferenceRequestSchema) -> MLInferenceResponseSchema:
	"""Run ML inference on blood smear images.

	Receives:
	- job_id: UUID of diagnosis job
	- image_paths: List of local filesystem paths to blood smear images
	- cbc_parameters: CBC values from lab report
	- correlation_id: Trace ID for logging

	Returns:
	- 200 with image analysis results on success
	- 400/500 with error details on failure
	"""
	correlation_id = request.correlation_id or request.job_id

	try:
		logger.info(f"Inference request: job_id={request.job_id}, images={len(request.image_paths)}")

		# Load models if not already loaded
		available_models = ModelRegistry.available_diseases(config.BASE_MODELS_DIR)
		if not available_models:
			raise ValueError("No ML models available for inference")

		# Run inference on each image
		aggregated_results: Dict[str, DetectionResult] = {}

		for image_path in request.image_paths:
			try:
				image_results = ModelRegistry.run_all(image_path, config.BASE_MODELS_DIR)

				# Aggregate results across images
				for disease_name, result in image_results.items():
					if disease_name not in aggregated_results:
						aggregated_results[disease_name] = result
					else:
						# Average probability across images
						existing = aggregated_results[disease_name]
						existing.probability = (existing.probability + result.probability) / 2
						existing.confidence = max(existing.confidence, result.confidence)
						# Merge detected cells
						existing.detected_cells.extend(result.detected_cells)
						existing.raw_detections += result.raw_detections

			except Exception as e:
				logger.error(f"Failed to process image {image_path}: {e}", extra={
					"job_id": request.job_id,
					"correlation_id": correlation_id,
				})
				continue

		logger.info(
			f"Inference completed: job_id={request.job_id}, "
			f"models_run={len(aggregated_results)}, "
			f"images_processed={len(request.image_paths)}"
		)

		# Build response
		response = MLInferenceResponseSchema(
			jobId=request.job_id,
			status="succeeded",
			imageResults={
				name: {
					"diseaseName": result.disease_name,
					"probability": round(result.probability, 4),
					"confidence": round(result.confidence, 4),
					"detectedCells": [
						{"cellClass": cell.cell_class, "count": cell.count}
						for cell in result.detected_cells
					],
					"rawDetections": result.raw_detections,
				}
				for name, result in aggregated_results.items()
			},
			cbcAnalysis=None,  # CBC analysis is done in Django
			correlationId=correlation_id,
		)

		return response

	except Exception as e:
		logger.error(
			f"Inference failed: {str(e)}",
			extra={
				"job_id": request.job_id,
				"correlation_id": correlation_id,
				"error": str(e),
			},
		)

		return MLInferenceResponseSchema(
			jobId=request.job_id,
			status="failed",
			error=str(e),
			correlationId=correlation_id,
		)


@router.get(
	"/models/available",
	status_code=status.HTTP_200_OK,
)
async def available_models():
	"""Get list of available disease models.

	Returns:
		List of disease names that have models loaded
	"""
	try:
		models = ModelRegistry.available_diseases(config.BASE_MODELS_DIR)
		return {
			"available": models,
			"count": len(models),
		}
	except Exception as e:
		logger.error(f"Failed to get available models: {e}")
		raise HTTPException(
			status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
			detail="Failed to get available models",
		)
