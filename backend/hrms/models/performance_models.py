from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class AppraisalCycle(models.Model):
    """
    Defines a review period (e.g., Q1 2025, Annual 2024)
    """
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
        ('ARCHIVED', 'Archived'),
    ]

    name = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    description = models.TextField(blank=True)
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE, related_name='appraisal_cycles')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date']
        unique_together = ['tenant', 'name']

    def __str__(self):
        return f"{self.name} ({self.status})"

class Goal(models.Model):
    """
    Objectives/OKRs set by an employee for a specific cycle.
    """
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    CATEGORY_CHOICES = [
        ('WORK', 'Work'),
        ('DEVELOPMENT', 'Personal Development'),
    ]

    employee = models.ForeignKey('hrms.Employee', on_delete=models.CASCADE, related_name='goals')
    cycle = models.ForeignKey(AppraisalCycle, on_delete=models.CASCADE, related_name='goals')
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='WORK')
    weightage = models.IntegerField(default=0, help_text="Weightage in percentage (0-100)")
    progress = models.IntegerField(default=0, help_text="Completion percentage (0-100)")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.employee}"

class Review(models.Model):
    """
    The actual appraisal record linking Employee, Cycle, and Ratings.
    Workflow: DRAFT -> SELF_SUBMITTED -> MANAGER_REVIEW -> COMPLETED
    """
    STATUS_CHOICES = [
        ('DRAFT', 'Draft (Self)'),
        ('SELF_SUBMITTED', 'Self Review Submitted'),
        ('MANAGER_REVIEW', 'Manager Reviewing'),
        ('HR_REVIEW', 'HR Reviewing'),
        ('COMPLETED', 'Completed'),
    ]

    employee = models.ForeignKey('hrms.Employee', on_delete=models.CASCADE, related_name='reviews')
    cycle = models.ForeignKey(AppraisalCycle, on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.ForeignKey('hrms.Employee', on_delete=models.SET_NULL, null=True, related_name='given_reviews', help_text="The manager doing the review")
    
    # Self Evaluation
    self_rating = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    self_comments = models.TextField(blank=True, help_text="Employee's self-reflection")
    
    # Manager Evaluation
    manager_rating = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    manager_comments = models.TextField(blank=True)
    
    # Outcome
    final_rating = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    final_comments = models.TextField(blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['employee', 'cycle']

    def __str__(self):
        return f"Review: {self.employee} - {self.cycle}"
