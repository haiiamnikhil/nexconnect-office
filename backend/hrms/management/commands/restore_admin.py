from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from hrms.models import Employee, Department
from users.models.core_models import Tenant

User = get_user_model()

class Command(BaseCommand):
    help = 'Restores an employee profile for the first superuser found'

    def handle(self, *args, **options):
        # Find all Superusers and Tenant Admins
        from django.db.models import Q
        admins = User.objects.filter(Q(is_superuser=True) | Q(role__in=['SUPER_ADMIN', 'TENANT_ADMIN']))
        
        self.stdout.write(f"Found {admins.count()} admin users.")

        for user in admins:
            if not user.tenant:
                self.stdout.write(self.style.WARNING(f"Skipping {user.email}: No tenant assigned"))
                continue

            # Check/Create Department in User's Tenant
            dept, _ = Department.objects.get_or_create(
                name="Administration",
                tenant=user.tenant,
                defaults={'description': 'System Administration'}
            )

            # Check/Create Employee
            employee, created = Employee.objects.get_or_create(
                user=user,
                defaults={
                    'tenant': user.tenant, # IMPORTANT: Match user's tenant
                    'employee_code': f'ADMIN{user.id}',
                    'first_name': user.first_name or 'Admin',
                    'last_name': user.last_name or 'User',
                    'personal_email': user.email,
                    'mobile_number': '0000000000',
                    'department': dept,
                    'designation': 'System Administrator',
                    'joining_date': '2020-01-01',
                    'salary': 100000,
                    'employee_status': 'ACTIVE',
                    'employment_type': 'PERMANENT'
                }
            )

            if created:
                self.stdout.write(self.style.SUCCESS(f'Created employee profile for {user.email} (Tenant: {user.tenant.name})'))
            else:
                self.stdout.write(f'Profile exists for {user.email}')
