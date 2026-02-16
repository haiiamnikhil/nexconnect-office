from django.utils import timezone
from rest_framework.exceptions import ValidationError
from hrms.models import Asset, AssetAllocation, Employee

class AssetService:
    @staticmethod
    def assign_asset(asset_id, employee_id, assigned_by_user, remarks='', tenant=None):
        try:
            asset = Asset.objects.get(id=asset_id, tenant=tenant)
        except Asset.DoesNotExist:
             raise ValidationError('Asset not found')

        if asset.status != 'AVAILABLE':
            raise ValidationError(f'Asset is {asset.status}, cannot assign.')

        try:
            employee = Employee.objects.get(id=employee_id, tenant=tenant)
        except Employee.DoesNotExist:
            raise ValidationError('Employee not found')

        # Create Allocation
        allocation = AssetAllocation.objects.create(
            asset=asset,
            employee=employee,
            assigned_date=timezone.now().date(),
            assigned_by=assigned_by_user,
            remarks=remarks,
            is_active=True,
            tenant=tenant
        )

        # Update Asset Status
        asset.status = 'ASSIGNED'
        asset.save()
        
        return allocation, asset

    @staticmethod
    def return_asset(asset_id, return_condition='Good', remarks='', new_status='AVAILABLE', tenant=None):
        try:
            asset = Asset.objects.get(id=asset_id, tenant=tenant)
        except Asset.DoesNotExist:
             raise ValidationError('Asset not found')

        if asset.status != 'ASSIGNED':
             raise ValidationError('Asset is not currently assigned.')

        # Close Allocation
        allocation = AssetAllocation.objects.filter(asset=asset, is_active=True).first()
        if allocation:
            allocation.is_active = False
            allocation.return_date = timezone.now().date()
            allocation.returned_condition = return_condition
            allocation.remarks = remarks
            allocation.save()

        # Update Asset Status
        if new_status not in ['AVAILABLE', 'IN_REPAIR', 'SCRAPPED']:
             new_status = 'AVAILABLE'
             
        asset.status = new_status
        asset.save()
        
        return allocation, asset
