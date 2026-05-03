from django.conf import settings
from django.db import models
import uuid


class Patient(models.Model):
	"""Stores patient demographic/clinical details and the uploaded CBC report."""

	class Gender(models.TextChoices):
		MALE = "Male", "Male"
		FEMALE = "Female", "Female"
		OTHER = "Other", "Other"

	class Status(models.TextChoices):
		PENDING = "Pending", "Pending"
		IN_PROGRESS = "In Progress", "In Progress"
		DIAGNOSED = "Diagnosed", "Diagnosed"

	first_name = models.CharField(max_length=100)
	last_name = models.CharField(max_length=100)
	date_of_birth = models.DateField()
	age = models.PositiveIntegerField(blank=True, null=True)
	gender = models.CharField(max_length=10, choices=Gender.choices)
	blood_group = models.CharField(max_length=5, blank=True)
	phone = models.CharField(max_length=20, blank=True)
	email = models.EmailField(blank=True)
	address = models.TextField(blank=True)
	emergency_contact = models.CharField(max_length=150, blank=True)
	emergency_phone = models.CharField(max_length=20, blank=True)
	medical_history = models.TextField(blank=True)
	current_medications = models.TextField(blank=True)
	symptoms = models.TextField(blank=True)
	referring_doctor = models.CharField(max_length=150, blank=True)
	suspected_disease = models.CharField(max_length=150, blank=True)
	status = models.CharField(
		max_length=20,
		choices=Status.choices,
		default=Status.PENDING,
	)
	cbc_report = models.FileField(upload_to="patients/cbc_reports/%Y/%m/%d/")
	created_by = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.SET_NULL,
		blank=True,
		null=True,
		related_name="patients_created",
	)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ["-created_at"]

	def __str__(self):
		return f"{self.first_name} {self.last_name}"


class BloodSmearImage(models.Model):
	"""Stores each blood smear image linked to a patient."""

	patient = models.ForeignKey(
		Patient,
		on_delete=models.CASCADE,
		related_name="blood_smear_images",
	)
	image = models.ImageField(upload_to="patients/blood_smear/%Y/%m/%d/")
	uploaded_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["uploaded_at"]

	def __str__(self):
		return f"Blood smear image #{self.id} for patient #{self.patient_id}"


class PatientFeedback(models.Model):
	"""Stores doctor/lab decisions and comments for a patient result set."""

	class Decision(models.TextChoices):
		ACCEPT_RESULTS = "Accept Results", "Accept Results"
		RE_DIAGNOSIS = "Re-Diagnosis", "Re-Diagnosis"

	patient = models.ForeignKey(
		Patient,
		on_delete=models.CASCADE,
		related_name="feedback_entries",
	)
	results = models.JSONField(default=list, blank=True)
	comment = models.TextField(blank=True)
	decision = models.CharField(max_length=30, choices=Decision.choices)
	created_by = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.SET_NULL,
		blank=True,
		null=True,
		related_name="patient_feedback_entries",
	)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ["-created_at"]

	def __str__(self):
		return f"Feedback #{self.id} for patient #{self.patient_id}"


class DiagnosisResult(models.Model):
	"""Stores CBC parameter values and analysis results for a patient."""

	patient = models.OneToOneField(
		Patient,
		on_delete=models.CASCADE,
		related_name="diagnosis_result",
	)

	# CBC Parameters
	wbc = models.FloatField(null=True, blank=True)
	rbc = models.FloatField(null=True, blank=True)
	hemoglobin = models.FloatField(null=True, blank=True)
	hematocrit = models.FloatField(null=True, blank=True)
	mcv = models.FloatField(null=True, blank=True)
	mch = models.FloatField(null=True, blank=True)
	mchc = models.FloatField(null=True, blank=True)
	rdw = models.FloatField(null=True, blank=True)
	platelet_count = models.FloatField(null=True, blank=True)
	neutrophils = models.FloatField(null=True, blank=True)
	lymphocytes = models.FloatField(null=True, blank=True)
	monocytes = models.FloatField(null=True, blank=True)
	eosinophils = models.FloatField(null=True, blank=True)
	basophils = models.FloatField(null=True, blank=True)

	# Analysis results (JSON from cbc_analyzer)
	cbc_analysis = models.JSONField(default=dict, blank=True)

	# Image analysis results (per-disease ML scores)
	image_analysis = models.JSONField(default=dict, blank=True)

	# Combined hybrid analysis (CBC + image)
	hybrid_analysis = models.JSONField(default=list, blank=True)

	# Which method was used for this diagnosis
	analysis_method = models.CharField(
		max_length=20,
		choices=[("cbc_only", "CBC Only"), ("hybrid", "Hybrid")],
		default="cbc_only",
	)

	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	def __str__(self):
		return f"Diagnosis for patient #{self.patient_id}"


