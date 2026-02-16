from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class AssetCategory(models.Model):
    """
    Category of assets (e.g., Laptop, Mobile, License, Furniture)
    """
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE, related_name='asset_categories')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['tenant', 'name']
        verbose_name_plural = "Asset Categories"

    def __str__(self):
        return self.name

class Asset(models.Model):
    """
    Physical or digital assets owned by the organization.
    """
    STATUS_CHOICES = [
        ('AVAILABLE', 'Available'),
        ('ASSIGNED', 'Assigned'),
        ('IN_REPAIR', 'In Repair'),
        ('SCRAPPED', 'Scrapped'),
        ('LOST', 'Lost'),
    ]

    name = models.CharField(max_length=200, help_text="Model name or description")
    category = models.ForeignKey(AssetCategory, on_delete=models.PROTECT, related_name='assets')
    serial_number = models.CharField(max_length=100, help_text="Unique Serial Number / License Key")
    asset_id = models.CharField(max_length=100, blank=True, help_text="Internal Tag ID (optional)")
    
    purchase_date = models.DateField(null=True, blank=True)
    warranty_expiry = models.DateField(null=True, blank=True)
    purchase_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    vendor_name = models.CharField(max_length=200, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE')
    location = models.ForeignKey('hrms.Location', on_delete=models.SET_NULL, null=True, blank=True)
    
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE, related_name='assets')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['tenant', 'serial_number']

    def __str__(self):
        return f"{self.name} ({self.serial_number})"

class AssetAllocation(models.Model):
    """
    History of asset assignment to employees.
    """
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='allocations')
    employee = models.ForeignKey('hrms.Employee', on_delete=models.CASCADE, related_name='assets_held')
    
    assigned_date = models.DateField()
    return_date = models.DateField(null=True, blank=True)
    
    assigned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='assets_assigned_by')
    returned_condition = models.CharField(max_length=200, blank=True)
    remarks = models.TextField(blank=True)
    
    is_active = models.BooleanField(default=True, help_text="Currently held by employee")
    
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.asset} -> {self.employee}"
