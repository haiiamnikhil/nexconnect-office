from rest_framework import serializers
from hrms.models import OnboardingTask, OffboardingRequest, ExitClearance

class OnboardingTaskSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.user.get_full_name')

    class Meta:
        model = OnboardingTask
        fields = '__all__'
        read_only_fields = ['tenant', 'assigned_by']

    def create(self, validated_data):
        validated_data['tenant'] = self.context['request'].user.tenant
        validated_data['assigned_by'] = self.context['request'].user
        return super().create(validated_data)

class ExitClearanceSerializer(serializers.ModelSerializer):
    cleared_by_name = serializers.ReadOnlyField(source='cleared_by.get_full_name')

    class Meta:
        model = ExitClearance
        fields = '__all__'
        read_only_fields = ['tenant', 'cleared_by', 'cleared_at']

class OffboardingRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.user.get_full_name')
    clearances = ExitClearanceSerializer(many=True, read_only=True)

    class Meta:
        model = OffboardingRequest
        fields = '__all__'
        read_only_fields = ['tenant', 'status'] # Status managed via actions

    def create(self, validated_data):
        validated_data['tenant'] = self.context['request'].user.tenant
        # If employee is requesting, set employee from user
        if not validated_data.get('employee'):
             if hasattr(self.context['request'].user, 'employee_profile'):
                 validated_data['employee'] = self.context['request'].user.employee_profile
        return super().create(validated_data)
