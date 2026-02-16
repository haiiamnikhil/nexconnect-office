from rest_framework import permissions

class HasAppPermission(permissions.BasePermission):
    """
    Custom Permission class that enforces RBAC based on the ViewSet's 'resource_name'.
    
    Mapping:
    - GET -> VIEW
    - POST -> CREATE
    - PUT/PATCH -> EDIT
    - DELETE -> DELETE
    
    Special Actions:
    - 'approve', 'reject' -> APPROVE action
    """
    
    def has_permission(self, request, view):
        # 1. Super Admin Bypass
        if request.user.is_superuser or request.user.role == 'SUPER_ADMIN':
            return True
        
        # 2. Get Resource Name from View
        resource = getattr(view, 'resource_name', None)
        if not resource:
            # Fallback: If no resource defined, assume Safe Method or deny?
            # Safe default: Allow safe methods if authenticated (handled by IsAuthenticated), deny write
            if request.method in permissions.SAFE_METHODS:
                return True
            return False
            
        # 3. Determine Required Action
        action = self.get_action(request, view)
        if not action:
            return False
            
        # 4. Check Permissions
        # User -> Role Assignments -> Roles -> Permissions
        # We need to efficiently check if ANY of the user's roles has this permission.
        
        # Optimization: This query could be cached in request/user
        has_perm = request.user.role_assignments.filter(
            role__role_permissions__permission__resource=resource,
            role__role_permissions__permission__action=action
        ).exists()
        
        return has_perm

    def get_action(self, request, view):
        """Map HTTP method/View Action to RBAC Action"""
        
        # Specific ViewSet Actions (e.g. @action(detail=True))
        if view.action == 'approve' or view.action == 'reject':
            return 'APPROVE'
            
        method = request.method
        if method == 'GET':
            return 'VIEW'
        elif method == 'POST':
            return 'CREATE'
        elif method in ['PUT', 'PATCH']:
            return 'EDIT'
        elif method == 'DELETE':
            return 'DELETE'
        return None
