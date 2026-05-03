"""Tests for diagnosis job creation and status endpoints."""

import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status as http_status
import uuid

from analysis.models import Patient, DiagnosisJob
from analysis.serializers import DiagnosisJobSerializer

User = get_user_model()


@pytest.mark.django_db
class TestDiagnosisJobEndpoints(TestCase):
	"""Test async diagnosis job endpoints."""

	def setUp(self):
		"""Set up test fixtures."""
		self.client = APIClient()

		# Create test user
		self.user = User.objects.create_user(
			username="testuser",
			email="test@example.com",
			password="testpass123"
		)
		self.client.force_authenticate(user=self.user)

		# Create test patient
		self.patient = Patient.objects.create(
			first_name="John",
			last_name="Doe",
			date_of_birth="1990-01-01",
			gender="Male",
			created_by=self.user,
		)

	def test_create_diagnosis_job_returns_202(self):
		"""POST /diagnose should return 202 Accepted with job ID."""
		url = f"/api/patients/{self.patient.id}/diagnose/"
		payload = {
			"wbc": 12.5,
			"rbc": 4.5,
			"hemoglobin": 13.2,
		}

		response = self.client.post(url, payload, format="json")

		assert response.status_code == http_status.HTTP_202_ACCEPTED
		assert "jobId" in response.json()
		assert "status" in response.json()
		assert response.json()["status"] == "pending"

	def test_created_job_persisted_in_db(self):
		"""Job should be persisted in database."""
		url = f"/api/patients/{self.patient.id}/diagnose/"
		payload = {
			"wbc": 12.5,
			"rbc": 4.5,
		}

		response = self.client.post(url, payload, format="json")
		job_id = response.json()["jobId"]

		job = DiagnosisJob.objects.get(id=job_id)
		assert job.patient_id == self.patient.id
		assert job.status == DiagnosisJob.Status.PENDING
		assert job.cbc_parameters["wbc"] == 12.5

	def test_get_job_status_returns_200(self):
		"""GET job detail should return 200 with status."""
		# Create job
		job = DiagnosisJob.objects.create(
			patient=self.patient,
			status=DiagnosisJob.Status.PENDING,
			cbc_parameters={"wbc": 12.5},
		)

		url = f"/api/patients/{self.patient.id}/diagnosis-jobs/{job.id}/"
		response = self.client.get(url)

		assert response.status_code == http_status.HTTP_200_OK
		data = response.json()
		assert data["jobId"] == str(job.id)
		assert data["status"] == "pending"

	def test_get_running_job_returns_202(self):
		"""GET running job should return 202."""
		job = DiagnosisJob.objects.create(
			patient=self.patient,
			status=DiagnosisJob.Status.RUNNING,
			cbc_parameters={},
		)

		url = f"/api/patients/{self.patient.id}/diagnosis-jobs/{job.id}/"
		response = self.client.get(url)

		assert response.status_code == http_status.HTTP_202_ACCEPTED

	def test_list_patient_jobs_ordered_by_date(self):
		"""List jobs should be ordered by most recent first."""
		job1 = DiagnosisJob.objects.create(
			patient=self.patient,
			status=DiagnosisJob.Status.PENDING,
			cbc_parameters={},
		)
		job2 = DiagnosisJob.objects.create(
			patient=self.patient,
			status=DiagnosisJob.Status.PENDING,
			cbc_parameters={},
		)

		url = f"/api/patients/{self.patient.id}/diagnosis-jobs/"
		response = self.client.get(url)

		assert response.status_code == http_status.HTTP_200_OK
		jobs = response.json()
		# job2 (newer) should be first
		assert jobs[0]["jobId"] == str(job2.id)

	def test_requires_authentication(self):
		"""Endpoints should require authentication."""
		self.client.force_authenticate(user=None)

		url = f"/api/patients/{self.patient.id}/diagnose/"
		response = self.client.post(url, {}, format="json")

		assert response.status_code == http_status.HTTP_403_FORBIDDEN

	def test_nonexistent_patient_returns_404(self):
		"""Nonexistent patient should return 404."""
		url = "/api/patients/99999/diagnose/"
		response = self.client.post(url, {"wbc": 12.5}, format="json")

		assert response.status_code == http_status.HTTP_404_NOT_FOUND

	def test_empty_cbc_parameters_returns_400(self):
		"""Empty CBC parameters should return 400."""
		url = f"/api/patients/{self.patient.id}/diagnose/"
		response = self.client.post(url, {}, format="json")

		assert response.status_code == http_status.HTTP_400_BAD_REQUEST

	def test_correlation_id_propagated(self):
		"""Correlation ID should be included in response."""
		url = f"/api/patients/{self.patient.id}/diagnose/"
		payload = {"wbc": 12.5}
		correlation_id = str(uuid.uuid4())

		response = self.client.post(
			url,
			payload,
			format="json",
			HTTP_X_CORRELATION_ID=correlation_id,
		)

		assert response.status_code == http_status.HTTP_202_ACCEPTED
		assert response.json()["correlationId"] == correlation_id
