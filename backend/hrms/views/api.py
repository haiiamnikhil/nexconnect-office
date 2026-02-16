from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from hrms.models import Employee, Department, Leave, Attendance
from hrms.data.serializers import EmployeeSerializer, DepartmentSerializer, LeaveSerializer, AttendanceSerializer

class BaseTenantViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filter queryset by the logged-in user's tenant
        if not self.request.user.tenant:
            return self.queryset.none()
        return self.queryset.filter(tenant=self.request.user.tenant)

    def perform_create(self, serializer):
        # Automatically assign tenant on create
        serializer.save(tenant=self.request.user.tenant)

class DepartmentViewSet(BaseTenantViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

class EmployeeViewSet(BaseTenantViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer

    @action(detail=False, methods=['get'], url_path='me')
    def get_current_employee(self, request):
        """Get the employee profile for the currently logged-in user"""
        try:
            # Try to get employee linked to this user
            employee = Employee.objects.get(
                user=request.user,
                tenant=request.user.tenant
            )
            return Response(EmployeeSerializer(employee).data)
        except Employee.DoesNotExist:
            return Response(
                {'error': 'No employee profile found for current user'},
                status=status.HTTP_404_NOT_FOUND
            )

class LeaveViewSet(BaseTenantViewSet):
    queryset = Leave.objects.all()
    serializer_class = LeaveSerializer

    def perform_create(self, serializer):
        # Assign current employee logic (assuming user is employee)
        if hasattr(self.request.user, 'employee_profile'):
            serializer.save(tenant=self.request.user.tenant, employee=self.request.user.employee_profile)
        else:
            # Fallback if manual assignment needed
            serializer.save(tenant=self.request.user.tenant)

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        leave = self.get_object()
        leave.status = 'APPROVED'
        if hasattr(request.user, 'employee_profile'):
            leave.approved_by = request.user.employee_profile
        leave.save()
        return Response({'status': 'approved'})

class AttendanceViewSet(BaseTenantViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer

    @action(detail=False, methods=['post'], url_path='mark-in')
    def mark_in(self, request):
        if not hasattr(request.user, 'employee_profile'):
             return Response({'error': 'User is not an employee'}, status=status.HTTP_400_BAD_REQUEST)
        
        today = timezone.now().date()
        attendance, created = Attendance.objects.get_or_create(
            tenant=request.user.tenant,
            employee=request.user.employee_profile,
            date=today,
            defaults={'check_in': timezone.now().time()}
        )
        return Response(AttendanceSerializer(attendance).data)
