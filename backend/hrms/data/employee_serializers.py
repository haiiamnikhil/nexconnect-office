from rest_framework import serializers
from hrms.models import Employee, EmployeeDocument, EmployeeSkill, Department, EmployeeEducation, EmployeeExperience, EmployeeBGV
from users.models import User
from hrms.data.serializers import DepartmentSerializer


class EmployeeDocumentSerializer(serializers.ModelSerializer):
    """Serializer for Employee Documents"""
    uploaded_by_name = serializers.CharField(source='uploaded_by.username', read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = EmployeeDocument
        fields = [
            'id', 'document_type', 'document_name', 'file', 'file_url',
            'file_size', 'uploaded_by', 'uploaded_by_name', 'uploaded_at', 'notes'
        ]
        read_only_fields = ['id', 'uploaded_by', 'uploaded_at', 'file_size']
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
        return None


class EmployeeSkillSerializer(serializers.ModelSerializer):
    """Serializer for Employee Skills"""
    class Meta:
        model = EmployeeSkill
        fields = [
            'id', 'skill_name', 'proficiency', 'years_of_experience',
            'certification_name', 'certification_authority', 'certification_date',
            'certification_expiry_date', 'certification_id', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class EmployeeListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for employee lists"""
    department_name = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Employee
        fields = [
            'id', 'employee_code', 'full_name', 'first_name', 'last_name',
            'designation', 'department', 'department_name', 'employee_status',
            'employment_type', 'mobile_number', 'personal_email', 'is_active'
        ]
    
    def get_full_name(self, obj):
        try:
            return obj.get_full_name()
        except AttributeError:
            return f"{obj.first_name} {obj.last_name}"
    
    def get_department_name(self, obj):
        try:
            return obj.department.name if obj.department else None
        except Exception:
            return None


import secrets
import string

class EmployeeDetailSerializer(serializers.ModelSerializer):
    """Comprehensive serializer for employee details"""
    department_name = serializers.CharField(source='department.name', read_only=True)
    reporting_manager_name = serializers.SerializerMethodField()
    documents = EmployeeDocumentSerializer(many=True, read_only=True)
    skills = EmployeeSkillSerializer(many=True, read_only=True)
    full_name = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()
    
    class Meta:
        model = Employee
        fields = [
            # Core
            'id', 'tenant', 'user', 'employee_code', 'full_name',
            
            # Personal Details
            'first_name', 'middle_name', 'last_name', 'date_of_birth',
            'gender', 'marital_status', 'blood_group',
            
            # Contact
            'personal_email', 'mobile_number',
            'emergency_contact_name', 'emergency_contact_number', 'emergency_contact_relation',
            
            # Address
            'current_address', 'permanent_address', 'city', 'state', 'pincode', 'country',
            
            # Employment
            'department', 'department_name', 'designation',
            'reporting_manager', 'reporting_manager_name',
            'date_of_joining', 'confirmation_date',
            'employment_type', 'employee_status',
            
            # Bank & Statutory
            'bank_name', 'account_number', 'ifsc_code',
            'pan_number', 'aadhaar_number', 'uan_number',
            
            # Salary
            'joining_date', 'salary', 'current_ctc',
            
            # Metadata
            'is_active', 'created_at', 'updated_at', 'user_role',
            
            # Security (Temp)
            'temp_password',
            
            # Nested
            'documents', 'skills'
        ]
        read_only_fields = ['id', 'tenant', 'created_at', 'updated_at']
    
    def get_reporting_manager_name(self, obj):
        if obj.reporting_manager:
            return obj.reporting_manager.get_full_name()
        return None
    
    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_user_role(self, obj):
        if obj.user:
            assignment = obj.user.role_assignments.first()
            return assignment.role.id if assignment else None
        return None


from hrms.models import Role, UserRoleAssignment

class EmployeeEducationSerializer(serializers.ModelSerializer):
    document_details = EmployeeDocumentSerializer(source='document', read_only=True)
    
    class Meta:
        model = EmployeeEducation
        fields = '__all__'
        read_only_fields = ['employee', 'created_at', 'document_details']

class EmployeeExperienceSerializer(serializers.ModelSerializer):
    document_details = EmployeeDocumentSerializer(source='document', read_only=True)

    class Meta:
        model = EmployeeExperience
        fields = '__all__'
        read_only_fields = ['employee', 'created_at', 'document_details']

class EmployeeBGVSerializer(serializers.ModelSerializer):
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True)
    class Meta:
        model = EmployeeBGV
        fields = '__all__'
        read_only_fields = ['employee', 'verified_by', 'created_at', 'updated_at']

class EmployeeCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating employees"""
    user_role = serializers.IntegerField(required=False, write_only=True)
    education = EmployeeEducationSerializer(many=True, required=False)
    experience = EmployeeExperienceSerializer(many=True, required=False)
    bgv_checks = EmployeeBGVSerializer(many=True, required=False)
    
    class Meta:
        model = Employee
        fields = [
            'employee_code', 'first_name', 'middle_name', 'last_name',
            'date_of_birth', 'gender', 'marital_status', 'blood_group',
            'personal_email', 'mobile_number',
            'emergency_contact_name', 'emergency_contact_number', 'emergency_contact_relation',
            'current_address', 'permanent_address', 'city', 'state', 'pincode', 'country',
            'department', 'designation', 'reporting_manager',
            'date_of_joining', 'confirmation_date',
            'employment_type', 'employee_status',
            'bank_name', 'account_number', 'ifsc_code',
            'pan_number', 'aadhaar_number', 'uan_number',
            'joining_date', 'salary', 'current_ctc',
            'is_active', 'user_role',
            'education', 'experience', 'bgv_checks'
        ]
    
    def create(self, validated_data):
        # Auto-assign tenant from request
        request = self.context.get('request')
        validated_data['tenant'] = request.user.tenant
        role_id = validated_data.pop('user_role', None)
        education_data = validated_data.pop('education', [])
        experience_data = validated_data.pop('experience', [])
        bgv_data = validated_data.pop('bgv_checks', [])
        
        # Create associated user if not provided
        if 'user' not in validated_data:
            # Generate random password
            alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
            password = "".join(secrets.choice(alphabet) for i in range(12))
            
            # Save it to temp_password field
            validated_data['temp_password'] = password
            
            user = User.objects.create_user(
                username=validated_data.get('employee_code'),
                email=validated_data.get('personal_email'),
                tenant=request.user.tenant,
                password=password
            )
            validated_data['user'] = user
        
        employee = super().create(validated_data)
        
        # Assign Role if provided
        if role_id:
            try:
                role = Role.objects.get(id=role_id, tenant=request.user.tenant)
                UserRoleAssignment.objects.get_or_create(
                    user=employee.user, 
                    role=role, 
                    defaults={'assigned_by': request.user}
                )
            except Role.DoesNotExist:
                pass
        
        # Create nested objects
        for edu in education_data:
            EmployeeEducation.objects.create(employee=employee, **edu)
            
        for exp in experience_data:
            EmployeeExperience.objects.create(employee=employee, **exp)
            
        for bgv in bgv_data:
            EmployeeBGV.objects.create(employee=employee, **bgv)
            
        return employee

    def update(self, instance, validated_data):
        role_id = validated_data.pop('user_role', None)
        education_data = validated_data.pop('education', [])
        experience_data = validated_data.pop('experience', [])
        bgv_data = validated_data.pop('bgv_checks', [])
        
        # Standard update
        instance = super().update(instance, validated_data)
        
        # Handle role update
        if role_id:
            request = self.context.get('request')
            try:
                role = Role.objects.get(id=role_id, tenant=request.user.tenant)
                # For this implementation, we assume a single primary system role
                # Clear existing roles to avoid conflicts and set the new one
                UserRoleAssignment.objects.filter(user=instance.user).delete()
                UserRoleAssignment.objects.create(
                    user=instance.user,
                    role=role,
                    assigned_by=request.user
                )
            except Role.DoesNotExist:
                pass

        # Nested writes
        for edu in education_data:
            EmployeeEducation.objects.create(employee=instance, **edu)
            
        for exp in experience_data:
            EmployeeExperience.objects.create(employee=instance, **exp)
            
        for bgv in bgv_data:
            EmployeeBGV.objects.create(employee=instance, **bgv)
            
        return instance


class DepartmentSerializer(serializers.ModelSerializer):
    """Serializer for Department"""
    employee_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Department
        fields = ['id', 'name', 'description', 'employee_count', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_employee_count(self, obj):
        return obj.employees.filter(is_active=True).count()
