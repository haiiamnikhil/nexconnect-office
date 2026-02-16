from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db import IntegrityError
from erp.models import Project, Task, InventoryItem, StockTransaction
from erp.data.serializers import ProjectSerializer, TaskSerializer, InventoryItemSerializer, StockTransactionSerializer
from typing import Any
import logging

logger = logging.getLogger(__name__)

class BaseTenantViewSet(viewsets.ModelViewSet):
    """
    Base ViewSet with multi-tenant support for ERP module.
    
    Provides automatic tenant filtering and validation for all ERP resources.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self) -> Any:
        """Filter queryset by current user's tenant."""
        if not self.request.user.tenant:
            logger.warning(f"ERP access attempt without tenant by user {self.request.user.id}")
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
            logger.error(f"ERP create attempt without tenant by user {self.request.user.id}")
            raise PermissionDenied("User must be associated with a tenant.")
        
        if not self.request.user.tenant.is_active:
            logger.warning(f"ERP create attempt on inactive tenant {self.request.user.tenant.id}")
            raise ValidationError("Cannot create resources for an inactive tenant.")
        
        try:
            instance = serializer.save(tenant=self.request.user.tenant)
            logger.info(
                f"Created {self.__class__.__name__} instance {instance.id}",
                extra={'user_id': self.request.user.id, 'tenant_id': self.request.user.tenant.id}
            )
        except IntegrityError as e:
            logger.error(f"Integrity error in {self.__class__.__name__}: {str(e)}")
            raise ValidationError(f"Duplicate entry or constraint violation: {str(e)}")

class ProjectViewSet(BaseTenantViewSet):
    """
    ViewSet for managing projects and client engagements.
    
    Provides CRUD operations with optimized queries for related data.
    """
    queryset = Project.objects.select_related(
        'tenant',
        'client',
        'manager',
        'manager__department'
    ).prefetch_related(
        'tasks'
    ).all()
    serializer_class = ProjectSerializer
    
    @action(detail=True, methods=['get'])
    def tasks_summary(self, request: Any, pk: str = None) -> Response:
        """Get task status summary for this project."""
        project = self.get_object()
        tasks = project.tasks.all()
        
        summary = {
            'total': tasks.count(),
            'todo': tasks.filter(status='TODO').count(),
            'in_progress': tasks.filter(status='IN_PROGRESS').count(),
            'review': tasks.filter(status='REVIEW').count(),
            'done': tasks.filter(status='DONE').count(),
        }
        
        logger.info(f"Tasks summary generated for project {pk}")
        return Response(summary)

class TaskViewSet(BaseTenantViewSet):
    """
    ViewSet for managing project tasks.
    
    Optimized for performance with related data pre-loading.
    """
    queryset = Task.objects.select_related(
        'tenant',
        'project',
        'project__client',
        'assigned_to',
        'assigned_to__department'
    ).all()
    serializer_class = TaskSerializer

class InventoryItemViewSet(BaseTenantViewSet):
    """
    ViewSet for managing inventory items and stock levels.
    
    Tracks product/asset inventory with pricing and reorder alerts.
    """
    queryset = InventoryItem.objects.select_related('tenant').prefetch_related(
        'transactions'
    ).all()
    serializer_class = InventoryItemSerializer
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request: Any) -> Response:
        """Get items at or below reorder level."""
        items = self.get_queryset().filter(
            quantity_on_hand__lte=models.F('reorder_level')
        )
        serializer = self.get_serializer(items, many=True)
        
        logger.info(
            f"Low stock items retrieved: {items.count()} items",
            extra={'tenant_id': request.user.tenant.id}
        )
        return Response(serializer.data)

class StockTransactionViewSet(BaseTenantViewSet):
    """
    ViewSet for managing stock transactions (in/out movements).
    
    Records inventory movements and automatically updates stock levels.
    Transactions are immutable after creation to maintain audit trail.
    """
    queryset = StockTransaction.objects.select_related(
        'tenant',
        'item',
        'created_by'
    ).all()
    serializer_class = StockTransactionSerializer
    
    def perform_create(self, serializer: Any) -> None:
        """
        Create stock transaction with user and tenant tracking.
        
        Automatically sets created_by to current user and validates tenant.
        """
        if not self.request.user.tenant:
            raise PermissionDenied("User must be associated with a tenant.")
        
        if not self.request.user.tenant.is_active:
            raise ValidationError("Cannot create transactions for an inactive tenant.")
        
        try:
            instance = serializer.save(
                tenant=self.request.user.tenant,
                created_by=self.request.user
            )
            logger.info(
                f"Stock transaction {instance.id} created: {instance.transaction_type} {instance.quantity} {instance.item.name}",
                extra={
                    'user_id': self.request.user.id,
                    'tenant_id': self.request.user.tenant.id,
                    'item_id': instance.item.id,
                    'transaction_type': instance.transaction_type,
                    'quantity': instance.quantity
                }
            )
        except IntegrityError as e:
            logger.error(f"Stock transaction integrity error: {str(e)}")
            raise ValidationError(f"Failed to create transaction: {str(e)}")
    
    def update(self, request: Any, *args, **kwargs) -> Response:
        """Prevent updates to maintain audit trail."""
        logger.warning(
            f"Attempted stock transaction update by user {request.user.id}",
            extra={'transaction_id': kwargs.get('pk')}
        )
        raise ValidationError("Stock transactions cannot be modified after creation for audit purposes.")
    
    def destroy(self, request: Any, *args, **kwargs) -> Response:
        """Prevent deletion to maintain audit trail."""
        logger.warning(
            f"Attempted stock transaction deletion by user {request.user.id}",
            extra={'transaction_id': kwargs.get('pk')}
        )
        raise ValidationError("Stock transactions cannot be deleted for audit purposes.")

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant, created_by=self.request.user)
