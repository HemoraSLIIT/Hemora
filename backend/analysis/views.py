from django.contrib.auth import get_user_model
from django.utils import timezone
import logging

from django.conf import settings
from rest_framework import generics, status
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from .cbc_analyzer import analyze_cbc_parameters
from .cbc_extractor import extract_cbc_from_file
import logging
from collections import defaultdict

from .models import (
	AnnotatedImage,
	BloodSmearImage,
	DiagnosisResult,
	Notification,
	Patient,
	PatientFeedback,
)

logger = logging.getLogger(__name__)
from .serializers import (
	CBCParametersSerializer,
	DiagnosisResultSerializer,
	NotificationSerializer,
	PatientFeedbackSerializer,
	PatientCreateSerializer,
	PatientUpdateSerializer,
	PatientSerializer,
	PatientStatusUpdateSerializer,
)

User = get_user_model()


def create_notification(*, recipient, notification_type, title, message, actor=None, patient=None):
	if not recipient:
		return None

	return Notification.objects.create(
		recipient=recipient,
		actor=actor,
		patient=patient,
		notification_type=notification_type,
		title=title,
		message=message,
	)
from .models import AnalysisSession, BloodSmearImage, DiagnosisResult, Patient, PatientFeedback
from .serializers import (
    AnalysisSessionSerializer,
    CBCParametersSerializer,
    DiagnoseRequestSerializer,
    DiagnoseResponseSerializer,
    DiagnosisResultSerializer,
    PatientCreateSerializer,
    PatientFeedbackSerializer,
    PatientSerializer,
    PatientStatusUpdateSerializer,
    PatientUpdateSerializer,
)

logger = logging.getLogger(__name__)


