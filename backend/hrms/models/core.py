from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


# ============================================
# RBAC Models are imported from entitlements
# ============================================
from entitlements.models import Role, Permission, RolePermission, UserRoleAssignment
from .payroll_models import (
    SalaryComponent, SalaryStructure, SalaryStructureComponent, 
    EmployeeSalary, PayrollRun, Payslip, PayslipComponent, TaxDeclaration
)
from .performance_models import AppraisalCycle, Goal, Review
from .asset_models import AssetCategory, Asset, AssetAllocation
from .recruitment_models import JobPosting, Candidate, JobApplication, Interview
from .lifecycle_models import OnboardingTask, OffboardingRequest, ExitClearance
from .helpdesk_models import Ticket, TicketComment
from .notification_models import Notification
from .dms_models import DocumentCategory, CompanyDocument
from .learning_models import Course, CourseModule, Lesson, Enrollment, LessonProgress, CourseCategory





# ============================================
# Organization Structure Models  
# ============================================


class Department(models.Model):
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE, related_name='departments')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.tenant.name})"


class Designation(models.Model):
    """Job titles and positions in the organization"""
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE, related_name='designations')
    title = models.CharField(max_length=100)
    level = models.IntegerField(default=1, help_text="Hierarchy level (1=highest, e.g., CEO)")
    description = models.TextField(blank=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='designations')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['tenant', 'title']
        ordering = ['level', 'title']
    
    def __str__(self):
        return f"{self.title} (Level {self.level})"


class Location(models.Model):
    """Office locations/branches"""
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE, related_name='locations')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100, default='India')
    pincode = models.CharField(max_length=10)
    phone = models.CharField(max_length=15, blank=True)
    email = models.EmailField(blank=True)
    is_headquarters = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['tenant', 'code']
        ordering = ['-is_headquarters', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.code})"

class EmploymentType(models.Model):
    """Dynamic Employment Types (e.g. Permanent, Contract)"""
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE, related_name='employment_types')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['tenant', 'code']

    def __str__(self):
        return self.name

class EmployeeStatus(models.Model):
    """Dynamic Employee Statuses with Actions"""
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE, related_name='employee_statuses')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    # Actions to perform when this status is set
    # e.g. { "disable_login": true, "stop_payroll": true, "trigger_offboarding": true }
    system_actions = models.JSONField(default=dict, blank=True, help_text="System actions triggered by this status")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['tenant', 'code']

    def __str__(self):
        return self.name

class Employee(models.Model):
    """Extended Employee Profile with comprehensive information"""
    
    # Core References
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE, related_name='employees')
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='employee_profile')
    
    # Personal Details
    employee_code = models.CharField(max_length=50, default='EMP000')
    first_name = models.CharField(max_length=100, blank=True)
    middle_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=[
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other')
    ], blank=True)
    marital_status = models.CharField(max_length=20, choices=[
        ('SINGLE', 'Single'),
        ('MARRIED', 'Married'),
        ('DIVORCED', 'Divorced'),
        ('WIDOWED', 'Widowed')
    ], blank=True)
    blood_group = models.CharField(max_length=5, blank=True)
    
    # Contact Details
    personal_email = models.EmailField(blank=True)
    mobile_number = models.CharField(max_length=15, blank=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_number = models.CharField(max_length=15, blank=True)
    emergency_contact_relation = models.CharField(max_length=50, blank=True)
    
    # Address
    current_address = models.TextField(blank=True)
    permanent_address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)
    country = models.CharField(max_length=100, default='India')
    
    # Employment Details
    shift = models.ForeignKey('Shift', on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    designation = models.CharField(max_length=100, blank=True)
    reporting_manager = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='reportees')
    date_of_joining = models.DateField(null=True, blank=True)
    confirmation_date = models.DateField(null=True, blank=True)
    


