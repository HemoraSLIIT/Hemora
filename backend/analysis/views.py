from rest_framework import generics, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .cbc_analyzer import analyze_cbc_parameters
from .cbc_extractor import extract_cbc_from_file
from .models import BloodSmearImage, DiagnosisResult, Patient, PatientFeedback
from .serializers import (
	CBCParametersSerializer,
	DiagnosisResultSerializer,
	PatientFeedbackSerializer,
	PatientCreateSerializer,
	PatientUpdateSerializer,
	PatientSerializer,
	PatientStatusUpdateSerializer,
)


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
		"""Accept CBC parameters, run analysis, save and return results."""
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

		# Run analysis
		analysis = analyze_cbc_parameters(cbc_params)

		# Save or update diagnosis result
		diagnosis, _ = DiagnosisResult.objects.update_or_create(
			patient=patient,
			defaults={**cbc_params, "cbc_analysis": analysis},
		)

		# Update patient status to In Progress
		if patient.status == Patient.Status.PENDING:
			patient.status = Patient.Status.IN_PROGRESS
			patient.save(update_fields=["status", "updated_at"])

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

		headers = self.get_success_headers(serializer.data)
		return Response(
			PatientFeedbackSerializer(feedback).data,
			status=status.HTTP_201_CREATED,
			headers=headers,
		)
