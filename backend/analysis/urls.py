"""URL configuration for analysis app."""
from django.urls import path

from .views import (
    PatientFeedbackListCreateAPIView,
    PatientListCreateAPIView,
    PatientRetrieveUpdateAPIView,
    PatientStatusUpdateAPIView,
)

app_name = "analysis"

urlpatterns = [
    path("patients/", PatientListCreateAPIView.as_view(), name="patient-list-create"),
    path("patients/<int:pk>/", PatientRetrieveUpdateAPIView.as_view(), name="patient-retrieve-update"),
    path("patients/<int:pk>/status/", PatientStatusUpdateAPIView.as_view(), name="patient-status-update"),
    path("patients/<int:pk>/feedback/", PatientFeedbackListCreateAPIView.as_view(), name="patient-feedback-list-create"),
]
