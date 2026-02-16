from rest_framework import viewsets, permissions
from users.models import Tenant
from users.data.serializers import TenantSerializer

class TenantViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Tenant Management.
    Restricted to Super Users.
    """
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser] 
    
    def get_queryset(self):
        # Only superusers see all tenants.
        # Regular users (even admins) only see their own tenant? 
        # Actually TenantViewSet is usually for System Administration.
        user = self.request.user
        if user.is_superuser:
            return Tenant.objects.all()
        return Tenant.objects.filter(id=user.tenant.id)
