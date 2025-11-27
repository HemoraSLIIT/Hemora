from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """
    Custom User model for Hemora system.
    Extends Django's default User with additional fields.
    """

    # User Role Choices
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Administrator'
        DOCTOR = 'DOCTOR', 'Doctor'
        LAB_TECH = 'LAB_TECH', 'Lab_Technician'
        RESEARCHER = 'RESEARCHER', 'Researcher'

    # Additional Fields
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.LAB_TECH,
        help_text="User's role in the system"
    )

    phone_number = models.CharField(
        max_length=15,
        blank=True,
        null=True,
        help_text="Contact phone number"
    )

    medical_license_number = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Medical license number (for doctors)"
    )

    specialization = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Medical specialization (for doctors)"
    )

    hospital_affiliation = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Hospital or institution name"
    )

    is_verified = models.BooleanField(
        default=False,
        help_text="Whether user's credentials are verified"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.get_full_name()} ({self.get_role_display()})"
    
    def get_full_name(self):
        """Return user's full name or username if name not set."""
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name if full_name else self.username
    
    @property
    def is_doctor(self):
        """Check if user is a doctor."""
        return self.role == self.Role.DOCTOR
    
    @property
    def is_lab_technician(self):
        """Check if user is a lab technician."""
        return self.role == self.Role.LAB_TECH
    
    @property
    def is_researcher(self):
        """Check if user is a researcher."""
        return self.role == self.Role.RESEARCHER
    
    @property
    def is_admin(self):
        """Check if user is an administrator."""
        return self.role == self.Role.ADMIN

