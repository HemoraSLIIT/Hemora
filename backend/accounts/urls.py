"""
URL configuration for accounts app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet

# Create router and register viewset
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

app_name = 'accounts'

urlpatterns = [
    path('', include(router.urls)),
]
