from django.db import models
from django.conf import settings
from django.conf import settings
# from .models import Employee  # Removed to avoid circular import

Tenant = 'users.Tenant'  # String reference to avoid circular imports if needed, or use settings.AUTH_USER_MODEL if tenant is linked there. 
# actually tenant is a ForeignKey usually. Let's use string reference or import if safe.
# checking models.py import pattern.

class SalaryComponent(models.Model):
    """
    Defines individual salary components like Basic, HRA, DA, etc.
    """
    COMPONENT_TYPES = [
        ('EARNING', 'Earning'),
        ('DEDUCTION', 'Deduction'),
    ]
    CALCULATION_TYPES = [
        ('FIXED', 'Fixed Amount'),
        ('PERCENTAGE', 'Percentage of Basic'),
        ('FORMULA', 'Formula Based'),
    ]
    
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20) # e.g. BASIC, HRA
    type = models.CharField(max_length=20, choices=COMPONENT_TYPES)
    calculation_type = models.CharField(max_length=20, choices=CALCULATION_TYPES)
    value = models.DecimalField(max_digits=10, decimal_places=2, default=0) # For fixed/percentage
    is_taxable = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE, related_name='salary_components')
    
    class Meta:
        unique_together = ['tenant', 'code']

    def __str__(self):
        return f"{self.name} ({self.code})"

class SalaryStructure(models.Model):
    """
    Groups components into a structure (e.g. Grade A, Interns)
    """
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    components = models.ManyToManyField(SalaryComponent, through='SalaryStructureComponent')
    is_default = models.BooleanField(default=False)
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE, related_name='salary_structures')

    def __str__(self):
        return self.name

class SalaryStructureComponent(models.Model):
    """
    Link table to override default values of components for a specific structure if needed
    """
    structure = models.ForeignKey(SalaryStructure, on_delete=models.CASCADE)
    component = models.ForeignKey(SalaryComponent, on_delete=models.CASCADE)
    # Allow overriding calculation logic per structure? For simplicity, we keep component logic.
    # But often order matters for calculation (Basic first).
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order']

class EmployeeSalary(models.Model):
    """
    Assigns a structure to an employee and defines their specific Basic Salary (CTC basis)
    """
    employee = models.OneToOneField('hrms.Employee', on_delete=models.CASCADE, related_name='salary_details')
    structure = models.ForeignKey(SalaryStructure, on_delete=models.PROTECT)
    base_salary = models.DecimalField(max_digits=12, decimal_places=2) # The base amount used for calculations
    effective_date = models.DateField()
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.employee} - {self.structure}"

class PayrollRun(models.Model):
    """
    Represents a batch execution of payroll for a month
    """
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('LOCKED', 'Locked'), # After payment
    ]
    
    month = models.DateField() # First day of the month usually
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    total_net_pay = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    processed_at = models.DateTimeField(null=True, blank=True)
    processed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE)

    class Meta:
        unique_together = ['tenant', 'month']

class Payslip(models.Model):
    """
    Generated payslip for an employee for a specific run
    """
    payroll_run = models.ForeignKey(PayrollRun, on_delete=models.CASCADE, related_name='payslips')
    employee = models.ForeignKey('hrms.Employee', on_delete=models.PROTECT)
    payslip_number = models.CharField(max_length=50, unique=True)
    
    # Snapshot of data
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2)
    gross_earnings = models.DecimalField(max_digits=12, decimal_places=2)
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2)
    net_pay = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Days
    total_days = models.IntegerField(default=30)
    working_days = models.DecimalField(max_digits=4, decimal_places=1)
    lop_days = models.DecimalField(max_digits=4, decimal_places=1, default=0) # Loss of Pay
    
    payment_status = models.CharField(max_length=20, default='PENDING', choices=[('PENDING', 'Pending'), ('PAID', 'Paid')])
    payment_date = models.DateField(null=True, blank=True)
    
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE)
    generated_at = models.DateTimeField(auto_now_add=True)

class PayslipComponent(models.Model):
    """
    Line items in the payslip (e.g. HRA: 5000)
    """
    payslip = models.ForeignKey(Payslip, on_delete=models.CASCADE, related_name='line_items')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)
    type = models.CharField(max_length=20, choices=SalaryComponent.COMPONENT_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)

class TaxDeclaration(models.Model):
    """
    Employee investment declarations for tax saving (80C etc)
    """
    REGIMES = [('OLD', 'Old Regime'), ('NEW', 'New Regime')]
    SECTION_CHOICES = [('80C', '80C'), ('80D', '80D'), ('HRA', 'HRA Exception')]
    
    employee = models.ForeignKey('hrms.Employee', on_delete=models.CASCADE)
    financial_year = models.CharField(max_length=9) # e.g. "2025-2026"
    regime = models.CharField(max_length=10, choices=REGIMES, default='NEW')
    section = models.CharField(max_length=10, choices=SECTION_CHOICES)
    declared_amount = models.DecimalField(max_digits=12, decimal_places=2)
    verified_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    proof_document = models.FileField(upload_to='tax_docs/', null=True, blank=True)
    status = models.CharField(max_length=20, default='PENDING', choices=[('PENDING', 'Pending'), ('SUBMITTED', 'Submitted'), ('APPROVED', 'Approved'), ('REJECTED', 'Rejected')])
    admin_remarks = models.TextField(blank=True, null=True)
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
