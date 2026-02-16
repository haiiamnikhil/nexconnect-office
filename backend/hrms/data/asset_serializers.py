from rest_framework import serializers
from hrms.models import AssetCategory, Asset, AssetAllocation
from .employee_serializers import EmployeeListSerializer

class AssetCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetCategory
        fields = '__all__'
        read_only_fields = ['tenant']
    
    def create(self, validated_data):
        validated_data['tenant'] = self.context['request'].user.tenant
        return super().create(validated_data)

class AssetSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    location_name = serializers.ReadOnlyField(source='location.name')
    current_holder = serializers.SerializerMethodField()

    class Meta:
        model = Asset
        fields = '__all__'
        read_only_fields = ['tenant', 'status', 'current_holder']

    def get_current_holder(self, obj):
        if obj.status == 'ASSIGNED':
            allocation = obj.allocations.filter(is_active=True).first()
            if allocation:
                return f"{allocation.employee.first_name} {allocation.employee.last_name}"
        return None

    def create(self, validated_data):
        validated_data['tenant'] = self.context['request'].user.tenant
        return super().create(validated_data)

class AssetAllocationSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.first_name')
    asset_name = serializers.ReadOnlyField(source='asset.name')
    asset_serial = serializers.ReadOnlyField(source='asset.serial_number')

    class Meta:
        model = AssetAllocation
        fields = '__all__'
        read_only_fields = ['tenant', 'assigned_by', 'is_active']