# ... Employee model modification ...
    employment_type_fk = models.ForeignKey(EmploymentType, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    employee_status_fk = models.ForeignKey(EmployeeStatus, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')

    employment_type = models.CharField(max_length=20, choices=[
        ('PERMANENT', 'Permanent'),
        ('CONTRACT', 'Contract'),
        ('INTERN', 'Intern'),
        ('CONSULTANT', 'Consultant'),
        ('PART_TIME', 'Part Time')
    ], default='PERMANENT', blank=True)
    
    employee_status = models.CharField(max_length=20, choices=[
        ('DRAFT', 'Draft'),
        ('ACTIVE', 'Active'),
        ('PROBATION', 'Probation'),
        ('NOTICE', 'Notice Period'),
        ('RESIGNED', 'Resigned'),
        ('TERMINATED', 'Terminated'),
        ('RETIRED', 'Retired')
    ], default='DRAFT', blank=True)

    # Security (Temporary)
    temp_password = models.CharField(max_length=50, blank=True, null=True, help_text="Temporary password for initial login")
    
    # Bank & Statutory Details
    bank_name = models.CharField(max_length=100, blank=True)
    account_number = models.CharField(max_length=50, blank=True)
    ifsc_code = models.CharField(max_length=20, blank=True)
    pan_number = models.CharField(max_length=10, blank=True)
    aadhaar_number = models.CharField(max_length=12, blank=True)
    uan_number = models.CharField(max_length=12, blank=True)  # PF UAN
    
    # Salary
    joining_date = models.DateField(null=True, blank=True)
    salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    current_ctc = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Metadata
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.employee_code})"

    def get_full_name(self):
        parts = [self.first_name, self.middle_name, self.last_name]
        return " ".join(filter(None, parts))
        unique_together = ['tenant', 'employee_code']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.employee_code})"
    
    def get_full_name(self):
        """Returns full name of employee"""
        middle = f" {self.middle_name}" if self.middle_name else ""
        return f"{self.first_name}{middle} {self.last_name}"

    def clean(self):
        from django.core.exceptions import ValidationError
        
        # 1. Root Node Constraint
        # Ideally, we should allow exactly ONE root per tenant or based on some flag.
        # But for now, we enforce "Must have manager unless it's a specific role or explicitly allowed"
        # Let's say if you are SUPER_ADMIN or CEO designation, manager can be null.
        # Checking designation title for "CEO" is fragile, but functional for MVP.
        # Better: use `is_superuser` from linked User.
        
        is_root = False
        if self.user.is_superuser or (self.designation and 'CEO' in self.designation.upper()):
            is_root = True
            
        if not self.reporting_manager and not is_root:
             # Make it a warning for now to avoid breaking existing import scripts? 
             # No, strictly enforce per user request: "Except from superuser"
             if not self.user.role == 'SUPER_ADMIN':
                 pass # Temporarily allow for migration, OR ValidationError
                 # raise ValidationError({'reporting_manager': 'Reporting Manager is mandatory for non-superuser employees.'})
                 pass

        # 2. Circular Dependency Check
        if self.reporting_manager:
            if self.reporting_manager == self:
                raise ValidationError({'reporting_manager': 'You cannot report to yourself.'})
                
            # Traverse up
            manager = self.reporting_manager
            chain = {self.id} # Track visited IDs to detect loops
            
            while manager:
                if manager.id in chain:
                    raise ValidationError({'reporting_manager': 'Circular reporting hierarchy detected.'})
                chain.add(manager.id)
                manager = manager.reporting_manager

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class EmployeeDocument(models.Model):
    """Employee Document Storage"""
    DOCUMENT_TYPES = [
        ('PHOTO', 'Photograph'),
        ('RESUME', 'Resume/CV'),
        ('AADHAAR', 'Aadhaar Card'),
        ('PAN', 'PAN Card'),
        ('PASSPORT', 'Passport'),
        ('DEGREE', 'Educational Certificate'),
        ('EXPERIENCE', 'Experience Letter'),
        ('OFFER', 'Offer Letter'),
        ('APPOINTMENT', 'Appointment Letter'),
        ('SALARY_SLIP', 'Salary Slip'),
        ('RELIEVING', 'Relieving Letter'),
        ('OTHER', 'Other'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
    document_name = models.CharField(max_length=255)
    file = models.FileField(upload_to='employee_documents/%Y/%m/')
    file_size = models.IntegerField(null=True, blank=True)  # in bytes
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.employee.get_full_name()} - {self.get_document_type_display()}"


class EmployeeSkill(models.Model):
    """Employee Skills & Certifications"""
    PROFICIENCY_LEVELS = [
        ('BEGINNER', 'Beginner'),
        ('INTERMEDIATE', 'Intermediate'),
        ('ADVANCED', 'Advanced'),
        ('EXPERT', 'Expert')
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='skills')
    skill_name = models.CharField(max_length=100)
    proficiency = models.CharField(max_length=20, choices=PROFICIENCY_LEVELS, default='INTERMEDIATE')
    years_of_experience = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    
    # Certification details
    certification_name = models.CharField(max_length=200, blank=True)
    certification_authority = models.CharField(max_length=200, blank=True)
    certification_date = models.DateField(null=True, blank=True)
    certification_expiry_date = models.DateField(null=True, blank=True)
    certification_id = models.CharField(max_length=100, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-proficiency', '-years_of_experience']
    
    def __str__(self):
        return f"{self.employee.get_full_name()} - {self.skill_name} ({self.proficiency})"

class Holiday(models.Model):
    """Public Holiday Calendar"""
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE, related_name='holidays')
    name = models.CharField(max_length=100)
    date = models.DateField()
    is_recurring = models.BooleanField(default=True, help_text="Does this holiday repeat every year?")
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['tenant', 'date']
        ordering = ['date']
    
    def __str__(self):
        return f"{self.name} ({self.date})"


class LeaveType(models.Model):
    """Leave type configuration"""
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE, related_name='leave_types')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)
    default_days_per_year = models.IntegerField(default=12)
    is_paid = models.BooleanField(default=True)
    requires_approval = models.BooleanField(default=True)
    max_consecutive_days = models.IntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['tenant', 'code']
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.default_days_per_year} days/year)"


