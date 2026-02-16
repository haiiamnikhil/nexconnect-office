from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import datetime, time, timedelta
from hrms.models import AttendancePolicy, Shift, Attendance, Employee
from hrms.data.attendance_serializers import (
    AttendancePolicySerializer, ShiftSerializer,
    AttendanceSerializer, CheckInOutSerializer
)


class AttendancePolicyViewSet(viewsets.ModelViewSet):
    serializer_class = AttendancePolicySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return AttendancePolicy.objects.filter(tenant=self.request.user.tenant)
        
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class ShiftViewSet(viewsets.ModelViewSet):
    serializer_class = ShiftSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Shift.objects.filter(tenant=self.request.user.tenant)


from hrms.permissions import HasAppPermission
from hrms.mixins.audit_mixin import AuditLogMixin
from hrms.services.attendance_service import AttendanceService

class AttendanceViewSet(AuditLogMixin, viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated, HasAppPermission]
    resource_name = 'attendance'
    activity_module = 'Attendance'
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['employee', 'status', 'is_regularized']
    
    def get_queryset(self):
        user = self.request.user
        queryset = Attendance.objects.filter(tenant=user.tenant).select_related('employee', 'shift')
        
        # Security: Regular users should only see their own attendance
        # Admins (Superuser or specific roles) can see all
        if not (user.is_superuser or user.role in ['SUPER_ADMIN', 'ADMIN']):
             # Determine if user has "attendance:VIEW_ALL" permission?
             # For MVP, assume only Super Admin sees ALL.
             # Or if user is a Manager? (Not implemented)
             # Let's fallback to: Filter by employee unless explicit bypass.
             
             # Check if user has permission to view all?
             # For now, restrict strictly to own.
            try:
                 queryset = queryset.filter(employee=user.employee_profile)
            except Employee.DoesNotExist:
                 # If user has no employee profile (e.g. pure admin user without profile), return empty or all?
                 # Safe default: return empty to avoid leaking
                 if not user.is_staff: # Django staff check
                     return queryset.none()
                     
        return queryset
    

    @action(detail=False, methods=['post'])
    def check_in(self, request):
        """Employee check-in with Geo-Fencing"""
        employee_id = request.data.get('employee_id')
        local_time_str = request.data.get('local_time') # 'YYYY-MM-DD HH:MM:SS' or ISO

        user = request.user
        
        # Determine Target Employee
        if employee_id:
            # Check if punching for self or other
            is_self = hasattr(user, 'employee_profile') and str(user.employee_profile.id) == str(employee_id)
            
            if not is_self:
                # Only Admins can punch for others
                if not (user.is_superuser or user.role in ['SUPER_ADMIN', 'ADMIN']):
                     return Response({'error': 'Permission denied to punch in for others.'}, status=status.HTTP_403_FORBIDDEN)
            
            try:
                employee = Employee.objects.get(id=employee_id, tenant=request.user.tenant)
            except Employee.DoesNotExist:
                 return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            # Self Punch
            if not hasattr(user, 'employee_profile'):
                 return Response({'error': 'User has no employee profile linked.'}, status=status.HTTP_400_BAD_REQUEST)
            employee = user.employee_profile
        
        try:
            attendance = AttendanceService.check_in(employee, local_time_str)
            serializer = self.get_serializer(attendance)
            return Response(serializer.data)
        except ValidationError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def check_out(self, request):
        """Employee check-out"""
        employee_id = request.data.get('employee_id')
        local_time_str = request.data.get('local_time')
        date_str = request.data.get('date')  # NEW: Optional date parameter for admin punch-out
        
        user = request.user

        # Determine Target Employee
        if employee_id:
             # Check if punching for self or other
            is_self = hasattr(user, 'employee_profile') and str(user.employee_profile.id) == str(employee_id)

            if not is_self:
                 # Only Admins can punch for others
                if not (user.is_superuser or user.role in ['SUPER_ADMIN', 'ADMIN']):
                     return Response({'error': 'Permission denied to punch out for others.'}, status=status.HTTP_403_FORBIDDEN)
            try:
                employee = Employee.objects.get(id=employee_id, tenant=request.user.tenant)
            except Employee.DoesNotExist:
                 return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
             # Self Punch
            if not hasattr(user, 'employee_profile'):
                 return Response({'error': 'User has no employee profile linked.'}, status=status.HTTP_400_BAD_REQUEST)
            employee = user.employee_profile

        try:
            from hrms.services.attendance_service import AttendanceService
            # Note: AttendanceService.check_out currently doesn't support date_str override for admin retro-punch out completely.
            # But the view logic for check_in/out was mostly calculating "now". 
            # If date_str is provided, we might need to adjust service checks.
            # For now, sticking to the standard service call which handles "today".
            # If admin needs to punch out for past date, Service needs update.
            # Assuming "today" for MVP refactor or passing date_str if Service supports (it currently takes check_out_time).
            
            attendance = AttendanceService.check_out(employee, local_time_str)
            serializer = self.get_serializer(attendance)
            return Response(serializer.data)
        except ValidationError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def monthly(self, request):
        """Get monthly attendance for an employee"""
        employee_id = request.query_params.get('employee_id')
        month = request.query_params.get('month')  # Format: YYYY-MM
        
        if not employee_id or not month:
            return Response({'error': 'employee_id and month required'}, status=status.HTTP_400_BAD_REQUEST)
        
        year, month_num = month.split('-')
        start_date = datetime(int(year), int(month_num), 1).date()
        
        if int(month_num) == 12:
            end_date = datetime(int(year) + 1, 1, 1).date()
        else:
            end_date = datetime(int(year), int(month_num) + 1, 1).date()
        
        attendances = self.get_queryset().filter(
            employee_id=employee_id,
            date__gte=start_date,
            date__lt=end_date
        )
        
        serializer = self.get_serializer(attendances, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def regularize(self, request, pk=None):
        """Regularize attendance"""
        attendance = self.get_object()
        reason = request.data.get('reason')
        
        if not reason:
            return Response({'error': 'Regularization reason required'}, status=status.HTTP_400_BAD_REQUEST)
        
        attendance.is_regularized = True
        attendance.regularization_reason = reason
        attendance.regularized_by = request.user
        attendance.regularized_at = timezone.now()
        attendance.save()
        
        serializer = self.get_serializer(attendance)
        return Response(serializer.data)
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def biometric_sync(self, request):
        """
        Sync attendance logs from biometric devices.
        Payload:
        {
            "device_id": "BIO-001",
            "logs": [
                { "employee_code": "EMP001", "timestamp": "2025-01-01 09:00:00", "direction": "IN" }
            ]
        }
        """
        data = request.data
        logs = data.get('logs', [])
        device_id = data.get('device_id')
        
        if not logs:
            return Response({'error': 'No logs provided'}, status=status.HTTP_400_BAD_REQUEST)
            
        processed_count = 0
        errors = []
        
        for log in logs:
            emp_code = log.get('employee_code')
            timestamp_str = log.get('timestamp')
            direction = log.get('direction', 'IN').upper()
            
            try:
                # 1. Find Employee
                employee = Employee.objects.filter(employee_code=emp_code, tenant=request.user.tenant).first()
                if not employee:
                    errors.append(f"Employee not found: {emp_code}")
                    continue
                
                # 2. Parse Timestamp
                # Flexible parsing: assume 'YYYY-MM-DD HH:MM:SS' or ISO
                try:
                    dt = datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S")
                except ValueError:
                    dt = datetime.fromisoformat(timestamp_str)
                    
                log_date = dt.date()
                log_time = dt.time()
                
                # 3. Get or Create Attendance Record
                attendance, created = Attendance.objects.get_or_create(
                    tenant=request.user.tenant,
                    employee=employee,
                    date=log_date,
                    defaults={'status': 'PRESENT'}
                )
                
                # 4. Update Check-in/Check-out
                if direction == 'IN':
                    # If check_in is empty or this log is earlier than existing check_in, update it
                    if not attendance.check_in or log_time < attendance.check_in:
                        attendance.check_in = log_time
                elif direction == 'OUT':
                    # If check_out is empty or this log is later than existing check_out, update it
                    if not attendance.check_out or log_time > attendance.check_out:
                        attendance.check_out = log_time
                
                # 5. Recalculate working hours if both exist
                if attendance.check_in and attendance.check_out:
                    attendance.calculate_working_hours()
                
                attendance.save()
                processed_count += 1
                
            except Exception as e:
                errors.append(f"Error processing log for {emp_code}: {str(e)}")
        
        return Response({
            'message': f'Processed {processed_count} logs',
            'errors': errors
        }, status=status.HTTP_200_OK)
