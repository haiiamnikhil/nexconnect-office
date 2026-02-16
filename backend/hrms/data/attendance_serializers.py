from rest_framework import serializers
from hrms.models import AttendancePolicy, Shift, Attendance, Employee
from datetime import  datetime


class AttendancePolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendancePolicy
        fields = '__all__'
        read_only_fields = ['id', 'tenant', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['tenant'] = request.user.tenant
        return super().create(validated_data)


class ShiftSerializer(serializers.ModelSerializer):
    duration = serializers.SerializerMethodField()
    
    class Meta:
        model = Shift
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_duration(self, obj):
        start_dt = datetime.combine(datetime.today(), obj.start_time)
        end_dt = datetime.combine(datetime.today(), obj.end_time)
        if end_dt < start_dt:  # Night shift
            from datetime import timedelta
            end_dt += timedelta(days=1)
        delta = end_dt - start_dt
        return round(delta.total_seconds() / 3600, 2)
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['tenant'] = request.user.tenant
        return super().create(validated_data)


class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    shift_name = serializers.CharField(source='shift.name', read_only=True)
    
    class Meta:
        model = Attendance
        fields = '__all__'
        read_only_fields = ['id', 'working_hours', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['tenant'] = request.user.tenant
        return super().create(validated_data)


class CheckInOutSerializer(serializers.Serializer):
    employee_id = serializers.IntegerField()
    check_in = serializers.TimeField(required=False)
    check_out = serializers.TimeField(required=False)
