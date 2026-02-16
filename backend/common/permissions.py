"""
Custom permission classes for the SaaS platform.

Provides role-based access control for multi-tenant operations.
"""
from rest_framework.permissions import BasePermission
from typing import Any
import logging

logger = logging.getLogger(__name__)


class IsTenantMember(BasePermission):
    """
    Allow access only to users associated with a tenant.
    
    Ensures user is authenticated and belongs to an active tenant.
    """
    
    def has_permission(self, request: Any, view: Any) -> bool:
        """Check if user has an active tenant."""
        if not request.user.is_authenticated:
            return False
        
        if not request.user.tenant:
            logger.warning(f"Access denied: User {request.user.id} has no tenant")
            return False
        
        if not request.user.tenant.is_active:
            logger.warning(f"Access denied: Tenant {request.user.tenant.id} is inactive")
            return False
        
        return True


class IsTenantAdmin(BasePermission):
    """
    Allow access only to tenant administrators.
    
    Users with TENANT_ADMIN or SUPER_ADMIN roles can access.
    """
    
    def has_permission(self, request: Any, view: Any) -> bool:
        """Check if user is a tenant administrator."""
        if not request.user.is_authenticated:
            return False
        
        if not hasattr(request.user, 'is_tenant_admin'):
            return False
        
        is_admin = request.user.is_tenant_admin
        
        if not is_admin:
            logger.warning(
                f"Admin access denied for user {request.user.id}",
                extra={'user_role': request.user.role}
            )
        
        return is_admin


class IsSuperAdmin(BasePermission):
    """
    Allow access only to super administrators (SaaS platform owners).
    
    Highest level of access for platform-wide operations.
    """
    
    def has_permission(self, request: Any, view: Any) -> bool:
        """Check if user is a super administrator."""
        if not request.user.is_authenticated:
            return False
        
        if not hasattr(request.user, 'is_super_admin'):
            return False
        
        is_super = request.user.is_super_admin
        
        if not is_super:
            logger.warning(
                f"Super admin access denied for user {request.user.id}",
                extra={'user_role': request.user.role}
            )
        
        return is_super


class IsOwnerOrReadOnly(BasePermission):
    """
    Allow owners to modify objects, others can only read.
    
    Object-level permission to only allow owners of an object to edit it.
    """
    
    def has_object_permission(self, request: Any, view: Any, obj: Any) -> bool:
        """Check if user is the object owner or read-only request."""
        # Read permissions are allowed for any request
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        
        # Write permissions only for the owner
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        # Default to deny if no owner field found
        logger.warning(
            f"Ownership check failed for {obj.__class__.__name__} - no owner field",
            extra={'user_id': request.user.id}
        )
        return False


class IsSameTenant(BasePermission):
    """
    Ensure users can only access objects from their own tenant.
    
    Object-level permission for multi-tenant isolation.
    """
    
    def has_object_permission(self, request: Any, view: Any, obj: Any) -> bool:
        """Check if object belongs to user's tenant."""
        if not request.user.is_authenticated or not request.user.tenant:
            return False
        
        # Super admins can access all tenants
        if hasattr(request.user, 'is_super_admin') and request.user.is_super_admin:
            return True
        
        if hasattr(obj, 'tenant'):
            same_tenant = obj.tenant == request.user.tenant
            
            if not same_tenant:
                logger.warning(
                    f"Cross-tenant access attempt by user {request.user.id}",
                    extra={
                        'user_tenant': request.user.tenant.id,
                        'object_tenant': obj.tenant.id,
                        'object_type': obj.__class__.__name__
                    }
                )
            
            return same_tenant
        
        # If no tenant field, default to allow (for non-tenant objects)
        return True