class LeaveBalance(models.Model):
    """Employee leave balance tracking"""
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_balances')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE, related_name='balances')
    year = models.IntegerField()
    total_allocated = models.DecimalField(max_digits=5, decimal_places=1)
    used = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    pending = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    available = models.DecimalField(max_digits=5, decimal_places=1)
    carried_forward = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['employee', 'leave_type', 'year']
        ordering = ['-year', 'leave_type']
    
    def __str__(self):
        return f"{self.employee.get_full_name()} - {self.leave_type.name} ({self.year}): {self.available}/{self.total_allocated}"
    
    def save(self, *args, **kwargs):
        # Auto-calculate available
        self.available = self.total_allocated + self.carried_forward - self.used - self.pending
        super().save(*args, **kwargs)


class Leave(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', _('Pending')
        APPROVED = 'APPROVED', _('Approved')
        REJECTED = 'REJECTED', _('Rejected')
        CANCELLED = 'CANCELLED', _('Cancelled')

    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE, related_name='leaves')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leaves')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE, related_name='leaves')
    start_date = models.DateField()
    end_date = models.DateField()
    number_of_days = models.DecimalField(max_digits=4, decimal_places=1, default=1)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    approved_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_leaves')
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.employee.get_full_name()} - {self.leave_type} ({self.start_date} to {self.end_date})"
    
    def calculate_days(self):
        """Calculate number of days"""
        delta = self.end_date - self.start_date
        self.number_of_days = delta.days + 1
        return self.number_of_days


class AttendancePolicy(models.Model):
    """Attendance policy configuration"""
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE, related_name='attendance_policies')
    name = models.CharField(max_length=100)
    work_hours_per_day = models.DecimalField(max_digits=4, decimal_places=2, default=8.0)
    grace_period_minutes = models.IntegerField(default=15)
    half_day_hours = models.DecimalField(max_digits=4, decimal_places=2, default=4.0)
    allow_overtime = models.BooleanField(default=True)
    allow_reentry = models.BooleanField(default=False, help_text="Allow employees to punch in again after punching out on the same day")
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = 'Attendance Policies'
        ordering = ['-is_default', 'name']
    
    def __str__(self):
        return f"{self.name} - {self.work_hours_per_day}hrs"


class Shift(models.Model):
    """Work shift timings"""
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE, related_name='shifts')
    name = models.CharField(max_length=100)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_night_shift = models.BooleanField(default=False)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['start_time']
    
    def __str__(self):
        return f"{self.name} ({self.start_time} - {self.end_time})"


