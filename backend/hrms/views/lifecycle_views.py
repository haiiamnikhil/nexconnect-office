from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from hrms.models import OnboardingTask, OffboardingRequest, ExitClearance, Employee
from hrms.data.lifecycle_serializers import OnboardingTaskSerializer, OffboardingRequestSerializer, ExitClearanceSerializer

from hrms.permissions import HasAppPermission

class OnboardingTaskViewSet(viewsets.ModelViewSet):
    serializer_class = OnboardingTaskSerializer
    permission_classes = [IsAuthenticated, HasAppPermission]
    resource_name = 'lifecycle'

    def get_queryset(self):
        user = self.request.user
        queryset = OnboardingTask.objects.filter(tenant=user.tenant)
        # Employees see only their tasks
        if hasattr(user, 'employee_profile') and user.employee_profile:
             # Basic check: is the user strictly an employee or also admin/manager?
             # For now, let's assume filtering if not admin, but we don't have strictly defined role checks here yet easily accessible without checking role names.
             # We'll expose all to anyone with permission for simplicity in this phase, or filter by query param 'my_tasks=true'
             if self.request.query_params.get('my_tasks'):
                 queryset = queryset.filter(employee=user.employee_profile)
        return queryset

class OffboardingRequestViewSet(viewsets.ModelViewSet):
    serializer_class = OffboardingRequestSerializer
    permission_classes = [IsAuthenticated, HasAppPermission]
    resource_name = 'lifecycle'

    def get_queryset(self):
        return OffboardingRequest.objects.filter(tenant=self.request.user.tenant)

    def perform_create(self, serializer):
        # When created, also generate standard Exit Clearances
        offboarding = serializer.save()
        departments = ['IT', 'FINANCE', 'ADMIN', 'MANAGER']
        for dept in departments:
            ExitClearance.objects.create(
                offboarding_request=offboarding,
                department=dept,
                tenant=offboarding.tenant
            )

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        req = self.get_object()
        req.status = 'APPROVED'
        req.save()
        return Response({'status': 'Offboarding Request Approved'})

class ExitClearanceViewSet(viewsets.ModelViewSet):
    serializer_class = ExitClearanceSerializer
    permission_classes = [IsAuthenticated, HasAppPermission]
    resource_name = 'lifecycle'

    def get_queryset(self):
        return ExitClearance.objects.filter(tenant=self.request.user.tenant)

    @action(detail=True, methods=['post'])
    def clear(self, request, pk=None):
        clearance = self.get_object()
        clearance.status = 'CLEARED'
        clearance.cleared_by = request.user
        clearance.cleared_at = timezone.now()
        clearance.remarks = request.data.get('remarks', '')
        clearance.save()
        return Response({'status': 'Clearance Updated'})
