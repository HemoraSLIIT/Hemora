"""Job processing tasks for the worker."""

import logging
import requests
import json
import time
from typing import Optional, Dict, Any
from datetime import datetime

from config import config

logger = logging.getLogger(__name__)


class JobProcessor:
	"""Processes diagnosis jobs by calling ML service and updating Django."""

	def __init__(self):
		self.django_base_url = config.DJANGO_API_URL
		self.ml_service_url = config.ML_SERVICE_URL

	def fetch_pending_jobs(self) -> list:
		"""Fetch pending jobs from Django.

		Returns:
			List of pending diagnosis job dicts
		"""
		try:
			url = f"{self.django_base_url}/diagnosis-jobs/pending/"
			params = {"limit": config.BATCH_SIZE}

			response = requests.get(
				url,
				params=params,
				timeout=10,
				headers=self._get_headers(),
			)
			response.raise_for_status()

			return response.json().get("jobs", [])

		except requests.RequestException as e:
			logger.error(f"Failed to fetch pending jobs: {e}")
			return []

	def process_job(self, job: Dict[str, Any]) -> bool:
		"""Process a single diagnosis job.

		Steps:
		1. Get patient details and blood smear images
		2. Call ML service for inference
		3. Update job status in Django

		Args:
			job: Job dict from Django

		Returns:
			True if successful, False otherwise
		"""
		job_id = job.get("jobId")
		patient_id = job.get("patientId")
		cbc_parameters = job.get("cbcParameters", {})
		correlation_id = job.get("correlationId", job_id)

		logger.info(f"Processing job {job_id} for patient {patient_id}")

		try:
			# 1. Mark job as running
			self._update_job_status(job_id, "running")

			# 2. Get patient blood smear images
			image_paths = self._get_patient_image_paths(patient_id)
			if not image_paths:
				raise ValueError("No blood smear images found for patient")

			logger.info(f"Found {len(image_paths)} blood smear images for patient {patient_id}")

			# 3. Call ML service
			ml_response = self._call_ml_service(
				job_id=job_id,
				image_paths=image_paths,
				cbc_parameters=cbc_parameters,
				correlation_id=correlation_id,
			)

			if ml_response["status"] != "succeeded":
				raise ValueError(f"ML service failed: {ml_response.get('error', 'unknown error')}")

			# 4. Prepare result
			result = self._prepare_result(cbc_parameters, ml_response)

			# 5. Submit result to Django
			self._submit_job_result(job_id, result)

			logger.info(f"Job {job_id} completed successfully")
			return True

		except Exception as e:
			logger.error(f"Job {job_id} failed: {str(e)}")
			self._update_job_status(job_id, "failed", error_message=str(e))
			return False

	def _get_headers(self) -> Dict[str, str]:
		"""Get HTTP headers for API calls."""
		headers = {
			"Content-Type": "application/json",
		}
		if config.DJANGO_API_KEY:
			headers["Authorization"] = f"Bearer {config.DJANGO_API_KEY}"
		return headers

	def _update_job_status(
		self,
		job_id: str,
		status: str,
		error_message: Optional[str] = None,
	):
		"""Update job status in Django."""
		try:
			url = f"{self.django_base_url}/diagnosis-jobs/{job_id}/status/"
			data = {"status": status}
			if error_message:
				data["errorMessage"] = error_message

			response = requests.patch(
				url,
				json=data,
				timeout=10,
				headers=self._get_headers(),
			)
			response.raise_for_status()

		except requests.RequestException as e:
			logger.error(f"Failed to update job {job_id} status: {e}")

	def _get_patient_image_paths(self, patient_id: int) -> list:
		"""Get local filesystem paths for patient's blood smear images.

		Returns:
			List of filesystem paths
		"""
		try:
			url = f"{self.django_base_url}/patients/{patient_id}/blood-smear-images/"
			response = requests.get(
				url,
				timeout=10,
				headers=self._get_headers(),
			)
			response.raise_for_status()

			images = response.json().get("images", [])
			return [img.get("localPath") for img in images if img.get("localPath")]

		except requests.RequestException as e:
			logger.error(f"Failed to get patient images: {e}")
			return []

	def _call_ml_service(
		self,
		job_id: str,
		image_paths: list,
		cbc_parameters: Dict[str, float],
		correlation_id: str,
	) -> Dict[str, Any]:
		"""Call ML inference service.

		Args:
			job_id: Job UUID
			image_paths: List of image filesystem paths
			cbc_parameters: CBC values
			correlation_id: Trace ID

		Returns:
			Response from ML service
		"""
		try:
			url = f"{self.ml_service_url}/inference/diagnose"
			payload = {
				"jobId": job_id,
				"imagePaths": image_paths,
				"cbcParameters": cbc_parameters,
				"correlationId": correlation_id,
				"timeoutSeconds": config.ML_SERVICE_TIMEOUT,
			}

			response = requests.post(
				url,
				json=payload,
				timeout=config.ML_SERVICE_TIMEOUT + 10,
				headers={"Content-Type": "application/json"},
			)
			response.raise_for_status()

			return response.json()

		except requests.RequestException as e:
			logger.error(f"ML service call failed: {e}")
			raise

	def _prepare_result(
		self,
		cbc_parameters: Dict[str, float],
		ml_response: Dict[str, Any],
	) -> Dict[str, Any]:
		"""Prepare final result combining CBC and ML analysis."""
		# TODO: Integrate with CBC analyzer to compute hybrid scores
		# For now, just return ML results

		return {
			"cbcParameters": cbc_parameters,
			"imageAnalysis": ml_response.get("imageResults", {}),
			"analysisMethod": "hybrid" if ml_response.get("imageResults") else "cbc_only",
			"timestamp": datetime.utcnow().isoformat(),
		}

	def _submit_job_result(self, job_id: str, result: Dict[str, Any]):
		"""Submit completed job result to Django.

		Args:
			job_id: Job UUID
			result: Complete result dictionary
		"""
		try:
			url = f"{self.django_base_url}/diagnosis-jobs/{job_id}/result/"
			response = requests.post(
				url,
				json={"result": result},
				timeout=10,
				headers=self._get_headers(),
			)
			response.raise_for_status()

		except requests.RequestException as e:
			logger.error(f"Failed to submit job result: {e}")
			raise


processor = JobProcessor()
