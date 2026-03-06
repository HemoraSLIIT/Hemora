from django.contrib import admin

from .models import BloodSmearImage, Patient, PatientFeedback


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
