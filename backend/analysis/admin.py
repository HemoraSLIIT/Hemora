from django.contrib import admin
from .models import BloodSmearImage, Patient, PatientFeedback, AnalysisSession


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
	list_display = ("id", "first_name", "last_name", "gender", "status", "created_at")
	search_fields = ("first_name", "last_name", "email", "phone")
	list_filter = ("gender", "status", "created_at")


@admin.register(BloodSmearImage)
class BloodSmearImageAdmin(admin.ModelAdmin):
	list_display = ("id", "patient", "uploaded_at")
	list_filter = ("uploaded_at",)


@admin.register(PatientFeedback)
class PatientFeedbackAdmin(admin.ModelAdmin):
	list_display = ("id", "patient", "decision", "created_by", "created_at")
	search_fields = ("patient__first_name", "patient__last_name", "comment")
	list_filter = ("decision", "created_at")

@admin.register(AnalysisSession)
class AnalysisSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'status', 'models_used', 'processing_time_ms', 'created_at')
    list_filter = ('status',)
    readonly_fields = ('created_at', 'updated_at', 'processing_time_ms', 'results', 'inference_errors')
    search_fields = ('user__username', 'user__email')