class AnnotatedImage(models.Model):
	"""Stores YOLO-annotated blood smear images with detected cell markings."""

	diagnosis = models.ForeignKey(
		DiagnosisResult,
		on_delete=models.CASCADE,
		related_name="annotated_images",
	)
	disease_name = models.CharField(max_length=100)
	image = models.ImageField(upload_to="patients/annotated/%Y/%m/%d/")
	detections_count = models.IntegerField(default=0)
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"Annotated image for {self.disease_name} (diagnosis #{self.diagnosis_id})"


class DiagnosisReport(models.Model):
	"""Stores generated diagnosis report PDFs for later viewing/downloading."""

	patient = models.ForeignKey(
		Patient,
		on_delete=models.CASCADE,
		related_name="diagnosis_reports",
	)
	diagnosis = models.ForeignKey(
		DiagnosisResult,
		on_delete=models.SET_NULL,
		blank=True,
		null=True,
		related_name="saved_reports",
	)
	title = models.CharField(max_length=200, blank=True)
	report_file = models.FileField(upload_to="patients/diagnosis_reports/%Y/%m/%d/")
	created_by = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.SET_NULL,
		blank=True,
		null=True,
		related_name="diagnosis_reports_created",
	)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["-created_at"]

	def __str__(self):
		return self.title or f"Diagnosis report #{self.id} for patient #{self.patient_id}"


class Notification(models.Model):
	"""Stores user notifications for diagnosis workflow updates."""

	class NotificationType(models.TextChoices):
		DIAGNOSIS_READY = "diagnosis_ready", "Diagnosis Ready"
		DOCTOR_FEEDBACK = "doctor_feedback", "Doctor Feedback"

	recipient = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="notifications",
	)
	actor = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.SET_NULL,
		blank=True,
		null=True,
		related_name="triggered_notifications",
	)
	patient = models.ForeignKey(
		Patient,
		on_delete=models.CASCADE,
		blank=True,
		null=True,
		related_name="notifications",
	)
	notification_type = models.CharField(max_length=30, choices=NotificationType.choices)
	title = models.CharField(max_length=200)
	message = models.TextField()
	is_read = models.BooleanField(default=False)
	read_at = models.DateTimeField(blank=True, null=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["is_read", "-created_at"]

	def __str__(self):
		return f"Notification #{self.id} for user #{self.recipient_id}"


class DiagnosisJob(models.Model):
	"""Tracks async diagnosis job status and results.

	Job lifecycle:
	  pending → running → succeeded (or failed)

	Allows frontend to poll status and retrieve results asynchronously.
	"""

	class Status(models.TextChoices):
		PENDING = "pending", "Pending"
		RUNNING = "running", "Running"
		SUCCEEDED = "succeeded", "Succeeded"
		FAILED = "failed", "Failed"

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	patient = models.ForeignKey(
		Patient,
		on_delete=models.CASCADE,
		related_name="diagnosis_jobs",
	)
	status = models.CharField(
		max_length=20,
		choices=Status.choices,
		default=Status.PENDING,
	)

	# Job request context
	cbc_parameters = models.JSONField(default=dict)  # {key: value, ...}
	analysis_method = models.CharField(
		max_length=20,
		choices=[("cbc_only", "CBC Only"), ("hybrid", "Hybrid")],
		default="hybrid",
	)

	# Job result (populated on success)
	result_json = models.JSONField(default=dict, blank=True)

	# Job error tracking (populated on failure)
	error_message = models.TextField(blank=True)
	error_code = models.CharField(max_length=50, blank=True)

	# Job timing
	requested_at = models.DateTimeField(auto_now_add=True)
	started_at = models.DateTimeField(blank=True, null=True)
	finished_at = models.DateTimeField(blank=True, null=True)

	# Retry tracking
	retry_count = models.PositiveIntegerField(default=0, db_index=True)
	max_retries = models.PositiveIntegerField(default=3)
	next_retry_at = models.DateTimeField(blank=True, null=True)

	# Correlation ID for tracing across services
	correlation_id = models.CharField(max_length=100, blank=True, db_index=True)

	# Created/updated timestamps
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ["-requested_at"]
		indexes = [
			models.Index(fields=["status", "updated_at"]),
			models.Index(fields=["patient", "status"]),
			models.Index(fields=["retry_count", "status"]),
		]

	def __str__(self):
		return f"DiagnosisJob {self.id} for patient #{self.patient_id}: {self.status}"

	@property
	def is_terminal(self) -> bool:
		"""Job has finished (succeeded or failed)."""
		return self.status in (self.Status.SUCCEEDED, self.Status.FAILED)

	@property
	def can_retry(self) -> bool:
		"""Job can be retried (failed and under max retries)."""
		return self.status == self.Status.FAILED and self.retry_count < self.max_retries
