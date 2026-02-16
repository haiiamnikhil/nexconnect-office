from rest_framework import serializers
from hrms.models import LeaveType, LeaveBalance, Leave, Employee, Holiday

class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'tenant']
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['tenant'] = request.user.tenant
        return super().create(validated_data)


class LeaveBalanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    
    class Meta:
        model = LeaveBalance
        fields = '__all__'
        read_only_fields = ['id', 'available', 'created_at', 'updated_at', 'tenant']


class LeaveSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    approved_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Leave
        fields = '__all__'
        read_only_fields = ['id', 'number_of_days', 'approved_at', 'created_at', 'updated_at', 'tenant']
    
    def get_approved_by_name(self, obj):
        return obj.approved_by.get_full_name() if obj.approved_by else None
    
    def validate(self, attrs):
        request = self.context.get('request')
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')
        leave_type = attrs.get('leave_type')
        employee = attrs.get('employee')
        
        if end_date < start_date:
             raise serializers.ValidationError("End date must be after start date")

        # Calculate logical days
        delta = end_date - start_date
        total_days = delta.days + 1
        
        # Deduct Holidays
        tenant = request.user.tenant if request else employee.tenant
        holidays_count = Holiday.objects.filter(
            tenant=tenant,
            date__range=[start_date, end_date]
        ).count()
        
        actual_days = total_days - holidays_count
        
        if actual_days <= 0:
             raise serializers.ValidationError("Selected range only contains holidays.")
             
        # Store calculated days in context or update attrs if possible, 
        # but for now we validate against actual_days
        
        # Check Balance
        year = start_date.year
        try:
            balance = LeaveBalance.objects.get(
                employee=employee,
                leave_type=leave_type,
                year=year
            )
            if balance.available < actual_days:
                raise serializers.ValidationError(
                    f"Insufficient leave balance. Available: {balance.available}, Requested: {actual_days} (Excluding {holidays_count} holidays)"
                )
        except LeaveBalance.DoesNotExist:
            raise serializers.ValidationError(f"No leave balance found for this leave type in {year}")
            
        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['tenant'] = request.user.tenant
        
        # Calculate days with holidays deduction
        start_date = validated_data['start_date']
        end_date = validated_data['end_date']
        
        delta = end_date - start_date
        total_days = delta.days + 1
        
        holidays_count = Holiday.objects.filter(
            tenant=validated_data['tenant'],
            date__range=[start_date, end_date]
        ).count()
        
        actual_days = max(total_days - holidays_count, 0)
        
        instance = Leave.objects.create(**validated_data, number_of_days=actual_days)
        
        # Update Balance (Pending)
        year = instance.start_date.year
        try:
            balance = LeaveBalance.objects.get(
                employee=instance.employee,
                leave_type=instance.leave_type,
                year=year
            )
            balance.pending += instance.number_of_days
            balance.save()
        except LeaveBalance.DoesNotExist:
            pass 
            
        return instance
