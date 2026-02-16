from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class JobPosting(models.Model):
    """
    Job Openings / Requisitions
    """
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('OPEN', 'Open'),
        ('CLOSED', 'Closed'),
        ('HOLD', 'On Hold'),
    ]

    title = models.CharField(max_length=200)
    department = models.ForeignKey('hrms.Department', on_delete=models.SET_NULL, null=True, related_name='job_postings')
    description = models.TextField()
    requirements = models.TextField(help_text="Skills and qualifications required")
    location = models.ForeignKey('hrms.Location', on_delete=models.SET_NULL, null=True)
    type = models.CharField(max_length=50, default='Full Time', choices=[('Full Time', 'Full Time'), ('Part Time', 'Part Time'), ('Contract', 'Contract')])
    salary_range = models.CharField(max_length=100, blank=True, help_text="e.g. 50k - 80k")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    posted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE, related_name='job_postings')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.status})"

class Candidate(models.Model):
    """
    Applicant profiles
    """
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    linkedin_url = models.URLField(blank=True)
    resume = models.FileField(upload_to='resumes/', blank=True, null=True)
    source = models.CharField(max_length=100, default='Website', help_text="LinkedIn, Referral, etc.")
    
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE, related_name='candidates')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['tenant', 'email']

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class JobApplication(models.Model):
    """
    Link between Candidate and Job Posting
    """
    STAGE_CHOICES = [
        ('APPLIED', 'Applied'),
        ('SCREENING', 'In Screening'),
        ('INTERVIEW', 'Interview Scheduled'),
        ('OFFERED', 'Offer Sent'),
        ('HIRED', 'Hired'),
        ('REJECTED', 'Rejected'),
    ]

    job = models.ForeignKey(JobPosting, on_delete=models.CASCADE, related_name='applications')
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='applications')
    current_stage = models.CharField(max_length=20, choices=STAGE_CHOICES, default='APPLIED')
    rating = models.IntegerField(default=0, help_text="1-5 stars")
    
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE)
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['job', 'candidate']

class Interview(models.Model):
    """
    Scheduled Interviews
    """
    application = models.ForeignKey(JobApplication, on_delete=models.CASCADE, related_name='interviews')
    interviewer = models.ForeignKey('hrms.Employee', on_delete=models.SET_NULL, null=True, related_name='interviews_conducting')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    link = models.URLField(blank=True, help_text="Zoom/Meet link")
    
    feedback = models.TextField(blank=True)
    rating = models.IntegerField(default=0, help_text="1-10 score")
    status = models.CharField(max_length=20, default='SCHEDULED', choices=[('SCHEDULED', 'Scheduled'), ('COMPLETED', 'Completed'), ('CANCELLED', 'Cancelled')])
    
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
