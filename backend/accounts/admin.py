from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom admin interface for User model."""
    
    # Fields to display in user list
    list_display = ['username', 'email', 'get_full_name', 'role', 'is_verified', 'is_active', 'created_at']
    
    # Filters in sidebar
    list_filter = ['role', 'is_verified', 'is_active', 'is_staff', 'created_at']
    
    # Search functionality
    search_fields = ['username', 'email', 'first_name', 'last_name', 'medical_license_number']
    
    # Fields to show when editing a user
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'email', 'phone_number')}),
        ('Professional Info', {
            'fields': ('role', 'medical_license_number', 'specialization', 'hospital_affiliation', 'is_verified')
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Important Dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    # Fields to show when adding a new user
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'role'),
        }),
    )
    
    # Default ordering
    ordering = ['-created_at']