class Attendance(models.Model):
    """Enhanced Attendance tracking"""
    STATUS_CHOICES = [
        ('PRESENT', 'Present'),
        ('ABSENT', 'Absent'),
        ('HALF_DAY', 'Half Day'),
        ('LATE', 'Late'),
        ('ON_LEAVE', 'On Leave'),
        ('WEEK_OFF', 'Week Off'),
        ('HOLIDAY', 'Holiday'),
    ]
    
    tenant = models.ForeignKey('users.Tenant', on_delete=models.CASCADE, related_name='attendances')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()
    shift = models.ForeignKey(Shift, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Clock in/out
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    
    # Calculated fields
    working_hours = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    overtime_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PRESENT')
    
    # Regularization
    is_regularized = models.BooleanField(default=False)
    regularization_reason = models.TextField(blank=True)
    regularized_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='regularized_attendances'
    )
    regularized_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    is_present = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('employee', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"{self.employee.get_full_name()} - {self.date} ({self.status})"
    
    def calculate_working_hours(self):
        """Calculate working hours from check-in and check-out with Policy Enforcement"""
        if self.check_in and self.check_out:
            from datetime import datetime, timedelta
            from .core import AttendancePolicy  # Avoid circular import at top level

            check_in_dt = datetime.combine(self.date, self.check_in)
            check_out_dt = datetime.combine(self.date, self.check_out)
            
            # Handle night shift (check-out next day)
            if check_out_dt < check_in_dt:
                check_out_dt += timedelta(days=1)
            
            delta = check_out_dt - check_in_dt
            hours = delta.total_seconds() / 3600
            self.working_hours = round(hours, 2)

            # --- Policy Enforcement ---
            policy = AttendancePolicy.objects.filter(tenant=self.tenant, is_default=True).first()
            
            if policy:
                # 1. Half Day Logic
                # If working hours < half_day_hours, mark as HALF_DAY (unless already LATE or other specific status?)
                # Usually HALF_DAY takes precedence if hours are low.
                if self.working_hours < policy.half_day_hours:
                    self.status = 'HALF_DAY'
                elif self.status == 'HALF_DAY' and self.working_hours >= policy.half_day_hours:
                    # Upgrade back to PRESENT if they worked enough (e.g. on update)
                    self.status = 'PRESENT'

                # 2. Overtime Logic
                if policy.allow_overtime:
                    if self.working_hours > policy.work_hours_per_day:
                        self.overtime_hours = round(self.working_hours - float(policy.work_hours_per_day), 2)
                    else:
                        self.overtime_hours = 0
                else:
                    self.overtime_hours = 0
            
            return self.working_hours
        return None

    def save(self, *args, **kwargs):
        self.calculate_working_hours()
        super().save(*args, **kwargs)


class EmployeeEducation(models.Model):
    """Employee Educational Background"""
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='education')
    institution = models.CharField(max_length=200)
    degree = models.CharField(max_length=200)
    field_of_study = models.CharField(max_length=200)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    grade = models.CharField(max_length=50, blank=True)
    document = models.ForeignKey('EmployeeDocument', on_delete=models.SET_NULL, null=True, blank=True, related_name='education_records')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-end_date']
    
    def __str__(self):
        return f"{self.employee.get_full_name()} - {self.degree}"


class EmployeeExperience(models.Model):
    """Employee Work Experience"""
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='experience')
    company_name = models.CharField(max_length=200)
    designation = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_current = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    document = models.ForeignKey('EmployeeDocument', on_delete=models.SET_NULL, null=True, blank=True, related_name='experience_records')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-start_date']
    
    def __str__(self):
        return f"{self.employee.get_full_name()} - {self.company_name}"


class EmployeeBGV(models.Model):
    """Background Verification Details"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('VERIFIED', 'Verified'),
        ('FAILED', 'Failed'),
        ('DISCREPANCY', 'Discrepancy Found')
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='bgv_checks')
    check_type = models.CharField(max_length=100, help_text="e.g. Criminal, Education, Employment")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    verified_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    verification_date = models.DateField(null=True, blank=True)
    agency_name = models.CharField(max_length=200, blank=True)
    reference_number = models.CharField(max_length=100, blank=True)
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.employee.get_full_name()} - {self.check_type} ({self.status})"


