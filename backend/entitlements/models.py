from django.db import models
from users.models import User, Tenant

class Role(models.Model):
    """RBAC Role Definition"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='roles')
    is_system_role = models.BooleanField(default=False)  # Cannot be deleted
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['tenant', 'name']
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.tenant.name})"


class Permission(models.Model):
    """Granular Permissions for Resources"""
    PERMISSION_TYPES = [
        ('VIEW', 'View'),
        ('CREATE', 'Create'),
        ('EDIT', 'Edit'),
        ('DELETE', 'Delete'),
        ('APPROVE', 'Approve'),
    ]
    
    resource = models.CharField(max_length=100)  # e.g., 'employee', 'leave', 'payroll'
    action = models.CharField(max_length=20, choices=PERMISSION_TYPES)
    description = models.TextField(blank=True)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='permissions')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['tenant', 'resource', 'action']
        ordering = ['resource', 'action']
    
    def __str__(self):
        return f"{self.resource}:{self.action}"


class RolePermission(models.Model):
    """Role-Permission Mapping (Many-to-Many)"""
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='role_permissions')
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE, related_name='role_permissions')
    granted_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['role', 'permission']
    
    def __str__(self):
        return f"{self.role.name} -> {self.permission}"


class UserRoleAssignment(models.Model):
    """User-Role Assignment (Many-to-Many)"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='role_assignments')
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='user_assignments')
    assigned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='role_assignments_made')
    assigned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'role']
    
    def __str__(self):
        return f"{self.user.username} -> {self.role.name}"
