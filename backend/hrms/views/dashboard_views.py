from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from hrms.models import Employee, Leave, JobPosting
from django.utils import timezone
from hrms.actions.payroll_utils import PayrollService

class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get compiled stats for the Admin Dashboard
        """
        tenant = request.user.tenant
        today = timezone.now().date()
        
        # 1. Active Employees
        total_employees = Employee.objects.filter(tenant=tenant, is_active=True).count()
        
        # 2. On Leave Today
        # Leave status=APPROVED and start_date <= today <= end_date
        on_leave = Leave.objects.filter(
            tenant=tenant, 
            status='APPROVED',
            start_date__lte=today,
            end_date__gte=today
        ).count()
        
        # 3. Open Positions
        open_jobs = JobPosting.objects.filter(tenant=tenant, status='OPEN').count()
        
        # 4. Pending Tasks
        # Count pending leaves
        pending_leaves = Leave.objects.filter(tenant=tenant, status='PENDING').count()
        # You can add other pending items here (e.g. Expense Claims)
        pending_tasks = pending_leaves 
        
        # 5. Payroll Estimate
        payroll_estimate = 0
        try:
            service = PayrollService(tenant)
            month_start = today.replace(day=1)
            # Use dry_run=True to get estimate
            estimate_data = service.process_payroll(month_start, request.user, dry_run=True)
            payroll_estimate = estimate_data.get('total_payout', 0)
        except Exception as e:
            print(f"Payroll Estimate Failed: {e}")
            payroll_estimate = 0

        data = {
            'total_employees': total_employees,
            'on_leave_today': on_leave,
            'open_positions': open_jobs,
            'pending_tasks': pending_tasks,
            'payroll_estimate': payroll_estimate
        }
        
        return Response(data)
