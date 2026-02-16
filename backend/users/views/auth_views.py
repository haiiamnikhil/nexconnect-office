from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView

from users.services.auth_service import AuthService
from django.contrib.auth import update_session_auth_hash
from users.data.serializers import RegisterTenantSerializer, UserSerializer, CustomTokenObtainPairSerializer



class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class RegisterTenantView(generics.CreateAPIView):
    serializer_class = RegisterTenantSerializer
    permission_classes = [AllowAny, ]

    def create(self, request, *args, **kwargs):
        data = request.data
        ip = request.META.get('REMOTE_ADDR')
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]

        try:
            response_data = AuthService.register_tenant(data, ip, user_agent)
            return Response(response_data, status=status.HTTP_201_CREATED)
        except Exception as e:
            raise e

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change user password"""
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    is_first_time = request.data.get('is_first_time', False)  # For forced password change
    
    ip = request.META.get('REMOTE_ADDR')
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]

    try:
        # Note: request is passed to keep user logged in via update_session_auth_hash
        result = AuthService.change_password(
            user, old_password, new_password, is_first_time, 
            ip, user_agent, request
        )
        return Response(result)
    except Exception as e:
         raise e

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """Get current user"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