class PatientListCreateAPIView(generics.ListCreateAPIView):
    """List all patients or create a patient with file uploads."""

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    queryset = Patient.objects.prefetch_related("blood_smear_images").all()

    def get_serializer_class(self):
        if self.request.method == "POST":
            return PatientCreateSerializer
        return PatientSerializer

    def create(self, request, *args, **kwargs):
        serializer = PatientCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        blood_smear_files = self._collect_blood_smear_files(request)
        if not blood_smear_files:
            return Response(
                {"detail": "At least one blood smear image is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        patient = serializer.save(created_by=request.user, status=Patient.Status.PENDING)

        for smear_file in blood_smear_files:
            BloodSmearImage.objects.create(patient=patient, image=smear_file)

        response_serializer = PatientSerializer(patient)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def _collect_blood_smear_files(self, request):
        # Supports both bloodSmearImages[] and indexed keys like bloodSmearImage0
        blood_smear_files = list(request.FILES.getlist("bloodSmearImages"))

        for key, uploaded_file in request.FILES.items():
            if key.startswith("bloodSmearImage"):
                blood_smear_files.append(uploaded_file)

        return blood_smear_files


class PatientStatusUpdateAPIView(generics.UpdateAPIView):
    """Allow changing patient status (Pending/In Progress/Diagnosed)."""

    permission_classes = [IsAuthenticated]
    queryset = Patient.objects.all()
    serializer_class = PatientStatusUpdateSerializer
    http_method_names = ["patch"]


class PatientRetrieveUpdateAPIView(generics.RetrieveUpdateDestroyAPIView):
    """Return, update, or delete a single patient."""

	permission_classes = [IsAuthenticated]
	parser_classes = [MultiPartParser, FormParser]
	queryset = Patient.objects.prefetch_related("blood_smear_images").all()
	http_method_names = ["get", "patch", "delete"]
    permission_classes = [IsAuthenticated]
    queryset = Patient.objects.prefetch_related("blood_smear_images").all()
    http_method_names = ["get", "patch", "delete"]

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return PatientUpdateSerializer
        return PatientSerializer

	def patch(self, request, *args, **kwargs):
		patient = self.get_object()
		serializer = self.get_serializer(patient, data=request.data, partial=True)
		serializer.is_valid(raise_exception=True)
		serializer.save()

		blood_smear_files = self._collect_blood_smear_files(request)
		files_updated = bool(blood_smear_files) or "cbcReport" in request.FILES

		if blood_smear_files:
			patient.blood_smear_images.all().delete()
			for smear_file in blood_smear_files:
				BloodSmearImage.objects.create(patient=patient, image=smear_file)

		if files_updated:
			DiagnosisResult.objects.filter(patient=patient).delete()

		patient.refresh_from_db()
		return Response(PatientSerializer(patient).data, status=status.HTTP_200_OK)

	def _collect_blood_smear_files(self, request):
		blood_smear_files = list(request.FILES.getlist("bloodSmearImages"))

		for key, uploaded_file in request.FILES.items():
			if key.startswith("bloodSmearImage"):
				blood_smear_files.append(uploaded_file)

		return blood_smear_files


class PatientExtractCBCAPIView(APIView):
	"""Extract CBC parameters from a patient's uploaded CBC report file."""

	permission_classes = [IsAuthenticated]

	def get(self, request, pk):
		try:
			patient = Patient.objects.get(pk=pk)
		except Patient.DoesNotExist:
			return Response({"detail": "Patient not found."}, status=status.HTTP_404_NOT_FOUND)

		if not patient.cbc_report:
			return Response(
				{"detail": "No CBC report uploaded for this patient."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		file_path = patient.cbc_report.path
		try:
			result = extract_cbc_from_file(file_path)
		except Exception as e:
			return Response(
				{"detail": f"Failed to extract CBC parameters: {str(e)}"},
				status=status.HTTP_500_INTERNAL_SERVER_ERROR,
			)

		return Response({
			"patientId": patient.id,
			"parameters": result["parameters"],
			"source": result["source"],
			"extractedCount": result["extractedCount"],
		}, status=status.HTTP_200_OK)


class PatientDiagnoseAPIView(APIView):
	"""Run CBC parameter analysis for a patient and store results."""

	permission_classes = [IsAuthenticated]

	def post(self, request, pk):
		"""Accept CBC parameters, run analysis + image analysis, save results."""
		try:
			patient = Patient.objects.get(pk=pk)
		except Patient.DoesNotExist:
			return Response({"detail": "Patient not found."}, status=status.HTTP_404_NOT_FOUND)

		param_serializer = CBCParametersSerializer(data=request.data)
		param_serializer.is_valid(raise_exception=True)
		cbc_params = {k: v for k, v in param_serializer.validated_data.items() if v is not None}

		if not cbc_params:
			return Response(
				{"detail": "At least one CBC parameter is required."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		# Run CBC analysis
		cbc_analysis = analyze_cbc_parameters(cbc_params)

		# Run image analysis on blood smear images
		image_results = {}
		analysis_method = "cbc_only"
		hybrid_analysis = cbc_analysis["diseaseAnalysis"]
		image_analysis_data = {}

		blood_smears = patient.blood_smear_images.all()
		if blood_smears.exists():
			try:
				from django.core.files.base import ContentFile
				from ml_inference.registry import ModelRegistry
				from ml_inference.base_detector import DetectionResult
				from ml_inference.hybrid_analyzer import compute_hybrid_analysis

				per_image_results = []
				aggregated_results = {}
				detection_totals = defaultdict(lambda: defaultdict(int))
				probability_totals = defaultdict(float)
				confidence_max = defaultdict(float)
				detection_counts = defaultdict(int)
				best_annotated_images = {}

				for smear_index, smear in enumerate(blood_smears, start=1):
					smear_results = ModelRegistry.run_all(smear.image.path)
					if not smear_results:
						continue

					per_image_results.append((smear_index, smear_results))

					for disease_name, result in smear_results.items():
						probability_totals[disease_name] += result.probability
						confidence_max[disease_name] = max(
							confidence_max[disease_name], result.confidence
						)
						detection_counts[disease_name] += 1

						for cell in result.detected_cells or []:
							detection_totals[disease_name][cell["class"]] += cell.get("count", 0)

						best_image = best_annotated_images.get(disease_name)
						if (
							best_image is None
							or result.probability > best_image["probability"]
						):
							best_annotated_images[disease_name] = {
								"probability": result.probability,
								"image_bytes": result.annotated_image_bytes,
							}

				for disease_name, count in detection_counts.items():
					aggregated_results[disease_name] = DetectionResult(
						disease_name=disease_name,
						probability=probability_totals[disease_name] / count,
						confidence=confidence_max[disease_name],
						detected_cells=[
							{"class": cell_class, "count": total_count}
							for cell_class, total_count in detection_totals[disease_name].items()
						],
						annotated_image_bytes=best_annotated_images.get(disease_name, {}).get("image_bytes"),
						raw_detections=sum(detection_totals[disease_name].values()),
					)

				image_results = aggregated_results

				if image_results:
					hybrid_analysis = compute_hybrid_analysis(cbc_analysis, image_results)
					analysis_method = "hybrid"
					image_analysis_data = {
						name: {
							"probability": round(r.probability, 4),
							"detectedCells": r.detected_cells,
							"totalDetections": r.raw_detections,
							"imagesAnalyzed": detection_counts.get(name, 0),
						}
						for name, r in image_results.items()
					}
					logger.info(
						"Hybrid analysis completed for patient %d: %d models ran",
						pk, len(image_results),
					)
			except Exception as e:
				logger.warning("Image analysis failed for patient %d: %s", pk, e)

		# Save or update diagnosis result
		diagnosis, _ = DiagnosisResult.objects.update_or_create(
			patient=patient,
			defaults={
				**cbc_params,
				"cbc_analysis": cbc_analysis,
				"image_analysis": image_analysis_data,
				"hybrid_analysis": hybrid_analysis,
				"analysis_method": analysis_method,
			},
		)

		# Save annotated images from ML detectors
		if image_results:
			diagnosis.annotated_images.all().delete()
			for smear_index, smear_results in per_image_results:
				for disease_name, result in smear_results.items():
					if result.annotated_image_bytes:
						filename = (
							f"{disease_name.replace(' ', '_').lower()}_smear_{smear_index}_annotated.png"
						)
						AnnotatedImage.objects.create(
							diagnosis=diagnosis,
							disease_name=f"{disease_name} - Smear {smear_index}",
							image=ContentFile(result.annotated_image_bytes, name=filename),
							detections_count=result.raw_detections,
						)

		# Update patient status to In Progress
		if patient.status == Patient.Status.PENDING:
			patient.status = Patient.Status.IN_PROGRESS
			patient.save(update_fields=["status", "updated_at"])

		patient_name = f"{patient.first_name} {patient.last_name}".strip() or f"Patient #{patient.id}"
		doctors = User.objects.filter(role=User.Role.DOCTOR, is_active=True).exclude(id=request.user.id)
		for doctor in doctors:
			create_notification(
				recipient=doctor,
				actor=request.user,
				patient=patient,
				notification_type=Notification.NotificationType.DIAGNOSIS_READY,
				title="Diagnosis ready for review",
				message=f"{patient_name} has a completed diagnosis and is ready for doctor review.",
			)

		return Response(DiagnosisResultSerializer(diagnosis).data, status=status.HTTP_200_OK)

	def get(self, request, pk):
		"""Retrieve existing diagnosis result for a patient."""
		try:
			diagnosis = DiagnosisResult.objects.get(patient_id=pk)
		except DiagnosisResult.DoesNotExist:
			return Response({"detail": "No diagnosis found for this patient."}, status=status.HTTP_404_NOT_FOUND)

		return Response(DiagnosisResultSerializer(diagnosis).data, status=status.HTTP_200_OK)


class PatientFeedbackListCreateAPIView(generics.ListCreateAPIView):
	"""List or create feedback entries for a specific patient."""

	permission_classes = [IsAuthenticated]
	serializer_class = PatientFeedbackSerializer

	def get_queryset(self):
		patient_id = self.kwargs["pk"]
		return PatientFeedback.objects.filter(patient_id=patient_id).select_related("patient")

	def create(self, request, *args, **kwargs):
		patient_id = kwargs["pk"]

		if getattr(request.user, "role", None) != "Doctor":
			return Response(
				{"detail": "Only doctors can submit patient feedback."},
				status=status.HTTP_403_FORBIDDEN,
			)

		try:
			patient = Patient.objects.get(pk=patient_id)
		except Patient.DoesNotExist:
			return Response({"detail": "Patient not found."}, status=status.HTTP_404_NOT_FOUND)

		if patient.status == Patient.Status.DIAGNOSED:
			return Response(
				{"detail": "Patient is already diagnosed. No more comments can be added."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		feedback = serializer.save(patient=patient, created_by=request.user)

		if feedback.decision == PatientFeedback.Decision.ACCEPT_RESULTS:
			patient.status = Patient.Status.DIAGNOSED
			patient.save(update_fields=["status", "updated_at"])

		patient_name = f"{patient.first_name} {patient.last_name}".strip() or f"Patient #{patient.id}"
		lab_user = patient.created_by
		if lab_user and lab_user.id != request.user.id:
			create_notification(
				recipient=lab_user,
				actor=request.user,
				patient=patient,
				notification_type=Notification.NotificationType.DOCTOR_FEEDBACK,
				title="Doctor submitted patient feedback",
				message=f"Doctor feedback was submitted for {patient_name}: {feedback.decision}.",
			)

		headers = self.get_success_headers(serializer.data)
		return Response(
			PatientFeedbackSerializer(feedback).data,
			status=status.HTTP_201_CREATED,
			headers=headers,
		)


class NotificationListAPIView(generics.ListAPIView):
	permission_classes = [IsAuthenticated]
	serializer_class = NotificationSerializer

	def get_queryset(self):
		return Notification.objects.filter(recipient=self.request.user).select_related("actor", "patient")

	def list(self, request, *args, **kwargs):
		queryset = self.get_queryset()
		serializer = self.get_serializer(queryset[:50], many=True)
		return Response(
			{
				"count": queryset.count(),
				"unreadCount": queryset.filter(is_read=False).count(),
				"results": serializer.data,
			},
			status=status.HTTP_200_OK,
		)


class NotificationMarkReadAPIView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request, pk):
		try:
			notification = Notification.objects.get(pk=pk, recipient=request.user)
		except Notification.DoesNotExist:
			return Response({"detail": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)

		if not notification.is_read:
			notification.is_read = True
			notification.read_at = timezone.now()
			notification.save(update_fields=["is_read", "read_at"])

		return Response(NotificationSerializer(notification).data, status=status.HTTP_200_OK)


class NotificationMarkAllReadAPIView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		Notification.objects.filter(recipient=request.user, is_read=False).update(
			is_read=True,
			read_at=timezone.now(),
		)
		return Response({"detail": "Notifications marked as read."}, status=status.HTTP_200_OK)


class NotificationDeleteAPIView(APIView):
	permission_classes = [IsAuthenticated]

	def delete(self, request, pk):
		try:
			notification = Notification.objects.get(pk=pk, recipient=request.user)
		except Notification.DoesNotExist:
			return Response({"detail": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)

		notification.delete()
		return Response(status=status.HTTP_204_NO_CONTENT)


class NotificationDeleteAllAPIView(APIView):
	permission_classes = [IsAuthenticated]

	def delete(self, request):
		deleted_count, _ = Notification.objects.filter(recipient=request.user).delete()
		return Response(
			{"detail": "Notifications deleted.", "deletedCount": deleted_count},
			status=status.HTTP_200_OK,
		)


class MLModelStatusAPIView(APIView):
	"""Return status of available ML models."""

	permission_classes = [IsAuthenticated]

	def get(self, request):
		try:
			from ml_inference.registry import ModelRegistry

			available = ModelRegistry.available_diseases()
		except Exception:
			available = []

		return Response({
			"availableModels": available,
			"totalModels": 4,
		})
    """List or create feedback entries for a specific patient."""

    permission_classes = [IsAuthenticated]
    serializer_class = PatientFeedbackSerializer

    def get_queryset(self):
        patient_id = self.kwargs["pk"]
        return PatientFeedback.objects.filter(patient_id=patient_id).select_related("patient")

    def create(self, request, *args, **kwargs):
        patient_id = kwargs["pk"]

        if getattr(request.user, "role", None) != "Doctor":
            return Response(
                {"detail": "Only doctors can submit patient feedback."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            patient = Patient.objects.get(pk=patient_id)
        except Patient.DoesNotExist:
            return Response({"detail": "Patient not found."}, status=status.HTTP_404_NOT_FOUND)

        if patient.status == Patient.Status.DIAGNOSED:
            return Response(
                {"detail": "Patient is already diagnosed. No more comments can be added."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        feedback = serializer.save(patient=patient, created_by=request.user)

        if feedback.decision == PatientFeedback.Decision.ACCEPT_RESULTS:
            patient.status = Patient.Status.DIAGNOSED
            patient.save(update_fields=["status", "updated_at"])

        headers = self.get_success_headers(serializer.data)
        return Response(
            PatientFeedbackSerializer(feedback).data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )


class DiagnoseView(APIView):
    """
    POST /api/analysis/diagnose/

    Accepts a multipart request with a blood smear image and optional CBC data.
    Runs all available YOLO models and returns disease predictions.
    Rate limited to 20 requests per minute per user.
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'diagnose'

    def post(self, request):
        req_serializer = DiagnoseRequestSerializer(data=request.data)
        if not req_serializer.is_valid():
            return Response(req_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        image_file = req_serializer.validated_data['image']
        cbc_data = req_serializer.get_cbc_data()

        # RAM guard — double-check size before reading entire file into memory
        max_size = getattr(settings, 'ML_MAX_UPLOAD_SIZE', 10485760)
        if hasattr(image_file, 'size') and image_file.size > max_size:
            return Response(
                {'error': f'Image file exceeds the {max_size // (1024*1024)} MB limit.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session = AnalysisSession.objects.create(
            user=request.user,
            cbc_data=cbc_data,
            status=AnalysisSession.Status.PENDING,
        )

        try:
            from ml_models.inference.predict import run_inference

            image_bytes = image_file.read()
            inference_result = run_inference(image_bytes, cbc_data)

            session.results = inference_result['diseases']
            session.models_used = inference_result['models_used']
            session.inference_errors = inference_result['errors']
            session.processing_time_ms = inference_result['processing_time_ms']
            session.status = AnalysisSession.Status.COMPLETED
            session.save(update_fields=[
                'results', 'models_used', 'inference_errors',
                'processing_time_ms', 'status', 'updated_at',
            ])

            response_data = {
                'session_id': session.pk,
                'status': session.status,
                'diseases': inference_result['diseases'],
                'errors': inference_result['errors'],
                'cbc_data': cbc_data,
                'models_used': inference_result['models_used'],
                'processing_time_ms': inference_result['processing_time_ms'],
                'created_at': session.created_at,
            }
            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as exc:
            logger.error("Inference failed for session %s: %s", session.pk, exc, exc_info=True)
            session.status = AnalysisSession.Status.FAILED
            session.error_message = str(exc)
            session.save(update_fields=['status', 'error_message', 'updated_at'])
            return Response(
                {'error': 'Inference failed.', 'detail': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AnalysisSessionListView(ListAPIView):
    """
    GET /api/analysis/sessions/

    Returns a paginated list of the current user's past analysis sessions.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = AnalysisSessionSerializer

    def get_queryset(self):
        return AnalysisSession.objects.filter(user=self.request.user)


class AnalysisSessionDetailView(RetrieveAPIView):
    """
    GET /api/analysis/sessions/<id>/

    Returns a single analysis session (must belong to the requesting user).
    """

    permission_classes = [IsAuthenticated]
    serializer_class = AnalysisSessionSerializer

    def get_queryset(self):
        return AnalysisSession.objects.filter(user=self.request.user)
