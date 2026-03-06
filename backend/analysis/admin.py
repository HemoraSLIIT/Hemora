from django.contrib import admin

from .models import BloodSmearImage, Patient


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
	list_display = ("id", "first_name", "last_name", "gender", "status", "created_at")
	search_fields = ("first_name", "last_name", "email", "phone")
	list_filter = ("gender", "status", "created_at")


@admin.register(BloodSmearImage)
class BloodSmearImageAdmin(admin.ModelAdmin):
	list_display = ("id", "patient", "uploaded_at")
	list_filter = ("uploaded_at",)
