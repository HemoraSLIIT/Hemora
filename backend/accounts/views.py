"""
Views for User API endpoints.
Handles CRUD operations for User model.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

from .models import User
from .serializers import (
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    UserListSerializer,
)

User = get_user_model()


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
        - Update/Delete: Admin only
        - List/Retrieve: Authenticated users
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
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
                username__icontains=search
            ) | queryset.filter(
                email__icontains=search
            ) | queryset.filter(
                first_name__icontains=search
            ) | queryset.filter(
                last_name__icontains=search
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
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
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
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
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
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
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
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
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
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
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
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        Get current user's profile.
        GET /api/users/me/
        """
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


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
