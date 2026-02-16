from django.db import models
from django.conf import settings
from .core_models import Tenant

class UserActivity(models.Model):
    """
    Tracks user actions across the system (Login, Data Changes, etc.)
    """
    ACTION_TYPES = [
        ('LOGIN', 'Login'),
        ('LOGOUT', 'Logout'),
        ('CREATE', 'Create'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
        ('VIEW', 'View'),
        ('APPROVE', 'Approve'),
        ('REJECT', 'Reject'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='activities')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='user_activities', null=True, blank=True)
    
    action = models.CharField(max_length=20, choices=ACTION_TYPES)
    module = models.CharField(max_length=50, help_text="e.g. Attendance, Employee")
    description = models.TextField()
    
    # Metadata
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['tenant', '-created_at']),
        ]
        
    def __str__(self):
        return f"{self.user.username} - {self.action} - {self.module} ({self.created_at})"
