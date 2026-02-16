from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from decimal import Decimal
from hrms.models import LeaveType, LeaveBalance, Leave, Employee
from hrms.data.leave_serializers import LeaveTypeSerializer, LeaveBalanceSerializer, LeaveSerializer
from hrms.mixins.audit_mixin import AuditLogMixin
from hrms.services.leave_service import LeaveService
from hrms.actions.notification_utils import notify_leave_created, notify_leave_decision


class LeaveTypeViewSet(AuditLogMixin, viewsets.ModelViewSet):
    serializer_class = LeaveTypeSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None
    
    def get_queryset(self):
        return LeaveType.objects.filter(tenant=self.request.user.tenant)
    activity_module = 'Leave Type'


class LeaveBalanceViewSet(AuditLogMixin, viewsets.ModelViewSet):
    serializer_class = LeaveBalanceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['employee', 'leave_type', 'year']
    activity_module = 'Leave Balance'
    
    def get_queryset(self):
        return LeaveBalance.objects.filter(
            employee__tenant=self.request.user.tenant
        ).select_related('employee', 'leave_type')
    
    @action(detail=False, methods=['get'])
    def by_employee(self, request):
        """Get leave balances for a specific employee"""
        employee_id = request.query_params.get('employee_id')
        year = request.query_params.get('year', timezone.now().year)
        
        if not employee_id:
            return Response({'error': 'employee_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        balances = self.get_queryset().filter(employee_id=employee_id, year=year)
        serializer = self.get_serializer(balances, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def allocate(self, request):
        """
        Batch allocate leave balances by Employment Type
        Params:
        - year: int
        - leave_type_id: int
        - employment_type: str (PERMANENT, INTERN, CONTRACT, etc.)
        - days: float
        """
        year = request.data.get('year')
        leave_type_id = request.data.get('leave_type_id')
        employment_type = request.data.get('employment_type')
        designation = request.data.get('designation') # Optional
        days = request.data.get('days')

        if not all([year, leave_type_id, employment_type, days]):
            return Response({'error': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Get Target Employees
        filters = {
            'tenant': request.user.tenant,
            'employment_type': employment_type,
            'is_active': True
        }
        
        if designation:
            filters['designation__iexact'] = designation
            
        employees = Employee.objects.filter(**filters)
        
        if not employees.exists():
            return Response({'message': 'No employees found for this type'}, status=status.HTTP_404_NOT_FOUND)

        # 2. Get Leave Type
        try:
            leave_type = LeaveType.objects.get(id=leave_type_id, tenant=request.user.tenant)
        except LeaveType.DoesNotExist:
             return Response({'error': 'Leave Type not found'}, status=status.HTTP_404_NOT_FOUND)

        count = 0
        for emp in employees:
            balance, created = LeaveBalance.objects.get_or_create(
                employee=emp,
                leave_type=leave_type,
                year=year,
                defaults={
                    'total_allocated': days,
                    'available': days # Initial available = allocated
                }
            )
            
            if not created:
                # If exists, Update allocation? 
                # Policy: If we update allocation, we recalculate available.
                # available = new_allocated + carried - used - pending
                balance.total_allocated = Decimal(str(days))
                balance.save() # save() method in model handles recalculation
            
            count += 1
            
        self._log_activity('ALLOCATE', f"Allocated {days} days of {leave_type.name} to {count} employees ({employment_type})")
        return Response({'message': f'Allocated {days} days of {leave_type.name} to {count} employees ({employment_type}).'})


class LeaveViewSet(AuditLogMixin, viewsets.ModelViewSet):
    serializer_class = LeaveSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['employee', 'status', 'leave_type']
    activity_module = 'Leave Request'
    

    def get_queryset(self):
        return Leave.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('employee', 'approved_by')

    def create(self, request, *args, **kwargs):
        """
        Create leave request with validation
        """
        data = request.data.copy()
        
        try:
            leave = LeaveService.create_leave_request(data, request.user)
            
            # Notify Manager/Admin
            notify_leave_created(leave)

            self._log_activity('CREATE', f"Created Leave Request for {leave.employee} ({leave.leave_type}): {leave.start_date} to {leave.end_date}")

            serializer = self.get_serializer(leave)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a leave request"""
        try:
            leave = LeaveService.approve_leave(pk, request.user)
            
            # Notify Employee
            notify_leave_decision(leave, 'APPROVED')
            
            self._log_activity('APPROVE', f"Approved Leave Request for {leave.employee}")

            serializer = self.get_serializer(leave)
            return Response(serializer.data)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a leave request"""
        reason = request.data.get('reason', '')
        
        try:
            leave = LeaveService.reject_leave(pk, request.user, reason)
            
            # Notify Employee
            notify_leave_decision(leave, 'REJECTED')
            
            self._log_activity('REJECT', f"Rejected Leave Request for {leave.employee}. Reason: {reason}")
            
            serializer = self.get_serializer(leave)
            return Response(serializer.data)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
             return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def pending_approvals(self, request):
        """Get pending leave approvals for the current user's reportees"""
        try:
            # Check if SuperAdmin or Admin
            if request.user.is_superuser or request.user.role in ['SUPER_ADMIN', 'ADMIN']:
                pending_leaves = self.get_queryset().filter(status='PENDING')
                serializer = self.get_serializer(pending_leaves, many=True)
                return Response(serializer.data)

            manager = Employee.objects.get(user=request.user, tenant=request.user.tenant)
            # Get all reportees
            reportee_ids = Employee.objects.filter(reporting_manager=manager).values_list('id', flat=True)
            
            pending_leaves = self.get_queryset().filter(
                employee_id__in=reportee_ids,
                status='PENDING'
            )
            
            serializer = self.get_serializer(pending_leaves, many=True)
            return Response(serializer.data)
        except Employee.DoesNotExist:
            return Response([])
