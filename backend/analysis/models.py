from django.conf import settings
from django.db import models


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


class AnalysisSession(models.Model):
    """
    Stores a blood disease analysis request and its ML results.
    Images are NOT persisted; only CBC data and inference results are stored.
    """

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        COMPLETED = 'COMPLETED', 'Completed'
        FAILED = 'FAILED', 'Failed'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='analysis_sessions',
    )

    # CBC values submitted with the request
    cbc_data = models.JSONField(default=dict, blank=True)

    # Inference output from all YOLO models: {disease: {prediction, confidence, probabilities}}
    results = models.JSONField(default=dict, blank=True)

    # List of disease types that were successfully run
    models_used = models.JSONField(default=list, blank=True)

    # Per-model inference errors
    inference_errors = models.JSONField(default=dict, blank=True)

    # Milliseconds taken by inference
    processing_time_ms = models.FloatField(null=True, blank=True)

    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.PENDING,
    )

    # Human-readable error if status == FAILED
    error_message = models.TextField(blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"AnalysisSession(user={self.user_id}, status={self.status}, id={self.pk})"
