"""Job management utilities for diagnosis processing."""

import logging
import uuid
from typing import Dict, Any, Optional
from django.utils import timezone
from django.db import transaction

from .models import DiagnosisJob, DiagnosisResult
from shared.logging_utils import log_job_event, set_correlation_id

logger = logging.getLogger(__name__)


def create_diagnosis_job(
	patient_id: int,
	cbc_parameters: Dict[str, float],
	analysis_method: str = "hybrid",
	correlation_id: Optional[str] = None,
) -> DiagnosisJob:
	"""Create a new diagnosis job.

	Args:
		patient_id: Patient database ID
		cbc_parameters: CBC parameter values
		analysis_method: "cbc_only" or "hybrid"
		correlation_id: Optional trace ID

	Returns:
		Created DiagnosisJob instance
	"""
	if not correlation_id:
		correlation_id = str(uuid.uuid4())

	set_correlation_id(correlation_id)

	job = DiagnosisJob.objects.create(
		patient_id=patient_id,
		cbc_parameters=cbc_parameters,
		analysis_method=analysis_method,
		correlation_id=correlation_id,
		status=DiagnosisJob.Status.PENDING,
	)

	log_job_event(logger, "job_created", str(job.id), job.status, {"patient_id": patient_id})
	return job


def mark_job_running(job_id: str) -> DiagnosisJob:
	"""Mark job as running."""
	job = DiagnosisJob.objects.get(id=job_id)
	job.status = DiagnosisJob.Status.RUNNING
	job.started_at = timezone.now()
	job.save(update_fields=["status", "started_at", "updated_at"])

	log_job_event(logger, "job_started", job_id, job.status)
	return job


def mark_job_succeeded(
	job_id: str,
	result_json: Dict[str, Any],
) -> DiagnosisJob:
	"""Mark job as succeeded and store result.

	Args:
		job_id: Job UUID
		result_json: Complete diagnosis result JSON
	"""
	job = DiagnosisJob.objects.get(id=job_id)
	job.status = DiagnosisJob.Status.SUCCEEDED
	job.result_json = result_json
	job.finished_at = timezone.now()
	job.save(update_fields=["status", "result_json", "finished_at", "updated_at"])

	log_job_event(logger, "job_succeeded", job_id, job.status)
	return job


def mark_job_failed(
	job_id: str,
	error_message: str,
	error_code: str = "unknown_error",
) -> DiagnosisJob:
	"""Mark job as failed and store error.

	Args:
		job_id: Job UUID
		error_message: Human-readable error message
		error_code: Machine-readable error code
	"""
	job = DiagnosisJob.objects.get(id=job_id)
	job.status = DiagnosisJob.Status.FAILED
	job.error_message = error_message
	job.error_code = error_code
	job.finished_at = timezone.now()
	job.save(update_fields=["status", "error_message", "error_code", "finished_at", "updated_at"])

	log_job_event(
		logger,
		"job_failed",
		job_id,
		job.status,
		{"error_code": error_code, "error_message": error_message},
	)
	return job


def schedule_job_retry(job_id: str, delay_seconds: int = 300) -> DiagnosisJob:
	"""Schedule job for retry if under max retries.

	Args:
		job_id: Job UUID
		delay_seconds: Seconds until next retry attempt

	Returns:
		Updated DiagnosisJob

	Raises:
		ValueError: If job cannot be retried
	"""
	job = DiagnosisJob.objects.get(id=job_id)

	if not job.can_retry:
		raise ValueError(f"Job {job_id} cannot be retried (already at max retries)")

	job.retry_count += 1
	job.status = DiagnosisJob.Status.PENDING
	job.next_retry_at = timezone.now() + timezone.timedelta(seconds=delay_seconds)
	job.save(update_fields=["retry_count", "status", "next_retry_at", "updated_at"])

	log_job_event(
		logger,
		"job_retry_scheduled",
		job_id,
		job.status,
		{"retry_count": job.retry_count, "delay_seconds": delay_seconds},
	)
	return job


@transaction.atomic
def finalize_job_with_diagnosis_result(
	job_id: str,
	result_json: Dict[str, Any],
	patient_id: int,
) -> DiagnosisJob:
	"""Mark job as succeeded and create/update DiagnosisResult.

	Args:
		job_id: Job UUID
		result_json: Complete result from ML service
		patient_id: Patient database ID

	Returns:
		Updated DiagnosisJob
	"""
	job = mark_job_succeeded(job_id, result_json)

	# Create or update DiagnosisResult
	# Extract CBC params and analysis results from result_json
	diagnosis, _ = DiagnosisResult.objects.update_or_create(
		patient_id=patient_id,
		defaults={
			"cbc_analysis": result_json.get("cbcAnalysis", {}),
			"image_analysis": result_json.get("imageAnalysis", {}),
			"hybrid_analysis": result_json.get("hybridAnalysis", []),
			"analysis_method": result_json.get("analysisMethod", "hybrid"),
		},
	)

	return job


def get_pending_jobs(limit: int = 10):
	"""Get pending jobs ready for processing.

	Returns jobs that are:
	- In PENDING status
	- Either no retry scheduled, or retry time has passed

	Args:
		limit: Maximum number of jobs to return

	Returns:
		QuerySet of DiagnosisJob instances
	"""
	from django.db.models import Q

	return DiagnosisJob.objects.filter(
		status=DiagnosisJob.Status.PENDING,
	).filter(
		Q(next_retry_at__isnull=True) | Q(next_retry_at__lte=timezone.now())
	).order_by("requested_at")[:limit]
