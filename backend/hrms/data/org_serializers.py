from rest_framework import serializers
from hrms.models import Department, Designation, Location


class DepartmentSerializer(serializers.ModelSerializer):
    """Serializer for Department"""
    employee_count = serializers.SerializerMethodField()
    designation_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Department
        fields = ['id', 'name', 'description', 'employee_count', 'designation_count', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_employee_count(self, obj):
        return obj.employees.filter(is_active=True).count()
    
    def get_designation_count(self, obj):
        return obj.designations.filter(is_active=True).count()
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['tenant'] = request.user.tenant
        return super().create(validated_data)


class DesignationSerializer(serializers.ModelSerializer):
    """Serializer for Designation"""
    department_name = serializers.CharField(source='department.name', read_only=True)
    employee_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Designation
        fields = [
            'id', 'title', 'level', 'description', 'department',
            'department_name', 'employee_count', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_employee_count(self, obj):
        return obj.employees.filter(is_active=True).count() if hasattr(obj, 'employees') else 0
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['tenant'] = request.user.tenant
        return super().create(validated_data)


class LocationSerializer(serializers.ModelSerializer):
    """Serializer for Location"""
    employee_count = serializers.SerializerMethodField()
    full_address = serializers.SerializerMethodField()
    
    class Meta:
        model = Location
        fields = [
            'id', 'name', 'code', 'address', 'city', 'state',
            'country', 'pincode', 'phone', 'email', 'full_address',
            'is_headquarters', 'employee_count', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_employee_count(self, obj):
        # Can be extended when Employee model has location field
        return 0
    
    def get_full_address(self, obj):
        return f"{obj.address}, {obj.city}, {obj.state} - {obj.pincode}, {obj.country}"
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['tenant'] = request.user.tenant
        return super().create(validated_data)


class OrgHierarchySerializer(serializers.Serializer):
    """Serializer for organization hierarchy data"""
    departments = DepartmentSerializer(many=True)
    designations = DesignationSerializer(many=True)
    locations = LocationSerializer(many=True)
    total_employees = serializers.IntegerField()
    total_active_employees = serializers.IntegerField()
