from rest_framework import serializers
import logging
from django.db import transaction
from users.models import User, Tenant

class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ['id', 'name', 'domain', 'onboarding_step', 'currency', 'is_setup_complete']

class UserSerializer(serializers.ModelSerializer):
    tenant = TenantSerializer(read_only=True)
    employee_profile = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'tenant', 'is_superuser', 'is_staff', 'permissions', 'employee_profile', 'must_change_password']

    def get_employee_profile(self, obj):
        if hasattr(obj, 'employee_profile') and obj.employee_profile:
            # Return basic details needed for context
            emp = obj.employee_profile
            return {
                'id': emp.id,
                'employee_code': emp.employee_code,
                'designation': emp.designation,
                'department': emp.department.name if emp.department else None
            }
        return None

    def get_permissions(self, obj):
        logger = logging.getLogger(__name__)
        
        # 1. Get explicitly assigned roles (with safe check)
        assigned_roles = []
        try:
            if hasattr(obj, 'role_assignments'):
                assigned_roles = [assignment.role for assignment in obj.role_assignments.all()]
                logger.debug(f"User {obj.username} has {len(assigned_roles)} role(s) assigned")
        except Exception as e:
            logger.error(f"Error fetching role_assignments for user {obj.username}: {e}")
        
        # 2. Collect permissions
        perms = set()
        
        # Superuser gets all permissions (wildcard)
        if obj.is_superuser or obj.role == 'SUPER_ADMIN':
            logger.debug(f"User {obj.username} is superuser/SUPER_ADMIN - granting all permissions")
            return ['*:*'] 

        for role in assigned_roles:
            try:
                for rp in role.role_permissions.all():
                    p = rp.permission
                    perms.add(f"{p.resource}:{p.action}")
                logger.debug(f"Role '{role.name}' granted {len(perms)} permission(s) to {obj.username}")
            except Exception as e:
                logger.error(f"Error fetching permissions for role '{role.name}': {e}")
                
        logger.debug(f"Final permissions for {obj.username}: {list(perms)}")
        return list(perms)

class RegisterTenantSerializer(serializers.Serializer):
    # User fields
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    
    # Tenant fields
    company_name = serializers.CharField(max_length=255, write_only=True)
    domain = serializers.CharField(max_length=100, write_only=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value

    def validate_domain(self, value):
        if Tenant.objects.filter(domain=value).exists():
            raise serializers.ValidationError("Domain already exists")
        return value

    def create(self, validated_data):
        with transaction.atomic():
            # 1. Create Tenant
            tenant = Tenant.objects.create(
                name=validated_data['company_name'],
                domain=validated_data['domain']
            )
            
            # 2. Create User
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                password=validated_data['password'],
                first_name=validated_data.get('first_name', ''),
                last_name=validated_data.get('last_name', ''),
                tenant=tenant,
                role=User.Roles.SUPER_ADMIN
            )
            return user

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        # Add extra user data with prefetched permissions
        from django.db.models import Prefetch
        from entitlements.models import UserRoleAssignment, RolePermission
        
        # Prefetch role assignments with nested permissions
        user = self.user.__class__.objects.prefetch_related(
            Prefetch('role_assignments', queryset=UserRoleAssignment.objects.select_related('role')),
            Prefetch('role_assignments__role__role_permissions', 
                     queryset=RolePermission.objects.select_related('permission'))
        ).get(pk=self.user.pk)
        
        data['user'] = UserSerializer(user).data
        return data
