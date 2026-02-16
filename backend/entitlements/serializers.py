from rest_framework import serializers
from .models import Role, Permission, RolePermission, UserRoleAssignment
from users.models import User


class PermissionSerializer(serializers.ModelSerializer):
    """Serializer for Permission model"""
    class Meta:
        model = Permission
        fields = ['id', 'resource', 'action', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']


class RolePermissionSerializer(serializers.ModelSerializer):
    """Serializer for RolePermission mapping"""
    permission = PermissionSerializer(read_only=True)
    permission_id = serializers.PrimaryKeyRelatedField(
        queryset=Permission.objects.all(), 
        source='permission', 
        write_only=True
    )
    
    class Meta:
        model = RolePermission
        fields = ['id', 'permission', 'permission_id', 'granted_at']
        read_only_fields = ['id', 'granted_at']


class RoleSerializer(serializers.ModelSerializer):
    """Serializer for Role model"""
    permissions = PermissionSerializer(source='role_permissions.permission', many=True, read_only=True)
    permission_count = serializers.SerializerMethodField()
    user_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'is_system_role', 'permissions', 'permission_count', 'user_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'permission_count', 'user_count']
    
    def get_permission_count(self, obj):
        return obj.role_permissions.count()
    
    def get_user_count(self, obj):
        return obj.user_assignments.count()
    
    def create(self, validated_data):
        # Auto-assign tenant from request user
        request = self.context.get('request')
        validated_data['tenant'] = request.user.tenant
        return super().create(validated_data)


class UserRoleAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for User-Role Assignment"""
    role = RoleSerializer(read_only=True)
    role_id = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        source='role',
        write_only=True
    )
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='user',
        write_only=True
    )
    username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    assigned_by_name = serializers.CharField(source='assigned_by.username', read_only=True)
    
    class Meta:
        model = UserRoleAssignment
        fields = ['id', 'user_id', 'username', 'user_email', 'role', 'role_id', 'assigned_by', 'assigned_by_name', 'assigned_at']
        read_only_fields = ['id', 'assigned_by', 'assigned_at']
    
    def create(self, validated_data):
        # Auto-assign 'assigned_by' from request user
        request = self.context.get('request')
        validated_data['assigned_by'] = request.user
        return super().create(validated_data)


class PermissionMatrixSerializer(serializers.Serializer):
    """Serializer for bulk permission matrix update"""
    role_id = serializers.IntegerField()
    permission_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=True
    )
