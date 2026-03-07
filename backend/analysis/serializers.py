"""Serializers for patient data and file uploads."""
from rest_framework import serializers

from .models import AnnotatedImage, BloodSmearImage, DiagnosisResult, Patient, PatientFeedback


class BloodSmearImageSerializer(serializers.ModelSerializer):
    uploadedAt = serializers.DateTimeField(source="uploaded_at", read_only=True)

    class Meta:
        model = BloodSmearImage
        fields = ["id", "image", "uploadedAt"]


class PatientSerializer(serializers.ModelSerializer):
    firstName = serializers.CharField(source="first_name")
    lastName = serializers.CharField(source="last_name")
    dateOfBirth = serializers.DateField(source="date_of_birth")
    bloodGroup = serializers.CharField(source="blood_group", required=False, allow_blank=True)
    emergencyContact = serializers.CharField(
        source="emergency_contact", required=False, allow_blank=True
    )
    emergencyPhone = serializers.CharField(
        source="emergency_phone", required=False, allow_blank=True
    )
    medicalHistory = serializers.CharField(
        source="medical_history", required=False, allow_blank=True
    )
    currentMedications = serializers.CharField(
        source="current_medications", required=False, allow_blank=True
    )
    referringDoctor = serializers.CharField(
        source="referring_doctor", required=False, allow_blank=True
    )
    suspectedDisease = serializers.CharField(
        source="suspected_disease", required=False, allow_blank=True
    )
    cbcReport = serializers.FileField(source="cbc_report")
    bloodSmearImages = BloodSmearImageSerializer(
        source="blood_smear_images", many=True, read_only=True
    )
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)
    statusDisplay = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Patient
        fields = [
            "id",
            "firstName",
            "lastName",
            "dateOfBirth",
            "age",
            "gender",
            "bloodGroup",
            "phone",
            "email",
            "address",
            "emergencyContact",
            "emergencyPhone",
            "medicalHistory",
            "currentMedications",
            "symptoms",
            "referringDoctor",
            "suspectedDisease",
            "status",
            "statusDisplay",
            "cbcReport",
            "bloodSmearImages",
            "createdAt",
            "updatedAt",
        ]
        read_only_fields = ["id", "bloodSmearImages", "createdAt", "updatedAt"]


class PatientCreateSerializer(PatientSerializer):
    cbcReport = serializers.FileField(source="cbc_report", required=True)

    class Meta(PatientSerializer.Meta):
        pass

    def validate(self, attrs):
        required_fields = ["first_name", "last_name", "date_of_birth", "gender", "cbc_report"]
        missing_fields = [field for field in required_fields if not attrs.get(field)]

        if missing_fields:
            raise serializers.ValidationError(
                {"detail": f"Missing required fields: {', '.join(missing_fields)}"}
            )

        return attrs


class PatientStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = ["status"]


class PatientUpdateSerializer(serializers.ModelSerializer):
    firstName = serializers.CharField(source="first_name", required=False)
    lastName = serializers.CharField(source="last_name", required=False)
    dateOfBirth = serializers.DateField(source="date_of_birth", required=False)
    bloodGroup = serializers.CharField(source="blood_group", required=False, allow_blank=True)
    emergencyContact = serializers.CharField(
        source="emergency_contact", required=False, allow_blank=True
    )
    emergencyPhone = serializers.CharField(
        source="emergency_phone", required=False, allow_blank=True
    )

    class Meta:
        model = Patient
        fields = [
            "firstName",
            "lastName",
            "dateOfBirth",
            "age",
            "gender",
            "bloodGroup",
            "phone",
            "email",
            "address",
            "emergencyContact",
            "emergencyPhone",
        ]


class PatientFeedbackSerializer(serializers.ModelSerializer):
    patientId = serializers.IntegerField(source="patient_id", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)
    createdBy = serializers.IntegerField(source="created_by_id", read_only=True)

    class Meta:
        model = PatientFeedback
        fields = [
            "id",
            "patientId",
            "results",
            "comment",
            "decision",
            "createdBy",
            "createdAt",
            "updatedAt",
        ]
        read_only_fields = [
            "id",
            "patientId",
            "createdBy",
            "createdAt",
            "updatedAt",
        ]


class CBCParametersSerializer(serializers.Serializer):
    """Accepts CBC parameter values for diagnosis."""

    wbc = serializers.FloatField(required=False, allow_null=True, default=None)
    rbc = serializers.FloatField(required=False, allow_null=True, default=None)
    hemoglobin = serializers.FloatField(required=False, allow_null=True, default=None)
    hematocrit = serializers.FloatField(required=False, allow_null=True, default=None)
    mcv = serializers.FloatField(required=False, allow_null=True, default=None)
    mch = serializers.FloatField(required=False, allow_null=True, default=None)
    mchc = serializers.FloatField(required=False, allow_null=True, default=None)
    rdw = serializers.FloatField(required=False, allow_null=True, default=None)
    platelet_count = serializers.FloatField(required=False, allow_null=True, default=None)
    neutrophils = serializers.FloatField(required=False, allow_null=True, default=None)
    lymphocytes = serializers.FloatField(required=False, allow_null=True, default=None)
    monocytes = serializers.FloatField(required=False, allow_null=True, default=None)
    eosinophils = serializers.FloatField(required=False, allow_null=True, default=None)
    basophils = serializers.FloatField(required=False, allow_null=True, default=None)


class AnnotatedImageSerializer(serializers.ModelSerializer):
    diseaseName = serializers.CharField(source="disease_name", read_only=True)
    detectionsCount = serializers.IntegerField(source="detections_count", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = AnnotatedImage
        fields = ["id", "diseaseName", "image", "detectionsCount", "createdAt"]


class DiagnosisResultSerializer(serializers.ModelSerializer):
    patientId = serializers.IntegerField(source="patient_id", read_only=True)
    plateletCount = serializers.FloatField(source="platelet_count", allow_null=True)
    cbcAnalysis = serializers.JSONField(source="cbc_analysis", read_only=True)
    imageAnalysis = serializers.JSONField(source="image_analysis", read_only=True)
    hybridAnalysis = serializers.JSONField(source="hybrid_analysis", read_only=True)
    analysisMethod = serializers.CharField(source="analysis_method", read_only=True)
    annotatedImages = AnnotatedImageSerializer(
        source="annotated_images", many=True, read_only=True
    )
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = DiagnosisResult
        fields = [
            "id",
            "patientId",
            "wbc",
            "rbc",
            "hemoglobin",
            "hematocrit",
            "mcv",
            "mch",
            "mchc",
            "rdw",
            "plateletCount",
            "neutrophils",
            "lymphocytes",
            "monocytes",
            "eosinophils",
            "basophils",
            "cbcAnalysis",
            "imageAnalysis",
            "hybridAnalysis",
            "analysisMethod",
            "annotatedImages",
            "createdAt",
            "updatedAt",
        ]
