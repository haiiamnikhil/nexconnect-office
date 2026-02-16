from rest_framework import serializers
from hrms.models import Employee, Department, Leave, Attendance
from users.data.serializers import UserSerializer

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'
        read_only_fields = ['tenant', 'created_at']

class EmployeeSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Employee
        fields = ['id', 'user', 'user_details', 'department', 'department_name', 'designation', 'joining_date', 'salary', 'is_active']
        read_only_fields = ['tenant']

class LeaveSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    
    class Meta:
        model = Leave
        fields = '__all__'
        read_only_fields = ['tenant', 'status', 'approved_by']

class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)

    class Meta:
        model = Attendance
        fields = '__all__'
        read_only_fields = ['tenant', 'employee']
