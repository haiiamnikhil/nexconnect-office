from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from hrms.models import TaxDeclaration
from hrms.data.payroll_serializers import TaxDeclarationSerializer

class TaxDeclarationViewSet(viewsets.ModelViewSet):
    serializer_class = TaxDeclarationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if not hasattr(user, 'tenant'):
            return TaxDeclaration.objects.none()
            
        qs = TaxDeclaration.objects.filter(tenant=user.tenant)
        
        # If not Admin/HR, restricted to own declarations
        # Using simple role check, assuming "Employee" role or non-staff/superuser status
        # Adjust logic based on your specific Role/Permission implementation
        if self.action in ['list', 'retrieve'] and not (user.is_superuser or user.role in ['Admin', 'HR']):
             if hasattr(user, 'employee_profile'):
                 qs = qs.filter(employee=user.employee_profile)
             else:
                 return TaxDeclaration.objects.none()
        
        return qs.order_by('-created_at')

    def perform_create(self, serializer):
        # Auto-assign employee if creating own declaration
        if hasattr(self.request.user, 'employee_profile'):
            serializer.save(
                tenant=self.request.user.tenant,
                employee=self.request.user.employee_profile,
                status='PENDING'
            )
        else:
            # HR creating for someone else? Usually not the flow, but allow if employee is passed
             serializer.save(tenant=self.request.user.tenant)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        declaration = self.get_object()
        if declaration.status != 'PENDING':
             return Response({'error': 'Only pending declarations can be submitted'}, status=status.HTTP_400_BAD_REQUEST)
        
        declaration.status = 'SUBMITTED'
        declaration.save()
        return Response({'status': 'Declaration submitted successfully'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser]) # Restrict to Admin
    def approve(self, request, pk=None):
        declaration = self.get_object()
        # Admin should verify doc and amount
        
        verified_amount = request.data.get('verified_amount')
        if verified_amount is not None:
            declaration.verified_amount = verified_amount
        
        # If no amount passed, assume declared amount is approved? Better to be explicit.
        # For now, require verified_amount or default to declared if confirmed?
        # Let's default to declared if not provided but strictly we should verify.
        if verified_amount is None and declaration.verified_amount == 0:
             declaration.verified_amount = declaration.declared_amount

        declaration.status = 'APPROVED'
        declaration.admin_remarks = request.data.get('remarks', '')
        declaration.save()
        return Response({'status': 'Declaration approved', 'verified_amount': declaration.verified_amount})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def reject(self, request, pk=None):
        declaration = self.get_object()
        declaration.status = 'REJECTED'
        declaration.admin_remarks = request.data.get('remarks', '')
        declaration.save()
        return Response({'status': 'Declaration rejected'})
