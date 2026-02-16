from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from users.models.core_models import Tenant
from django.db import transaction

class TenantOnboardingViewSet(viewsets.ViewSet):
    """
    ViewSet to handle tenant onboarding steps.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_tenant(self, request):
        return request.user.tenant

    @action(detail=False, methods=['get'])
    def status(self, request):
        """Get current onboarding status."""
        tenant = self.get_tenant(request)
        if not tenant:
            return Response({"error": "User does not belong to a tenant"}, status=400)
            
        return Response({
            "step": tenant.onboarding_step,
            "is_complete": tenant.is_setup_complete,
            "currency": tenant.currency,
            "status_actions": tenant.status_actions
        })

    @action(detail=False, methods=['post'])
    def update_step(self, request):
        """Update progress for a specific step."""
        tenant = self.get_tenant(request)
        if not tenant:
            return Response({"error": "User does not belong to a tenant"}, status=400)

        step = request.data.get('step')
        data = request.data.get('data', {})

        if not step:
            return Response({"error": "Step is required"}, status=400)

        try:
            with transaction.atomic():
                # Update specific fields based on step
                # Update specific fields based on step
                if step == 1: # Designations
                    from hrms.models.core import Designation
                    desigs = data.get('designations', [])
                    for d in desigs:
                        if d.get('title'):
                            Designation.objects.get_or_create(tenant=tenant, title=d['title'])

                elif step == 2: # Departments
                    from hrms.models.core import Department
                    depts = data.get('departments', [])
                    for d in depts:
                        if d.get('name'):
                            Department.objects.get_or_create(tenant=tenant, name=d['name'])

                elif step == 3: # Employment Types
                    from hrms.models.core import EmploymentType
                    types = data.get('employment_types', [])
                    for t in types:
                        if t.get('name') and t.get('code'):
                            EmploymentType.objects.update_or_create(
                                tenant=tenant, code=t['code'],
                                defaults={'name': t['name']}
                            )

                elif step == 4: # Employee Statuses & Actions
                    from hrms.models.core import EmployeeStatus
                    statuses = data.get('employee_statuses', [])
                    for s in statuses:
                        if s.get('name') and s.get('code'):
                            EmployeeStatus.objects.update_or_create(
                                tenant=tenant, code=s['code'],
                                defaults={
                                    'name': s['name'], 
                                    'system_actions': s.get('system_actions', {})
                                }
                            )

                elif step == 5: # System Roles (Review)
                    # No specific data to save, just acknowledgement
                    pass

                elif step == 6: # Regional Settings (Currency)
                    currency = data.get('currency')
                    if currency:
                        tenant.currency = currency

                # Update step progress
                # If 'target_step' is provided, use that (e.g., for back navigation)
                target_step = data.get('target_step')
                
                if target_step:
                     tenant.onboarding_step = int(target_step)
                else:
                    # Default: advance to next step
                    next_step = int(step) + 1
                    if next_step > tenant.onboarding_step:
                        tenant.onboarding_step = next_step
                
                tenant.save()
                
                return Response({
                    "message": "Step updated successfully",
                    "current_step": tenant.onboarding_step
                })
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    @action(detail=False, methods=['post'])
    def complete(self, request):
        """Mark onboarding as complete."""
        tenant = self.get_tenant(request)
        if not tenant:
            return Response({"error": "User does not belong to a tenant"}, status=400)

        tenant.is_setup_complete = True
        tenant.save()
        return Response({"message": "Onboarding completed successfully"})
