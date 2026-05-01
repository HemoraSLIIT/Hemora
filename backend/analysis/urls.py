"""URL configuration for analysis app."""
from django.urls import path

from .views import (
    DiagnosisReportListCreateAPIView,
    MLModelStatusAPIView,
    NotificationDeleteAllAPIView,
    NotificationDeleteAPIView,
    NotificationListAPIView,
    NotificationMarkAllReadAPIView,
    NotificationMarkReadAPIView,
    PatientDiagnoseAPIView,
    PatientExtractCBCAPIView,
    PatientFeedbackListCreateAPIView,
    PatientListCreateAPIView,
    PatientRetrieveUpdateAPIView,
    PatientStatusUpdateAPIView,
)

app_name = "analysis"

urlpatterns = [
    path("patients/", PatientListCreateAPIView.as_view(), name="patient-list-create"),
    path("diagnosis-reports/", DiagnosisReportListCreateAPIView.as_view(), name="diagnosis-report-list-create"),
    path("patients/<int:pk>/", PatientRetrieveUpdateAPIView.as_view(), name="patient-retrieve-update"),
    path("patients/<int:pk>/status/", PatientStatusUpdateAPIView.as_view(), name="patient-status-update"),
    path("patients/<int:pk>/extract-cbc/", PatientExtractCBCAPIView.as_view(), name="patient-extract-cbc"),
    path("patients/<int:pk>/diagnose/", PatientDiagnoseAPIView.as_view(), name="patient-diagnose"),
    path("patients/<int:pk>/feedback/", PatientFeedbackListCreateAPIView.as_view(), name="patient-feedback-list-create"),
    path("notifications/", NotificationListAPIView.as_view(), name="notification-list"),
    path("notifications/delete-all/", NotificationDeleteAllAPIView.as_view(), name="notification-delete-all"),
    path("notifications/mark-all-read/", NotificationMarkAllReadAPIView.as_view(), name="notification-mark-all-read"),
    path("notifications/<int:pk>/", NotificationDeleteAPIView.as_view(), name="notification-delete"),
    path("notifications/<int:pk>/read/", NotificationMarkReadAPIView.as_view(), name="notification-mark-read"),
    path("ml-models/status/", MLModelStatusAPIView.as_view(), name="ml-model-status"),
]
