from rest_framework import serializers
from hrms.models import AppraisalCycle, Goal, Review
from .employee_serializers import EmployeeListSerializer

class AppraisalCycleSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppraisalCycle
        fields = '__all__'
        read_only_fields = ['tenant']

    def create(self, validated_data):
        validated_data['tenant'] = self.context['request'].user.tenant
        return super().create(validated_data)

class GoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Goal
        fields = '__all__'
        read_only_fields = ['tenant', 'employee', 'progress'] # Employee set automatically

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['tenant'] = user.tenant
        if hasattr(user, 'employee_profile'):
             validated_data['employee'] = user.employee_profile
        return super().create(validated_data)

class GoalUpdateSerializer(serializers.ModelSerializer):
    """Allows updating progress/status"""
    class Meta:
        model = Goal
        fields = ['progress', 'status', 'title', 'description', 'weightage']

class ReviewSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.first_name')
    reviewer_name = serializers.ReadOnlyField(source='reviewer.first_name')
    cycle_name = serializers.ReadOnlyField(source='cycle.name')
    
    class Meta:
        model = Review
        fields = '__all__'
        read_only_fields = ['tenant', 'employee', 'cycle', 'reviewer', 'final_rating']

class ReviewSubmitSerializer(serializers.ModelSerializer):
    """For Self Review Submission"""
    class Meta:
        model = Review
        fields = ['self_rating', 'self_comments']

class ReviewManagerRatingSerializer(serializers.ModelSerializer):
    """For Manager Rating"""
    class Meta:
        model = Review
        fields = ['manager_rating', 'manager_comments']
