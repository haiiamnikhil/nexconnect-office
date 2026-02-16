from django.db import models
from django.conf import settings

class OnboardingTask(models.Model):
    """
    Tasks for new joinees (e.g., "Submit Documents", "Setup Email")
    """
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
    ]

    employee = models.ForeignKey('hrms.Employee', on_delete=models.CASCADE, related_name='onboarding_tasks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    due_date = models.DateField(null=True, blank=True)
    assigned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='assigned_onboarding_tasks')
    
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.employee}"

class OffboardingRequest(models.Model):
    """
    Resignation or Termination request
    """
    STATUS_CHOICES = [
        ('REQUESTED', 'Requested'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('COMPLETED', 'Completed'), # Once exit is finalized
    ]

    employee = models.ForeignKey('hrms.Employee', on_delete=models.CASCADE, related_name='offboarding_requests')
    resignation_date = models.DateField()
    last_working_day = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='REQUESTED')
    
    manager_comments = models.TextField(blank=True)
    
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Resignation: {self.employee}"

class ExitClearance(models.Model):
    """
    Department-wise clearance for offboarding
    """
    DEPARTMENT_CHOICES = [
        ('IT', 'IT / Assets'),
        ('FINANCE', 'Finance / Payroll'),
        ('ADMIN', 'Administration'),
        ('MANAGER', 'Reporting Manager'),
    ]
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('CLEARED', 'Cleared'),
        ('REJECTED', 'Rejected'),
    ]

    offboarding_request = models.ForeignKey(OffboardingRequest, on_delete=models.CASCADE, related_name='clearances')
    department = models.CharField(max_length=20, choices=DEPARTMENT_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    remarks = models.TextField(blank=True)
    cleared_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    cleared_at = models.DateTimeField(null=True, blank=True)
    
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['offboarding_request', 'department']

    def __str__(self):
        return f"{self.department} Clearance for {self.offboarding_request.employee}"
