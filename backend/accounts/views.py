"""
Views for User API endpoints.
Handles CRUD operations for User model.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db.models import Q

from .serializers import (
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    UserListSerializer,
    UserSelfUpdateSerializer,
)

User = get_user_model()


class IsAdminRole(BasePermission):
    """
    Custom permission to only allow users with Admin role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == User.Role.ADMIN)


class IsAdminOrSelf(BasePermission):
    """
    Custom permission to allow:
    - Admins to edit any user (but not their password)
    - Users to edit only their own profile
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)
    
    def has_object_permission(self, request, view, obj):
        # User can always edit themselves
        if obj == request.user:
            return True
        # Admin can edit anyone
        if request.user.role == User.Role.ADMIN:
            return True
        return False


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for User CRUD operations.
    
    Provides:
    - list: GET /api/users/
    - create: POST /api/users/
    - retrieve: GET /api/users/<id>/
    - update: PUT /api/users/<id>/
    - partial_update: PATCH /api/users/<id>/
    - destroy: DELETE /api/users/<id>/
    """
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        elif self.action == 'list':
            return UserListSerializer
        return UserSerializer
    
    def get_permissions(self):
        """
        Set permissions based on action.
        - Create: Admin only
        - Update/Partial Update: Admin or Self (with restrictions)
        - Delete: Admin only
        - List/Retrieve: Authenticated users
        """
        if self.action in ['create', 'destroy']:
            return [IsAdminRole()]
        elif self.action in ['update', 'partial_update']:
            return [IsAdminOrSelf()]
        return [IsAuthenticated()]
    
    def list(self, request, *args, **kwargs):
        """
        List all users.
        
        Query Parameters:
        - role: Filter by role (ADMIN, DOCTOR, LAB_TECH, RESEARCHER)
        - is_verified: Filter by verification status (true/false)
        - is_active: Filter by active status (true/false)
        - search: Search in username, email, first_name, last_name
        """
        queryset = self.get_queryset()
        
        # Filter by role
        role = request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        
        # Filter by verification status
        is_verified = request.query_params.get('is_verified')
        if is_verified is not None:
            queryset = queryset.filter(is_verified=is_verified.lower() == 'true')
        
        # Filter by active status
        is_active = request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Search functionality
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        """
        Create a new user.
        
        Required fields:
        - username
        - email
        - password
        - password_confirm
        - role
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Return full user data
        response_serializer = UserSerializer(user)
        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED
        )
    
    def update(self, request, *args, **kwargs):
        """
        Update user (full update - all fields required).
        
        Password rules:
        - Only the user themselves can change their password
        - Admin cannot change other users' passwords
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Check if admin is trying to change someone else's password
        is_self = instance == request.user
        is_admin = request.user.role == User.Role.ADMIN
        
        # Remove password from request if admin is editing someone else
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        if is_admin and not is_self and 'password' in data:
            data.pop('password')
        
        # Use appropriate serializer based on who is editing
        if is_self and not is_admin:
            # Non-admin user editing their own profile - use restricted serializer
            serializer = UserSelfUpdateSerializer(instance, data=data, partial=partial)
        else:
            # Admin editing (self or others) - use full serializer
            serializer = UserUpdateSerializer(instance, data=data, partial=partial)
        
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Return full user data
        response_serializer = UserSerializer(user)
        return Response(response_serializer.data)
    
    def partial_update(self, request, *args, **kwargs):
        """
        Partially update user (only provided fields updated).
        """
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """
        Delete a user.
        Note: Consider soft delete (setting is_active=False) instead.
        """
        instance = self.get_object()
        
        # Prevent deleting self
        if instance == request.user:
            return Response(
                {"detail": "You cannot delete your own account."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminRole])
    def verify(self, request, pk=None):
        """
        Verify a user's credentials.
        POST /api/users/<id>/verify/
        """
        user = self.get_object()
        user.is_verified = True
        user.save()
        
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminRole])
    def unverify(self, request, pk=None):
        """
        Unverify a user's credentials.
        POST /api/users/<id>/unverify/
        """
        user = self.get_object()
        user.is_verified = False
        user.save()
        
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminRole])
    def deactivate(self, request, pk=None):
        """
        Deactivate a user account.
        POST /api/users/<id>/deactivate/
        """
        user = self.get_object()
        
        # Prevent deactivating self
        if user == request.user:
            return Response(
                {"detail": "You cannot deactivate your own account."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.is_active = False
        user.save()
        
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminRole])
    def activate(self, request, pk=None):
        """
        Activate a user account.
        POST /api/users/<id>/activate/
        """
        user = self.get_object()
        user.is_active = True
        user.save()
        
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get', 'put', 'patch'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        Get or update current user's profile.
        GET /api/users/me/ - Get profile
        PUT/PATCH /api/users/me/ - Update profile
        
        Users can update their own profile including password.
        """
        if request.method == 'GET':
            serializer = UserSerializer(request.user)
            return Response(serializer.data)
        
        # PUT or PATCH - update profile
        partial = request.method == 'PATCH'
        
        # Use self-update serializer for non-admin users
        if request.user.role == User.Role.ADMIN:
            serializer = UserUpdateSerializer(request.user, data=request.data, partial=partial)
        else:
            serializer = UserSelfUpdateSerializer(request.user, data=request.data, partial=partial)
        
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        response_serializer = UserSerializer(user)
        return Response(response_serializer.data)


class RegisterView(APIView):
    """
    User registration endpoint that returns JWT tokens.
    POST /api/auth/register/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Register a new user and return JWT tokens.
        
        Required fields:
        - username
        - email
        - password
        - password_confirm
        
        Optional fields:
        - first_name
        - last_name
        - role (defaults to RESEARCHER)
        - phone_number
        - medical_license_number
        - specialization
        - hospital_affiliation
        """
        serializer = UserCreateSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
