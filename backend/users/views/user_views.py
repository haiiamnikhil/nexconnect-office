from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from users.models import User
from users.data.serializers import UserSerializer
from hrms.permissions import HasAppPermission
from hrms.mixins.audit_mixin import AuditLogMixin

class UserViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """
    ViewSet for User Management.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, HasAppPermission]
    resource_name = 'user'
    activity_module = 'User'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    
    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return User.objects.all()
        return User.objects.filter(tenant=user.tenant)
        
    def perform_create(self, serializer):
        # Auto-assign tenant if not provided (though serializer might handle it)
        # AuditLogMixin handles logging
        serializer.save(tenant=self.request.user.tenant)
        super().perform_create(serializer)
        
    def perform_update(self, serializer):
        super().perform_update(serializer)
