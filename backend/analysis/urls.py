"""URL configuration for analysis app."""
from django.urls import path

from .views import (
    DiagnoseView,
    PatientFeedbackListCreateAPIView,
    PatientListCreateAPIView,
    PatientRetrieveUpdateAPIView,
    PatientStatusUpdateAPIView,
    AnalysisSessionListView,
    AnalysisSessionDetailView
)

app_name = "analysis"

urlpatterns = [
    path("patients/", PatientListCreateAPIView.as_view(), name="patient-list-create"),
    path("patients/<int:pk>/", PatientRetrieveUpdateAPIView.as_view(), name="patient-retrieve-update"),
    path("patients/<int:pk>/status/", PatientStatusUpdateAPIView.as_view(), name="patient-status-update"),
    path("patients/<int:pk>/feedback/", PatientFeedbackListCreateAPIView.as_view(), name="patient-feedback-list-create"),
    path('analysis/diagnose/', DiagnoseView.as_view(), name='diagnose'),
    path('analysis/sessions/', AnalysisSessionListView.as_view(), name='session-list'),
    path('analysis/sessions/<int:pk>/', AnalysisSessionDetailView.as_view(), name='session-detail'),
]
