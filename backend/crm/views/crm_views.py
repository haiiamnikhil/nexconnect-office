from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db import IntegrityError
from crm.models import Client, Lead, Interaction
from crm.data.serializers import ClientSerializer, LeadSerializer, InteractionSerializer
from typing import Any
import logging

logger = logging.getLogger(__name__)

class BaseTenantViewSet(viewsets.ModelViewSet):
    """
    Base ViewSet with multi-tenant support.
    
    Automatically filters queryset by tenant and validates tenant access.
    All tenant-specific ViewSets should inherit from this class.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self) -> Any:
        """Filter queryset by current user's tenant."""
        if not self.request.user.tenant:
            logger.warning(f"User {self.request.user.id} attempted access without tenant")
            return self.queryset.none()
        return self.queryset.filter(tenant=self.request.user.tenant)

    def perform_create(self, serializer: Any) -> None:
        """
        Save new instance with tenant validation.
        
        Raises:
            PermissionDenied: If user has no tenant
            ValidationError: If tenant is inactive or data is invalid
        """
        if not self.request.user.tenant:
            logger.error(f"Create attempt without tenant by user {self.request.user.id}")
            raise PermissionDenied("User must be associated with a tenant to create resources.")
        
        if not self.request.user.tenant.is_active:
            logger.warning(f"Create attempt on inactive tenant {self.request.user.tenant.id}")
            raise ValidationError("Cannot create resources for an inactive tenant.")
        
        try:
            instance = serializer.save(tenant=self.request.user.tenant)
            logger.info(
                f"Created {self.__class__.__name__} instance {instance.id}",
                extra={'user_id': self.request.user.id, 'tenant_id': self.request.user.tenant.id}
            )
        except IntegrityError as e:
            logger.error(f"Integrity error creating {self.__class__.__name__}: {str(e)}")
            raise ValidationError(f"Duplicate entry or constraint violation: {str(e)}")

class ClientViewSet(BaseTenantViewSet):
    """
    ViewSet for managing CRM clients/customers.
    
    Provides CRUD operations for clients with automatic tenant filtering.
    Optimized queries with select_related for better performance.
    """
    queryset = Client.objects.select_related('tenant').all()
    serializer_class = ClientSerializer

class LeadViewSet(BaseTenantViewSet):
    """
    ViewSet for managing sales leads.
    
    Tracks potential sales opportunities through the pipeline.
    Optimized with select_related and prefetch_related for related data.
    """
    queryset = Lead.objects.select_related(
        'tenant',
        'client',
        'assigned_to',
        'assigned_to__department'
    ).prefetch_related(
        'interactions'
    ).all()
    serializer_class = LeadSerializer

class InteractionViewSet(BaseTenantViewSet):
    """
    ViewSet for managing lead interactions (calls, emails, meetings).
    
    Logs all communications with potential customers.
    Automatically sets created_by to current user.
    """
    queryset = Interaction.objects.select_related(
        'tenant',
        'lead',
        'lead__client',
        'created_by'
    ).all()
    serializer_class = InteractionSerializer

    def perform_create(self, serializer: Any) -> None:
        """
        Save interaction with tenant and user validation.
        
        Automatically sets created_by to current authenticated user.
        """
        if not self.request.user.tenant:
            raise PermissionDenied("User must be associated with a tenant.")
        
        if not self.request.user.tenant.is_active:
            raise ValidationError("Cannot create resources for an inactive tenant.")
        
        try:
            instance = serializer.save(
                tenant=self.request.user.tenant,
                created_by=self.request.user
            )
            logger.info(
                f"Interaction {instance.id} created for lead {instance.lead.id}",
                extra={
                    'user_id': self.request.user.id,
                    'tenant_id': self.request.user.tenant.id,
                    'interaction_type': instance.type
                }
            )
        except IntegrityError as e:
            logger.error(f"Integrity error creating interaction: {str(e)}")
            raise ValidationError(f"Failed to create interaction: {str(e)}")
