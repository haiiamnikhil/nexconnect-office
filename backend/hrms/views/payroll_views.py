from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import datetime
from hrms.models import PayrollRun, Payslip, SalaryStructure, Employee, SalaryComponent, EmployeeSalary, TaxDeclaration
from hrms.data.payroll_serializers import (
    SalaryComponentSerializer, SalaryStructureSerializer, 
    EmployeeSalarySerializer, PayrollRunSerializer, 
    PayslipSerializer, TaxDeclarationSerializer
)

from hrms.permissions import HasAppPermission

class SalaryComponentViewSet(viewsets.ModelViewSet):
    serializer_class = SalaryComponentSerializer
    permission_classes = [IsAuthenticated, HasAppPermission]
    resource_name = 'payroll'
    
    def get_queryset(self):
        return SalaryComponent.objects.filter(tenant=self.request.user.tenant)

class SalaryStructureViewSet(viewsets.ModelViewSet):
    serializer_class = SalaryStructureSerializer
    permission_classes = [IsAuthenticated, HasAppPermission]
    resource_name = 'payroll'
    
    def get_queryset(self):
        return SalaryStructure.objects.filter(tenant=self.request.user.tenant)

class EmployeeSalaryViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeSalarySerializer
    permission_classes = [IsAuthenticated, HasAppPermission]
    resource_name = 'payroll'
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['structure']
    
    def get_queryset(self):
        return EmployeeSalary.objects.filter(tenant=self.request.user.tenant)

class PayrollRunViewSet(viewsets.ModelViewSet):
    serializer_class = PayrollRunSerializer
    permission_classes = [IsAuthenticated, HasAppPermission]
    resource_name = 'payroll'
    
    def get_queryset(self):
        return PayrollRun.objects.filter(tenant=self.request.user.tenant)
    
    @action(detail=False, methods=['get'])
    def estimate(self, request):
        """
        Get estimated payroll for the current month
        """
        now = timezone.now()
        month = now.date().replace(day=1)
        
        try:
            from hrms.actions.payroll_utils import PayrollService
            service = PayrollService(request.user.tenant)
            data = service.process_payroll(month, request.user, dry_run=True)
            return Response(data)
        except Exception as e:
            return Response({'error': f"Estimation failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def process_batch(self, request):
        """
        Trigger payroll processing for a batch (Month)
        """
        month_str = request.data.get('month') # YYYY-MM-DD
        if not month_str:
            return Response({'error': 'Month required (YYYY-MM-DD)'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            month = datetime.strptime(month_str, '%Y-%m-%d').date().replace(day=1)
        except ValueError:
            return Response({' error': 'Invalid date format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            from hrms.actions.payroll_utils import PayrollService
            service = PayrollService(request.user.tenant)
            run = service.process_payroll(month, request.user)
            return Response(self.get_serializer(run).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f"Processing failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PayslipViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PayslipSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['payroll_run', 'employee', 'payment_status']
    
    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role in ['SUPER_ADMIN', 'ADMIN']:
            return Payslip.objects.filter(tenant=user.tenant)
        # Employees see their own
        try:
            emp = Employee.objects.get(user=user)
            return Payslip.objects.filter(employee=emp)
        except Employee.DoesNotExist:
            return Payslip.objects.none()

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download Payslip as PDF"""
        from hrms.actions.payslip_pdf import generate_payslip_pdf
        from django.http import HttpResponse

        payslip = self.get_object()
        
        try:
            buffer = generate_payslip_pdf(payslip)
            response = HttpResponse(buffer, content_type='application/pdf')
            filename = f"Payslip_{payslip.employee.employee_code}_{payslip.month_year.strftime('%b%Y')}.pdf"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        except Exception as e:
            return Response({'error': f'Failed to generate PDF: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TaxDeclarationViewSet(viewsets.ModelViewSet):
    serializer_class = TaxDeclarationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return TaxDeclaration.objects.filter(tenant=self.request.user.tenant)
    
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        decl = self.get_object()
        amount = request.data.get('verified_amount')
        status_val = request.data.get('status', 'APPROVED')
        
        if amount:
            decl.verified_amount = amount
        decl.status = status_val
        decl.save()
        return Response(self.get_serializer(decl).data)
