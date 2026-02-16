from django.utils import timezone
from django.db.models import Sum, Avg
from rest_framework.exceptions import ValidationError, PermissionDenied
from hrms.models import Employee, EmployeeDocument, LeaveBalance, Attendance, AssetAllocation

class EmployeeService:
    @staticmethod
    def get_employee_stats(employee: Employee):
        """
        Get comprehensive stats for an employee.
        """
        today = timezone.now().date()
        

        
        total_leave_balance = LeaveBalance.objects.filter(employee=employee).aggregate(
            total=Sum('available')
        )['total'] or 0

        # Attendance this month
        month_start = today.replace(day=1)
        attendance_count = Attendance.objects.filter(
            employee=employee,
            date__gte=month_start,
            date__lte=today,
            status='PRESENT' # Should we count PRESENT + HALF_DAY? View just counted all records?
        ).count()
        
        # Assets
        asset_count = AssetAllocation.objects.filter(
            employee=employee, 
            is_active=True
        ).count()
        
        return {
            'leave_balance': float(total_leave_balance),
            'attendance_this_month': attendance_count,
            'assets_assigned': asset_count,
            'working_days_this_month': (today - month_start).days + 1
        }

    @staticmethod
    def upload_avatar(employee: Employee, file, uploaded_by_user):
        """
        Upload and replace employee avatar.
        """
        # Validate file size (max 5MB)
        if file.size > 5 * 1024 * 1024:
            raise ValidationError('File size must be less than 5MB')
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        # Django's UploadedFile doesn't always have content_type perfect, but reliable enough
        if file.content_type not in allowed_types:
             raise ValidationError('Only JPEG, PNG, and WebP images are allowed')

        # Delete old avatar
        EmployeeDocument.objects.filter(employee=employee, document_type='PHOTO').delete()
        
        # Create new
        doc = EmployeeDocument.objects.create(
            employee=employee,
            document_type='PHOTO',
            document_name='Profile Picture',
            file=file,
            file_size=file.size,
            uploaded_by=uploaded_by_user
        )
        return doc
