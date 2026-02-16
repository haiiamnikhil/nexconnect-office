from django.db import models
from django.conf import settings

class DocumentCategory(models.Model):
    name = models.CharField(max_length=100)
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ('name', 'tenant')

    def __str__(self):
        return self.name

class CompanyDocument(models.Model):
    VISIBILITY_CHOICES = [
        ('ALL', 'All Employees'),
        ('ADMIN', 'Admins Only'),
        ('DEPT', 'Department Specific'),
    ]

    title = models.CharField(max_length=200)
    document_file = models.FileField(upload_to='company_docs/')
    category = models.ForeignKey(DocumentCategory, on_delete=models.SET_NULL, null=True, blank=True)
    description = models.TextField(blank=True)
    
    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default='ALL')
    department = models.ForeignKey('hrms.Department', on_delete=models.SET_NULL, null=True, blank=True, help_text="Required if visibility is DEPT")
    
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
