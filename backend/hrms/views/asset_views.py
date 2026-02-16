from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from hrms.models import Asset, AssetCategory, AssetAllocation
from hrms.data.asset_serializers import AssetCategorySerializer, AssetSerializer, AssetAllocationSerializer
from django.utils import timezone

from hrms.permissions import HasAppPermission
from hrms.mixins.audit_mixin import AuditLogMixin
from hrms.services.asset_service import AssetService

class AssetCategoryViewSet(AuditLogMixin, viewsets.ModelViewSet):
    serializer_class = AssetCategorySerializer
    permission_classes = [IsAuthenticated, HasAppPermission]
    resource_name = 'asset'

    def get_queryset(self):
        return AssetCategory.objects.filter(tenant=self.request.user.tenant)

class AssetViewSet(AuditLogMixin, viewsets.ModelViewSet):
    serializer_class = AssetSerializer
    permission_classes = [IsAuthenticated, HasAppPermission]
    resource_name = 'asset'

    def get_queryset(self):
        return Asset.objects.filter(tenant=self.request.user.tenant)

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """
        Assign asset to an employee.
        Payload: { "employee_id": 1, "remarks": "..." }
        """
        asset_id = pk
        employee_id = request.data.get('employee_id')
        remarks = request.data.get('remarks', '')
        
        try:
            allocation, asset = AssetService.assign_asset(
                asset_id=asset_id,
                employee_id=employee_id,
                assigned_by_user=request.user,
                remarks=remarks,
                tenant=request.user.tenant
            )
            
            self._log_activity('ASSIGN', f"Assigned Asset {asset.name} to {allocation.employee.get_full_name()}")
            return Response({'status': 'Asset assigned successfully'})
            
        except Exception as e:
            # Let global handler manage known exceptions, or re-raise
            raise e

    @action(detail=True, methods=['post'])
    def return_asset(self, request, pk=None):
        """
        Mark asset as returned.
        Payload: { "return_condition": "Good", "remarks": "..." }
        """
        asset_id = pk
        return_condition = request.data.get('return_condition', 'Good')
        remarks = request.data.get('remarks', '')
        new_status = request.data.get('status', 'AVAILABLE')

        try:
             allocation, asset = AssetService.return_asset(
                asset_id=asset_id,
                return_condition=return_condition,
                remarks=remarks,
                new_status=new_status,
                tenant=request.user.tenant
             )
             
             employee_name = allocation.employee.get_full_name() if allocation else 'Unknown'
             self._log_activity('RETURN', f"Returned Asset {asset.name} from {employee_name}")
             return Response({'status': 'Asset returned successfully'})

        except Exception as e:
            raise e

class MyAssetsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    View for employees to see their own assets
    """
    serializer_class = AssetAllocationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'employee_profile'):
            return AssetAllocation.objects.filter(
                tenant=user.tenant,
                employee=user.employee_profile,
                is_active=True
            )
        return AssetAllocation.objects.none()
