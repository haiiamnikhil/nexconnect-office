from django.contrib.auth import update_session_auth_hash
from rest_framework.exceptions import ValidationError
from users.models import UserActivity, User
from users.data.serializers import RegisterTenantSerializer, UserSerializer, CustomTokenObtainPairSerializer

class AuthService:
    @staticmethod
    def register_tenant(data, ip_address, user_agent):
        serializer = RegisterTenantSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Log Activity
        UserActivity.objects.create(
            user=user,
            tenant=user.tenant,
            action='CREATE',
            module='Tenant Registration',
            description=f"Registered new tenant: {user.tenant.name}",
            ip_address=ip_address,
            user_agent=user_agent
        )

        try:
             # Seed Default Data
             from hrms.services.tenant_init_service import TenantInitializationService
             TenantInitializationService.seed_defaults(user.tenant, user)
        except Exception as e:
             # Log but allow registration to complete
             import logging
             logging.getLogger(__name__).error(f"Failed to seed defaults: {e}")
        
        # Return User + Token immediately with prefetched permissions
        from django.db.models import Prefetch
        from hrms.models import UserRoleAssignment, RolePermission
        
        # Prefetch role assignments with nested permissions
        user_with_perms = User.objects.prefetch_related(
            Prefetch('role_assignments', queryset=UserRoleAssignment.objects.select_related('role')),
            Prefetch('role_assignments__role__role_permissions', 
                     queryset=RolePermission.objects.select_related('permission'))
        ).get(pk=user.pk)
        
        refresh = CustomTokenObtainPairSerializer.get_token(user_with_perms)
        
        return {
            "user": UserSerializer(user_with_perms).data,
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }

    @staticmethod
    def change_password(user, old_password, new_password, is_first_time, ip_address, user_agent, request=None):
        if not old_password or not new_password:
             raise ValidationError('Both old_password and new_password are required')
        
        if not user.check_password(old_password):
             raise ValidationError('Current password is incorrect')
        
        if len(new_password) < 8:
             raise ValidationError('New password must be at least 8 characters long')
        
        # Check if new password is same as old
        if old_password == new_password:
             raise ValidationError('New password must be different from current password')
        
        user.set_password(new_password)
        
        # Clear must_change_password flag
        if user.must_change_password:
            user.must_change_password = False
        
        user.save()
        
        # Log activity
        UserActivity.objects.create(
            user=user,
            tenant=user.tenant,
            action='UPDATE',
            module='Password Change',
            description=f"Password changed {'(first-time setup)' if is_first_time else ''}",
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        result = {'message': 'Password changed successfully'}
        
        if is_first_time:
            result['logout_required'] = True
            result['message'] += ' Please login with your new password.'
        elif request:
             # Keep user logged in for regular password changes
             update_session_auth_hash(request, user)
             
        return result
