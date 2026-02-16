from hrms.models import (
    Department, Designation, AttendancePolicy, Shift, LeaveType, Employee
)
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

class TenantInitializationService:
    @staticmethod
    def seed_defaults(tenant, admin_user):
        """
        Seed default data for a new tenant and link admin user to an employee profile.
        """
        try:
            logger.info(f"Seeding defaults for tenant: {tenant.name} ({tenant.domain})")

            # 1. Departments
            dept_mgmt = Department.objects.create(tenant=tenant, name='Management', description='Executive Management')
            dept_hr = Department.objects.create(tenant=tenant, name='Human Resources', description='HR and Admin')
            dept_it = Department.objects.create(tenant=tenant, name='Engineering', description='Technology and Engineering')
            dept_sales = Department.objects.create(tenant=tenant, name='Sales & Marketing', description='Revenue teams')

            # 2. Designations
            desig_ceo = Designation.objects.create(tenant=tenant, title='CEO', level=1, department=dept_mgmt)
            desig_hr_head = Designation.objects.create(tenant=tenant, title='HR Head', level=2, department=dept_hr)
            desig_tech_lead = Designation.objects.create(tenant=tenant, title='Tech Lead', level=3, department=dept_it)
            desig_employee = Designation.objects.create(tenant=tenant, title='Employee', level=5)

            # 3. Attendance Policy
            policy = AttendancePolicy.objects.create(
                tenant=tenant,
                name='General Policy',
                work_hours_per_day=9.0,
                grace_period_minutes=15,
                half_day_hours=4.5,
                is_default=True
            )

            # 4. Shift
            shift = Shift.objects.create(
                tenant=tenant,
                name='General Shift',
                start_time='09:00:00',
                end_time='18:00:00',
                is_default=True
            )

            # 5. Leave Types
            LeaveType.objects.create(tenant=tenant, name='Casual Leave', code='CL', default_days_per_year=12)
            LeaveType.objects.create(tenant=tenant, name='Sick Leave', code='SL', default_days_per_year=10)
            LeaveType.objects.create(tenant=tenant, name='Privilege Leave', code='PL', default_days_per_year=15)

            # 6. Create Employee Profile for Admin
            # Split name safely
            first_name = admin_user.first_name or admin_user.username
            last_name = admin_user.last_name or ''

            Employee.objects.create(
                tenant=tenant,
                user=admin_user,
                employee_code='ADM001',
                first_name=first_name,
                last_name=last_name,
                personal_email=admin_user.email,
                department=dept_mgmt,
                designation='CEO', # Storing as string in legacy field if needed, but we have Designation model now?
                # The Employee model has 'designation' as CharField (Step 524 line 129). 
                # It doesn't link to Designation model? 
                # Wait, checking Employee model again: 
                # line 129: designation = models.CharField(max_length=100, blank=True)
                # It does NOT ForeignKey to Designation. That's a legacy debt or design choice.
                # Use the string title.
                shift=shift,
                employment_type='PERMANENT',
                employee_status='ACTIVE',
                date_of_joining=timezone.now().date()
            )

            # ... (previous seeding code)

            # 7. Seed Permissions and Roles
            TenantInitializationService.seed_permissions(tenant, admin_user)

            logger.info("Seeding completed successfully.")

        except Exception as e:
            logger.error(f"Error seeding defaults for tenant {tenant.name}: {e}")
            # Don't raise, as registration should succeed even if seeding has partial issues

    @staticmethod
    def seed_permissions(tenant, admin_user=None):
        """
        Seed permissions and roles for a tenant.
        Can be run safely on existing tenants (using get_or_create).
        """
        try:
            from entitlements.models import Role, Permission, RolePermission, UserRoleAssignment
            
            # Define Permissions (Resource: [Actions])
            # Matches frontend permission-config.ts
            PERMISSION_DEFINITIONS = {
                'employee': ['CREATE', 'EDIT', 'DELETE', 'VIEW'],
                'leave': ['CREATE', 'EDIT', 'VIEW', 'APPROVE'],
                'attendance': ['CREATE', 'EDIT', 'VIEW'],
                'payroll': ['CREATE', 'EDIT', 'VIEW'],
                'performance': ['CREATE', 'EDIT', 'VIEW'],
                'recruitment': ['CREATE', 'EDIT', 'VIEW'],
                'asset': ['CREATE', 'EDIT', 'VIEW'],
                'helpdesk': ['CREATE', 'EDIT', 'VIEW'],
                'document': ['CREATE', 'EDIT', 'DELETE', 'VIEW'],
                'learning': ['CREATE', 'EDIT', 'VIEW'],
                'organization': ['EDIT', 'VIEW'],
                'analytics': ['VIEW', 'EXPORT'],
                'permission': ['EDIT', 'VIEW']
            }
            
            all_permissions = []
            for resource, actions in PERMISSION_DEFINITIONS.items():
                for action in actions:
                    perm, _ = Permission.objects.get_or_create(
                        tenant=tenant,
                        resource=resource,
                        action=action
                    )
                    all_permissions.append(perm)
            
            # Define Roles
            roles_config = {
                'Super Admin': {
                    'description': 'Full access to all modules',
                    'permissions': 'ALL', # Special flag
                    'is_system': True
                },
                'HR Manager': {
                    'description': 'Manage employees, leave, attendance, and recruitment',
                    'permissions': [
                        'employee:CREATE', 'employee:EDIT', 'employee:DELETE', 'employee:VIEW',
                        'leave:CREATE', 'leave:EDIT', 'leave:VIEW', 'leave:APPROVE',
                        'attendance:CREATE', 'attendance:EDIT', 'attendance:VIEW',
                        'recruitment:CREATE', 'recruitment:EDIT', 'recruitment:VIEW',
                        'document:CREATE', 'document:EDIT', 'document:VIEW',
                        'organization:VIEW', 'analytics:VIEW'
                    ]
                },
                'Dept Manager': {
                    'description': 'Manage team performance and approve leaves',
                    'permissions': [
                        'employee:VIEW',
                        'leave:VIEW', 'leave:APPROVE',
                        'attendance:VIEW',
                        'performance:CREATE', 'performance:EDIT', 'performance:VIEW',
                        'project:VIEW', 'task:CREATE', 'task:EDIT', 'task:VIEW'
                    ]
                },
                'Employee': {
                    'description': 'Standard employee access',
                    'permissions': [
                        'employee:VIEW',
                        'leave:CREATE', 'leave:VIEW',
                        'attendance:CREATE', 'attendance:VIEW',
                        'document:VIEW',
                        'helpdesk:CREATE', 'helpdesk:VIEW',
                        'asset:VIEW'
                    ]
                }
            }
            
            created_roles = {}
            for role_name, config in roles_config.items():
                role, _ = Role.objects.get_or_create(
                    tenant=tenant,
                    name=role_name,
                    defaults={
                        'description': config['description'],
                        'is_system_role': config.get('is_system', False)
                    }
                )
                created_roles[role_name] = role
                
                # Assign Permissions
                perms_to_assign = []
                if config['permissions'] == 'ALL':
                    perms_to_assign = all_permissions
                else:
                    for perm_str in config['permissions']:
                        try:
                            res, act = perm_str.split(':')
                            # Find matching permission object
                            matches = [p for p in all_permissions if p.resource == res and p.action == act]
                            if matches:
                                perms_to_assign.append(matches[0])
                        except ValueError:
                            continue
                
                # Bulk create RolePermission
                # We want to be idempotent here too.
                # Simplest way: loop and get_or_create
                for perm in perms_to_assign:
                    RolePermission.objects.get_or_create(role=role, permission=perm)
            
            # 8. Assign Super Admin Role to the Admin User IF provided
            if admin_user:
                super_admin_role = created_roles.get('Super Admin')
                if super_admin_role:
                    # Check if assignment exists
                    if not UserRoleAssignment.objects.filter(user=admin_user, role=super_admin_role).exists():
                         UserRoleAssignment.objects.create(
                            user=admin_user,
                            role=super_admin_role,
                            assigned_by=admin_user
                        )
            
            logging.getLogger(__name__).info(f"Permissions seeded for tenant {tenant.name}")

        except Exception as e:
            logging.getLogger(__name__).error(f"Error seeding permissions for tenant {tenant.name}: {e}")

    @staticmethod
    def ensure_employee_profile(user, tenant):
        """
        Ensure an employee profile exists for the given user/tenant.
        Safe to call if profile is missing.
        """
        if Employee.objects.filter(user=user, tenant=tenant).exists():
            return Employee.objects.get(user=user, tenant=tenant)

        # Create basic profile
        dept, _ = Department.objects.get_or_create(tenant=tenant, name='Management', defaults={'description': 'Executive Management'})
        shift, _ = Shift.objects.get_or_create(
            tenant=tenant, 
            name='General Shift', 
            defaults={'start_time': '09:00:00', 'end_time': '18:00:00', 'is_default': True}
        )
        
        first_name = user.first_name or user.username
        last_name = user.last_name or ''
        
        # Generate code
        count = Employee.objects.filter(tenant=tenant).count()
        code = f"EMP{count+1:03d}"
        if user.is_staff or user.is_superuser:
            code = "ADM001" # Try to reserve ADM for admin

        # uniqueness check for code
        if Employee.objects.filter(tenant=tenant, employee_code=code).exists():
            code = f"EMP{count+1:03d}"

        title = 'CEO' if user.is_superuser else 'Employee'

        return Employee.objects.create(
            tenant=tenant,
            user=user,
            employee_code=code,
            first_name=first_name,
            last_name=last_name,
            personal_email=user.email,
            department=dept,
            designation=title,
            shift=shift,
            employment_type='PERMANENT',
            employee_status='ACTIVE',
            date_of_joining=timezone.now().date()
        )
