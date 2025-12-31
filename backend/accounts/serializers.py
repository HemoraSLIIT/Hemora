"""
Serializers for User model.
Handles conversion between User model instances and JSON.
Uses camelCase field names for frontend compatibility.
"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model (read operations).
    Uses camelCase field names for frontend compatibility.
    """
    fullName = serializers.SerializerMethodField()
    firstName = serializers.CharField(source='first_name')
    lastName = serializers.CharField(source='last_name')
    phoneNumber = serializers.CharField(source='phone_number', allow_blank=True, allow_null=True)
    medicalLicense = serializers.CharField(source='medical_license_number', allow_blank=True, allow_null=True)
    hospitalAffiliation = serializers.CharField(source='hospital_affiliation', allow_blank=True, allow_null=True)
    universityAffiliation = serializers.CharField(source='university_affiliation', allow_blank=True, allow_null=True)
    isVerified = serializers.BooleanField(source='is_verified')
    isActive = serializers.BooleanField(source='is_active')
    isStaff = serializers.BooleanField(source='is_staff')
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'firstName',
            'lastName',
            'fullName',
            'role',
            'phoneNumber',
            'medicalLicense',
            'specialization',
            'hospitalAffiliation',
            'universityAffiliation',
            'isVerified',
            'isActive',
            'isStaff',
            'createdAt',
            'updatedAt',
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']
    
    def get_fullName(self, obj):
        """Get user's full name."""
        return obj.get_full_name()


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new users.
    Includes password field with validation.
    Role-based field validation enforced.
    Uses camelCase field names for frontend compatibility.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    confirmPassword = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    firstName = serializers.CharField(source='first_name', required=False, allow_blank=True)
    lastName = serializers.CharField(source='last_name', required=False, allow_blank=True)
    phoneNumber = serializers.CharField(source='phone_number', required=False, allow_blank=True)
    medicalLicense = serializers.CharField(source='medical_license_number', required=False, allow_blank=True)
    hospitalAffiliation = serializers.CharField(source='hospital_affiliation', required=False, allow_blank=True)
    universityAffiliation = serializers.CharField(source='university_affiliation', required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'password',
            'confirmPassword',
            'firstName',
            'lastName',
            'role',
            'phoneNumber',
            'medicalLicense',
            'specialization',
            'hospitalAffiliation',
            'universityAffiliation',
        ]
    
    def validate(self, attrs):
        """Validate password confirmation and role-based required fields."""
        # Password confirmation check
        if attrs['password'] != attrs.pop('confirmPassword'):
            raise serializers.ValidationError({
                "confirmPassword": "Password fields didn't match."
            })
        
        role = attrs.get('role')
        
        # DOCTOR required fields
        if role == User.Role.DOCTOR:
            if not attrs.get('first_name'):
                raise serializers.ValidationError({
                    "firstName": "First name is required for doctors."
                })
            if not attrs.get('last_name'):
                raise serializers.ValidationError({
                    "lastName": "Last name is required for doctors."
                })
            if not attrs.get('medical_license_number'):
                raise serializers.ValidationError({
                    "medicalLicense": "Medical license number is required for doctors."
                })
            if not attrs.get('specialization'):
                raise serializers.ValidationError({
                    "specialization": "Specialization is required for doctors."
                })
            if not attrs.get('hospital_affiliation'):
                raise serializers.ValidationError({
                    "hospitalAffiliation": "Hospital affiliation is required for doctors."
                })
        
        # LAB_TECH required fields
        elif role == User.Role.LAB_TECH:
            if not attrs.get('first_name'):
                raise serializers.ValidationError({
                    "firstName": "First name is required for lab technicians."
                })
            if not attrs.get('last_name'):
                raise serializers.ValidationError({
                    "lastName": "Last name is required for lab technicians."
                })
            if not attrs.get('hospital_affiliation'):
                raise serializers.ValidationError({
                    "hospitalAffiliation": "Hospital/Lab affiliation is required for lab technicians."
                })
        
        # RESEARCHER required fields
        elif role == User.Role.RESEARCHER:
            if not attrs.get('first_name'):
                raise serializers.ValidationError({
                    "firstName": "First name is required for researchers."
                })
            if not attrs.get('last_name'):
                raise serializers.ValidationError({
                    "lastName": "Last name is required for researchers."
                })
            if not attrs.get('university_affiliation'):
                raise serializers.ValidationError({
                    "universityAffiliation": "University affiliation is required for researchers."
                })
        
        # ADMIN - only username, email, password required (already validated by serializer)
        
        return attrs
    
    def create(self, validated_data):
        """Create user with hashed password."""
        # Extract password
        password = validated_data.pop('password')
        
        # Create user
        user = User.objects.create(**validated_data)
        
        # Set password (this hashes it)
        user.set_password(password)
        user.save()
        
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating existing users.
    Password field is optional.
    Uses camelCase field names for frontend compatibility.
    """
    password = serializers.CharField(
        write_only=True,
        required=False,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    firstName = serializers.CharField(source='first_name', required=False, allow_blank=True)
    lastName = serializers.CharField(source='last_name', required=False, allow_blank=True)
    phoneNumber = serializers.CharField(source='phone_number', required=False, allow_blank=True)
    medicalLicense = serializers.CharField(source='medical_license_number', required=False, allow_blank=True)
    hospitalAffiliation = serializers.CharField(source='hospital_affiliation', required=False, allow_blank=True)
    universityAffiliation = serializers.CharField(source='university_affiliation', required=False, allow_blank=True)
    isVerified = serializers.BooleanField(source='is_verified', required=False)
    isActive = serializers.BooleanField(source='is_active', required=False)
    
    class Meta:
        model = User
        fields = [
            'email',
            'firstName',
            'lastName',
            'password',
            'role',
            'phoneNumber',
            'medicalLicense',
            'specialization',
            'hospitalAffiliation',
            'universityAffiliation',
            'isVerified',
            'isActive',
        ]
    
    def validate(self, attrs):
        """Validate role-based required fields on update."""
        instance = self.instance
        role = attrs.get('role', instance.role if instance else None)
        
        # Helper to get value from attrs or instance
        def get_value(field):
            if field in attrs:
                return attrs.get(field)
            return getattr(instance, field, None) if instance else None
        
        # DOCTOR required fields
        if role == User.Role.DOCTOR:
            if not get_value('first_name'):
                raise serializers.ValidationError({
                    "firstName": "First name is required for doctors."
                })
            if not get_value('last_name'):
                raise serializers.ValidationError({
                    "lastName": "Last name is required for doctors."
                })
            if not get_value('medical_license_number'):
                raise serializers.ValidationError({
                    "medicalLicense": "Medical license number is required for doctors."
                })
            if not get_value('specialization'):
                raise serializers.ValidationError({
                    "specialization": "Specialization is required for doctors."
                })
            if not get_value('hospital_affiliation'):
                raise serializers.ValidationError({
                    "hospitalAffiliation": "Hospital affiliation is required for doctors."
                })
        
        # LAB_TECH required fields
        elif role == User.Role.LAB_TECH:
            if not get_value('first_name'):
                raise serializers.ValidationError({
                    "firstName": "First name is required for lab technicians."
                })
            if not get_value('last_name'):
                raise serializers.ValidationError({
                    "lastName": "Last name is required for lab technicians."
                })
            if not get_value('hospital_affiliation'):
                raise serializers.ValidationError({
                    "hospitalAffiliation": "Hospital/Lab affiliation is required for lab technicians."
                })
        
        # RESEARCHER required fields
        elif role == User.Role.RESEARCHER:
            if not get_value('first_name'):
                raise serializers.ValidationError({
                    "firstName": "First name is required for researchers."
                })
            if not get_value('last_name'):
                raise serializers.ValidationError({
                    "lastName": "Last name is required for researchers."
                })
            if not get_value('university_affiliation'):
                raise serializers.ValidationError({
                    "universityAffiliation": "University affiliation is required for researchers."
                })
        
        return attrs
    
    def update(self, instance, validated_data):
        """Update user, handling password separately."""
        # Extract password if provided
        password = validated_data.pop('password', None)
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Update password if provided
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance


class UserListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing users.
    Returns minimal fields for performance.
    Uses camelCase field names for frontend compatibility.
    """
    fullName = serializers.SerializerMethodField()
    roleDisplay = serializers.CharField(source='get_role_display', read_only=True)
    isVerified = serializers.BooleanField(source='is_verified')
    isActive = serializers.BooleanField(source='is_active')
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'fullName',
            'role',
            'roleDisplay',
            'isVerified',
            'isActive',
            'createdAt',
        ]
    
    def get_fullName(self, obj):
        """Get user's full name."""
        return obj.get_full_name()
