from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from rest_framework.exceptions import ValidationError, PermissionDenied
from hrms.models import Leave, LeaveBalance, LeaveType, Employee
from django.db import transaction

class LeaveService:
    @staticmethod
    def create_leave_request(data, user):
        """
        Handle leave request creation logic.
        """
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        leave_type_id = data.get('leave_type')
        employee_id = data.get('employee')
        
        # Validation
        if not all([start_date, end_date, leave_type_id, employee_id]):
            raise ValidationError('Missing required fields')
            
        if start_date > end_date:
            raise ValidationError('Start date cannot be after end date')

        # 1. Overlap Check
        overlapping = Leave.objects.filter(
            employee_id=employee_id,
            status__in=['PENDING', 'APPROVED'],
            start_date__lte=end_date,
            end_date__gte=start_date
        ).exists()
        
        if overlapping:
             raise ValidationError('Leave request overlaps with existing leave')

        # 2. Balance Check
        try:
            lt = LeaveType.objects.get(id=leave_type_id)
            
            # Approximate days calculation (ignoring holidays for MVP)
            # Ensure dates are date objects
            if isinstance(start_date, str):
                s = datetime.strptime(start_date, '%Y-%m-%d').date()
            else:
                s = start_date
            
            if isinstance(end_date, str):
                e = datetime.strptime(end_date, '%Y-%m-%d').date()
            else:
                e = end_date
                
            days_requested = (e - s).days + 1
            
            current_year = s.year
            balance = LeaveBalance.objects.filter(
                employee_id=employee_id,
                leave_type=lt,
                year=current_year
            ).first()
            
            if not balance:
                raise ValidationError('No leave balance found for this year')
            
            if balance.available < days_requested:
                raise ValidationError(f"Insufficient balance. Available: {balance.available}, Requested: {days_requested}")
                
        except LeaveType.DoesNotExist:
             raise ValidationError('Invalid Leave Type')

        # 3. Create Leave
        leave = Leave.objects.create(
            tenant=user.tenant,
            employee_id=employee_id,
            leave_type=lt,
            start_date=s,
            end_date=e,
            number_of_days=days_requested,
            reason=data.get('reason', ''),
            status='PENDING'
        )

        # 4. Update Pending Balance
        if balance:
            balance.pending += Decimal(days_requested)
            balance.save()

        return leave

    @staticmethod
    def approve_leave(leave_id, approver_user):
        """
        Approve a leave request.
        """
        with transaction.atomic():
            leave = Leave.objects.select_for_update().get(id=leave_id)
            
            if leave.status != 'PENDING':
                raise ValidationError('Leave request already processed')
            
            leave.status = 'APPROVED'
            leave.approved_at = timezone.now()
            
            try:
                approver = Employee.objects.get(user=approver_user, tenant=approver_user.tenant)
                leave.approved_by = approver
            except Employee.DoesNotExist:
                pass
            
            leave.save()
            
            # Update leave balance
            year = leave.start_date.year
            balance = LeaveBalance.objects.select_for_update().filter(
                employee=leave.employee,
                leave_type=leave.leave_type,
                year=year
            ).first()
            
            if balance:
                balance.used += leave.number_of_days
                balance.pending -= leave.number_of_days
                balance.save()
                
            return leave

    @staticmethod
    def reject_leave(leave_id, approver_user, reason):
        """
        Reject a leave request.
        """
        with transaction.atomic():
            leave = Leave.objects.select_for_update().get(id=leave_id)
            
            if leave.status != 'PENDING':
                raise ValidationError('Leave request already processed')
            
            leave.status = 'REJECTED'
            leave.rejection_reason = reason
            leave.approved_at = timezone.now()
            
            try:
                approver = Employee.objects.get(user=approver_user, tenant=approver_user.tenant)
                leave.approved_by = approver
            except Employee.DoesNotExist:
                pass
            
            leave.save()
            
            # Update leave balance
            year = leave.start_date.year
            balance = LeaveBalance.objects.select_for_update().filter(
                employee=leave.employee,
                leave_type=leave.leave_type,
                year=year
            ).first()
            
            if balance:
                balance.pending -= leave.number_of_days
                balance.save()
                
            return leave
