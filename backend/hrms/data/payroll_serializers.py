from rest_framework import serializers
from hrms.models import (
    SalaryComponent, SalaryStructure, SalaryStructureComponent,
    EmployeeSalary, PayrollRun, Payslip, PayslipComponent, TaxDeclaration
)


class SalaryComponentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryComponent
        fields = '__all__'
        read_only_fields = ['tenant']

    def create(self, validated_data):
        validated_data['tenant'] = self.context['request'].user.tenant
        return super().create(validated_data)

class SalaryStructureComponentSerializer(serializers.ModelSerializer):
    component_details = SalaryComponentSerializer(source='component', read_only=True)
    
    class Meta:
        model = SalaryStructureComponent
        fields = ['id', 'structure', 'component', 'component_details', 'order']

class SalaryStructureSerializer(serializers.ModelSerializer):
    components = SalaryStructureComponentSerializer(source='salarystructurecomponent_set', many=True, read_only=True)
    component_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False
    )
    
    class Meta:
        model = SalaryStructure
        fields = '__all__'
        read_only_fields = ['tenant']

    def create(self, validated_data):
        component_ids = validated_data.pop('component_ids', [])
        validated_data['tenant'] = self.context['request'].user.tenant
        structure = super().create(validated_data)
        
        for index, comp_id in enumerate(component_ids):
            SalaryStructureComponent.objects.create(
                structure=structure,
                component_id=comp_id,
                order=index
            )
        return structure

    def update(self, instance, validated_data):
        component_ids = validated_data.pop('component_ids', None)
        structure = super().update(instance, validated_data)
        
        if component_ids is not None:
            instance.salarystructurecomponent_set.all().delete()
            for index, comp_id in enumerate(component_ids):
                SalaryStructureComponent.objects.create(
                    structure=structure,
                    component_id=comp_id,
                    order=index
                )
        return structure

class EmployeeSalarySerializer(serializers.ModelSerializer):
    structure_name = serializers.ReadOnlyField(source='structure.name')
    employee_name = serializers.ReadOnlyField(source='employee.first_name')
    
    class Meta:
        model = EmployeeSalary
        fields = '__all__'
        read_only_fields = ['tenant']

    def create(self, validated_data):
        validated_data['tenant'] = self.context['request'].user.tenant
        return super().create(validated_data)

class PayslipComponentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayslipComponent
        fields = ['name', 'code', 'type', 'amount']

class PayslipSerializer(serializers.ModelSerializer):
    line_items = PayslipComponentSerializer(many=True, read_only=True)
    employee_name = serializers.ReadOnlyField(source='employee.first_name')
    employee_code = serializers.ReadOnlyField(source='employee.employee_code')
    
    class Meta:
        model = Payslip
        fields = '__all__'
        read_only_fields = ['tenant', 'payslip_number', 'generated_at']

class PayrollRunSerializer(serializers.ModelSerializer):
    processed_by_name = serializers.ReadOnlyField(source='processed_by.email')
    
    class Meta:
        model = PayrollRun
        fields = '__all__'
        read_only_fields = ['tenant', 'processed_at', 'processed_by', 'total_net_pay', 'status']

class TaxDeclarationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaxDeclaration
        fields = '__all__'
        read_only_fields = ['tenant', 'status', 'verified_amount', 'admin_remarks', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['tenant'] = self.context['request'].user.tenant
        return super().create(validated_data)
