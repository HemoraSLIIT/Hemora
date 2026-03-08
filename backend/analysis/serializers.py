"""Serializers for patient data and file uploads."""
import os
from rest_framework import serializers
from django.conf import settings
from .models import BloodSmearImage,AnalysisSession, DiagnosisResult, Patient, PatientFeedback


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


class CBCDataSerializer(serializers.Serializer):
    """Validates Complete Blood Count fields (all optional but captured if present)."""
    wbc = serializers.FloatField(required=False, help_text="White Blood Cell count (×10³/µL)")
    rbc = serializers.FloatField(required=False, help_text="Red Blood Cell count (×10⁶/µL)")
    hemoglobin = serializers.FloatField(required=False, help_text="Hemoglobin (g/dL)")
    hematocrit = serializers.FloatField(required=False, help_text="Hematocrit (%)")
    mcv = serializers.FloatField(required=False, help_text="Mean Corpuscular Volume (fL)")
    mch = serializers.FloatField(required=False, help_text="Mean Corpuscular Hemoglobin (pg)")
    mchc = serializers.FloatField(required=False, help_text="Mean Corpuscular Hemoglobin Concentration (g/dL)")
    rdw = serializers.FloatField(required=False, help_text="Red Cell Distribution Width (%)")
    platelet_count = serializers.FloatField(required=False, help_text="Platelet count (×10³/µL)")
    neutrophils = serializers.FloatField(required=False, help_text="Neutrophils (%)")
    lymphocytes = serializers.FloatField(required=False, help_text="Lymphocytes (%)")
    monocytes = serializers.FloatField(required=False, help_text="Monocytes (%)")
    eosinophils = serializers.FloatField(required=False, help_text="Eosinophils (%)")
    basophils = serializers.FloatField(required=False, help_text="Basophils (%)")


class DiagnoseRequestSerializer(serializers.Serializer):
    """Multipart request: blood smear image + optional CBC fields."""
    image = serializers.ImageField(
        required=True,
        help_text="Blood smear microscopy image (JPG/PNG, max 10 MB)",
    )
    wbc = serializers.FloatField(required=False)
    rbc = serializers.FloatField(required=False)
    hemoglobin = serializers.FloatField(required=False)
    hematocrit = serializers.FloatField(required=False)
    mcv = serializers.FloatField(required=False)
    mch = serializers.FloatField(required=False)
    mchc = serializers.FloatField(required=False)
    rdw = serializers.FloatField(required=False)
    platelet_count = serializers.FloatField(required=False)
    neutrophils = serializers.FloatField(required=False)
    lymphocytes = serializers.FloatField(required=False)
    monocytes = serializers.FloatField(required=False)
    eosinophils = serializers.FloatField(required=False)
    basophils = serializers.FloatField(required=False)

    CBC_FIELDS = [
        'wbc', 'rbc', 'hemoglobin', 'hematocrit', 'mcv', 'mch',
        'mchc', 'rdw', 'platelet_count', 'neutrophils', 'lymphocytes',
        'monocytes', 'eosinophils', 'basophils',
    ]

    def get_cbc_data(self) -> dict:
        """Extract only the CBC fields that were actually provided."""
        data = self.validated_data
        return {field: data[field] for field in self.CBC_FIELDS if field in data}

    def validate_image(self, value):
        # --- file size check ---
        max_size = getattr(settings, 'ML_MAX_UPLOAD_SIZE', 10485760)
        if value.size > max_size:
            max_mb = max_size / (1024 * 1024)
            raise serializers.ValidationError(
                f"Image too large. Maximum allowed size is {max_mb:.0f} MB "
                f"(received {value.size / (1024*1024):.1f} MB)."
            )

        # --- file extension check ---
        allowed = [e.lower() for e in getattr(settings, 'ML_ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'tiff'])]
        ext = os.path.splitext(value.name)[1].lstrip('.').lower()
        if ext not in allowed:
            raise serializers.ValidationError(
                f"Unsupported file type '.{ext}'. "
                f"Allowed types: {', '.join(allowed)}."
            )

        return value


class DiseaseResultSerializer(serializers.Serializer):
    prediction = serializers.CharField()
    confidence = serializers.FloatField()
    probabilities = serializers.DictField(child=serializers.FloatField())


class DiagnoseResponseSerializer(serializers.Serializer):
    session_id = serializers.IntegerField()
    status = serializers.CharField()
    diseases = serializers.DictField(child=DiseaseResultSerializer())
    errors = serializers.DictField(child=serializers.CharField())
    cbc_data = serializers.DictField()
    models_used = serializers.ListField(child=serializers.CharField())
    processing_time_ms = serializers.FloatField()
    created_at = serializers.DateTimeField()


class AnalysisSessionSerializer(serializers.ModelSerializer):
    """Read serializer for listing/retrieving past sessions."""
    user = serializers.StringRelatedField()

    class Meta:
        model = AnalysisSession
        fields = [
            'id', 'user', 'status', 'cbc_data', 'results',
            'models_used', 'inference_errors', 'processing_time_ms',
            'error_message', 'created_at', 'updated_at',
        ]
        read_only_fields = fields


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


class DiagnosisResultSerializer(serializers.ModelSerializer):
    patientId = serializers.IntegerField(source="patient_id", read_only=True)
    plateletCount = serializers.FloatField(source="platelet_count", allow_null=True)
    cbcAnalysis = serializers.JSONField(source="cbc_analysis", read_only=True)
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
            "createdAt",
            "updatedAt",
        ]
