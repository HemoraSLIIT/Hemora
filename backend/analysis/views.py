from rest_framework import generics, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import BloodSmearImage, Patient
from .serializers import (
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
