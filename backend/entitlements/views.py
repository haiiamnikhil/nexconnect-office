from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from .models import Role, Permission, RolePermission, UserRoleAssignment
from .serializers import (
    RoleSerializer, PermissionSerializer, RolePermissionSerializer,
    UserRoleAssignmentSerializer, PermissionMatrixSerializer
)


class RoleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Role management
    """
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Filter by tenant
        return Role.objects.filter(tenant=self.request.user.tenant)
    
    @action(detail=True, methods=['get'])
    def permissions(self, request, pk=None):
        """Get all permissions for a specific role"""
        role = self.get_object()
        role_permissions = role.role_permissions.all()
        serializer = RolePermissionSerializer(role_permissions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def assign_permissions(self, request, pk=None):
        """Assign multiple permissions to a role"""
        role = self.get_object()
        permission_ids = request.data.get('permission_ids', [])
        
        with transaction.atomic():
            # Clear existing permissions
            role.role_permissions.all().delete()
            
            # Assign new permissions
            for permission_id in permission_ids:
                try:
                    permission = Permission.objects.get(
                        id=permission_id,
                        tenant=request.user.tenant
                    )
                    RolePermission.objects.create(role=role, permission=permission)
                except Permission.DoesNotExist:
                    continue
        
        return Response({'message': f'{len(permission_ids)} permissions assigned successfully'})


class PermissionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Permission management
    """
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Permission.objects.filter(tenant=self.request.user.tenant)
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Bulk create permissions for multiple resources"""
        resources = request.data.get('resources', [])
        actions = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE']
        
        created_permissions = []
        with transaction.atomic():
            for resource in resources:
                for action_type in actions:
                    permission, created = Permission.objects.get_or_create(
                        tenant=request.user.tenant,
                        resource=resource,
                        action=action_type
                    )
                    if created:
                        created_permissions.append(permission)
        
        serializer = PermissionSerializer(created_permissions, many=True)
        return Response({
            'message': f'{len(created_permissions)} permissions created',
            'permissions': serializer.data
        })


class UserRoleAssignmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for User-Role Assignment
    """
    serializer_class = UserRoleAssignmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Filter by tenant through user's tenant
        user_ids = self.request.user.tenant.users.values_list('id', flat=True)
        return UserRoleAssignment.objects.filter(user__id__in=user_ids)
    
    @action(detail=False, methods=['get'], url_path='user/(?P<user_id>[^/.]+)')
    def user_roles(self, request, user_id=None):
        """Get all roles assigned to a specific user"""
        assignments = self.get_queryset().filter(user__id=user_id)
        serializer = self.get_serializer(assignments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def bulk_assign(self, request):
        """Assign multiple roles to a user"""
        user_id = request.data.get('user_id')
        role_ids = request.data.get('role_ids', [])
        
        with transaction.atomic():
            # Clear existing role assignments for the user
            UserRoleAssignment.objects.filter(user__id=user_id).delete()
            
            # Assign new roles
            for role_id in role_ids:
                try:
                    role = Role.objects.get(id=role_id, tenant=request.user.tenant)
                    UserRoleAssignment.objects.create(
                        user_id=user_id,
                        role=role,
                        assigned_by=request.user
                    )
                except Role.DoesNotExist:
                    continue
        
        return Response({'message': f'{len(role_ids)} roles assigned successfully'})


class PermissionMatrixViewSet(viewsets.ViewSet):
    """
    ViewSet for Permission Matrix operations
    """
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """Get permission matrix (all roles x all permissions)"""
        tenant = request.user.tenant
        roles = Role.objects.filter(tenant=tenant).prefetch_related('role_permissions__permission')
        permissions = Permission.objects.filter(tenant=tenant)
        
        matrix = []
        for role in roles:
            role_permissions = set(
                rp.permission.id for rp in role.role_permissions.all()
            )
            matrix.append({
                'role_id': role.id,
                'role_name': role.name,
                'permissions': [
                    {
                        'permission_id': perm.id,
                        'resource': perm.resource,
                        'action': perm.action,
                        'granted': perm.id in role_permissions
                    }
                    for perm in permissions
                ]
            })
        
        return Response(matrix)
    
    @action(detail=False, methods=['post'])
    def update_matrix(self, request):
        """Bulk update permission matrix"""
        updates = request.data.get('updates', [])  # [{ role_id, permission_ids }]
        
        with transaction.atomic():
            for update in updates:
                try:
                    role = Role.objects.get(
                        id=update['role_id'],
                        tenant=request.user.tenant
                    )
                    
                    # Clear and reassign permissions
                    role.role_permissions.all().delete()
                    
                    for perm_id in update.get('permission_ids', []):
                        permission = Permission.objects.get(
                            id=perm_id,
                            tenant=request.user.tenant
                        )
                        RolePermission.objects.create(role=role, permission=permission)
                except (Role.DoesNotExist, Permission.DoesNotExist):
                    continue
        
        return Response({'message': 'Permission matrix updated successfully'})
