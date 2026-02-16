from django.utils import timezone
from datetime import datetime, timedelta
from rest_framework.exceptions import ValidationError, PermissionDenied
from hrms.models import Attendance, Employee, Shift, AttendancePolicy

class AttendanceService:
    @staticmethod
    def check_in(employee: Employee, check_in_time=None, location_data=None):
        """
        Handle employee check-in logic.
        """
        tenant = employee.tenant
        now = timezone.localtime(timezone.now())
        today = now.date()
        current_time = now.time()

        if check_in_time:
             # If explicit time provided (e.g. from device), use it
             # ensure it's converted to time object
             if isinstance(check_in_time, str):
                 try:
                     dt = datetime.fromisoformat(check_in_time.replace('Z', '+00:00'))
                     current_time = timezone.localtime(dt).time()
                 except ValueError:
                     pass # Fallback to now
             else:
                 current_time = check_in_time

        # 1. Get or Create Attendance Record
        attendance, created = Attendance.objects.get_or_create(
            employee=employee,
            date=today,
            defaults={
                'tenant': tenant,
                'status': 'PRESENT',
                'shift': employee.shift or Shift.objects.filter(tenant=tenant, is_default=True).first()
            }
        )
        
        # If explicit time is provided, we might need to adjust the 'date' if it's vastly different? 
        # But for now assuming the punch is relatively close to 'today'.

        if not created and attendance.check_in:
             raise ValidationError("You have already checked in today.")

        # 2. Late Marking Logic
        AttendanceService._apply_late_policy(attendance, current_time, tenant)

        # 3. Save
        attendance.check_in = current_time
        if attendance.status not in ['LATE', 'HALF_DAY', 'ABSENT']:
             attendance.status = 'PRESENT'
        attendance.save()
        return attendance

    @staticmethod
    def check_out(employee: Employee, check_out_time=None):
        """
        Handle employee check-out logic.
        """
        tenant = employee.tenant
        now = timezone.localtime(timezone.now())
        today = now.date()
        current_time = now.time()
        
        if check_out_time:
             if isinstance(check_out_time, str):
                 try:
                     dt = datetime.fromisoformat(check_out_time.replace('Z', '+00:00'))
                     current_time = timezone.localtime(dt).time()
                 except ValueError:
                     pass
             else:
                 current_time = check_out_time

        attendance = Attendance.objects.filter(employee=employee, date=today).first()

        if not attendance or not attendance.check_in:
             raise ValidationError("No check-in found for this date.")
        
        if attendance.check_out:
             # Check Re-entry policy
             policy = AttendancePolicy.objects.filter(tenant=tenant, is_default=True).first()
             if not policy or not policy.allow_reentry:
                 raise ValidationError("You have already checked out. Re-entry is disabled.")
        
        attendance.check_out = current_time
        attendance.calculate_working_hours() # This method on model handles logic too, which is fine for "Rich Model"
        attendance.save()
        return attendance

    @staticmethod
    def _apply_late_policy(attendance, check_in_time, tenant):
        """
        Internal method to check for late arrival.
        """
        policy = AttendancePolicy.objects.filter(tenant=tenant, is_default=True).first()
        shift = attendance.shift

        if policy and shift and shift.start_time:
            # Simple comparison logic from views
            check_in_mins = check_in_time.hour * 60 + check_in_time.minute
            shift_start_mins = shift.start_time.hour * 60 + shift.start_time.minute
            grace_mins = policy.grace_period_minutes

            if check_in_mins > (shift_start_mins + grace_mins):
                attendance.status = 'LATE'
