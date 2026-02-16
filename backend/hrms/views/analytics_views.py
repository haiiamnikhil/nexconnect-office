from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum, Avg, F, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from django.http import HttpResponse
from datetime import timedelta, datetime
import csv
from hrms.models import Employee, Attendance, Department, PayrollRun, Payslip, OffboardingRequest

class AnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    # ... (other methods headcount, attrition, attendance remain same) ...

    @action(detail=False, methods=['get'])
    def headcount(self, request):
        """Headcount growth over last 12 months"""
        tenant = request.user.tenant
        today = timezone.now().date()
        date_12_months_ago = today - timedelta(days=365)
        
        joining_trends = Employee.objects.filter(
            tenant=tenant, 
            joining_date__gte=date_12_months_ago
        ).annotate(
            month=TruncMonth('joining_date')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')
        
        data = {
            "total_active": Employee.objects.filter(tenant=tenant, is_active=True).count(),
            "trends": [
                {"month": item['month'].strftime('%Y-%m'), "joined": item['count']}
                for item in joining_trends
            ]
        }
        return Response(data)

    @action(detail=False, methods=['get'])
    def attrition(self, request):
        """Attrition rate (Employees leaving)"""
        tenant = request.user.tenant
        
        exits = OffboardingRequest.objects.filter(
            tenant=tenant, 
            status='COMPLETED'
        ).count()
        
        active_count = Employee.objects.filter(tenant=tenant, is_active=True).count()
        total_employees = active_count + exits
        
        attrition_rate = (exits / total_employees * 100) if total_employees > 0 else 0
        
        return Response({
            "total_exits_ytd": exits,
            "attrition_rate": round(attrition_rate, 2)
        })

    @action(detail=False, methods=['get'])
    def attendance(self, request):
        """Average working hours and absenteeism"""
        tenant = request.user.tenant
        today = timezone.now().date()
        start_month = today.replace(day=1)
        
        avg_hours = Attendance.objects.filter(
            tenant=tenant,
            date__gte=start_month,
            check_out__isnull=False
        ).aggregate(
            avg_duration=Avg(F('check_out') - F('check_in'))
        )
        
        avg_hours_val = 0
        if avg_hours['avg_duration']:
            avg_hours_val = avg_hours['avg_duration'].total_seconds() / 3600

        return Response({
            "avg_daily_hours": round(avg_hours_val, 2),
            "present_today": Attendance.objects.filter(tenant=tenant, date=today).count()
        })

    @action(detail=False, methods=['get'])
    def payroll(self, request):
        """Payroll cost trends"""
        tenant = request.user.tenant
        
        # Using PayrollRun which stores total_net_pay per month per batch
        cost_trends = PayrollRun.objects.filter(
            tenant=tenant,
            status__in=['COMPLETED', 'LOCKED']
        ).values('month').annotate(
            total_cost=Sum('total_net_pay')
        ).order_by('month')
        
        return Response({
            "trends": [
                {"month": item['month'].strftime('%Y-%m') if item['month'] else 'Unknown', "cost": item['total_cost']}
                for item in cost_trends
            ]
        })
    
    @action(detail=False, methods=['post'])
    def custom_report(self, request):
        """
        Generate custom report based on filters
        Query params:
        - metric: headcount, payroll, attendance, leaves, attrition
        - start_date: YYYY-MM-DD
        - end_date: YYYY-MM-DD
        - department: department ID
        - export: csv (optional, for CSV export)
        """
        tenant = request.user.tenant
        metric = request.data.get('metric', 'headcount')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        department_id = request.data.get('department')
        export_format = request.data.get('export')
        
        # Parse dates
        try:
            start = datetime.strptime(start_date, '%Y-%m-%d').date() if start_date else timezone.now().date() - timedelta(days=30)
            end = datetime.strptime(end_date, '%Y-%m-%d').date() if end_date else timezone.now().date()
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Base queryset filter
        base_filter = Q(tenant=tenant)
        if department_id:
            base_filter &= Q(department_id=department_id)
        
        # Generate report based on metric
        if metric == 'headcount':
            data = Employee.objects.filter(base_filter, joining_date__range=[start, end])
            result = {
                'metric': 'Headcount',
                'total': data.count(),
                'by_department': list(data.values('department__name').annotate(count=Count('id'))),
                'date_range': f"{start} to {end}"
            }
        
        elif metric == 'payroll':
            payslips = Payslip.objects.filter(tenant=tenant, payroll_run__month__range=[start, end])
            if department_id:
                payslips = payslips.filter(employee__department_id=department_id)
            result = {
                'metric': 'Payroll Cost',
                'total_cost': payslips.aggregate(total=Sum('net_pay'))['total'] or 0,
                'by_department': list(payslips.values('employee__department__name').annotate(total=Sum('net_pay'))),
                'date_range': f"{start} to {end}"
            }
        
        elif metric == 'attendance':
            attendance = Attendance.objects.filter(tenant=tenant, date__range=[start, end])
            if department_id:
                attendance = attendance.filter(employee__department_id=department_id)
            result = {
                'metric': 'Attendance',
                'total_days': attendance.count(),
                'avg_hours': attendance.aggregate(avg=Avg(F('check_out') - F('check_in')))['avg'],
                'date_range': f"{start} to {end}"
            }
        
        elif metric == 'leaves':
            from hrms.models import LeaveRequest
            leaves = LeaveRequest.objects.filter(tenant=tenant, start_date__range=[start, end])
            if department_id:
                leaves = leaves.filter(employee__department_id=department_id)
            result = {
                'metric': 'Leave Requests',
                'total': leaves.count(),
                'approved': leaves.filter(status='APPROVED').count(),
                'pending': leaves.filter(status='PENDING').count(),
                'by_type': list(leaves.values('leave_type').annotate(count=Count('id'))),
                'date_range': f"{start} to {end}"
            }
        
        else:
            return Response({'error': 'Invalid metric. Choose: headcount, payroll, attendance, leaves'}, status=status.HTTP_400_BAD_REQUEST)
        
        # CSV Export
        if export_format == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="report_{metric}_{start}_{end}.csv"'
            
            writer = csv.writer(response)
            writer.writerow(['Metric', metric])
            writer.writerow(['Date Range', f"{start} to {end}"])
            writer.writerow([])
            
            # Write data based on metric
            for key, value in result.items():
                if key not in ['metric', 'date_range']:
                    writer.writerow([key, value])
            
            return response
        
        return Response(result)

