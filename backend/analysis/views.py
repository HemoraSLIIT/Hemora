import logging

from django.conf import settings
from rest_framework import generics, status
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import AnalysisSession, BloodSmearImage, Patient, PatientFeedback
from .serializers import (
    AnalysisSessionSerializer,
    DiagnoseRequestSerializer,
    DiagnoseResponseSerializer,
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
    queryset = Patient.objects.prefetch_related("blood_smear_images").all()
    http_method_names = ["get", "patch", "delete"]

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return PatientUpdateSerializer
        return PatientSerializer


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
