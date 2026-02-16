from django.core.management.base import BaseCommand
from django.db import transaction
from users.models import Tenant
from hrms.models import Role, Permission, RolePermission


class Command(BaseCommand):
    help = 'Seed default roles and permissions for all tenants'

    def handle(self, *args, **options):
        self.stdout.write('Starting RBAC seed data creation...')
        
        # Get all tenants
        tenants = Tenant.objects.all()
        
        if not tenants.exists():
            self.stdout.write(self.style.ERROR('No tenants found. Create a tenant first.'))
            return
        
        for tenant in tenants:
            self.stdout.write(f'\nSeeding data for tenant: {tenant.name}')
            self.seed_permissions(tenant)
            self.seed_roles(tenant)
        
        self.stdout.write(self.style.SUCCESS('\n[OK] RBAC seed data created successfully!'))

    def seed_permissions(self, tenant):
        """Create default permissions for all resources"""
        resources = [
            'employee',
            'department',
            'designation',
            'location',
            'attendance',
            'leave',
            'payroll',
            'role',
            'permission',
            'user',
        ]
        
        actions = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE']
        
        created_count = 0
        with transaction.atomic():
            for resource in resources:
                for action in actions:
                    permission, created = Permission.objects.get_or_create(
                        tenant=tenant,
                        resource=resource,
                        action=action,
                        defaults={
                            'description': f'{action} permission for {resource}'
                        }
                    )
                    if created:
                        created_count += 1
        
        self.stdout.write(f'  - Created {created_count} permissions')

    def seed_roles(self, tenant):
        """Create default roles with appropriate permissions"""
        roles_config = {
            'Super Admin': {
                'description': 'Full system access with all permissions',
                'is_system_role': True,
                'permissions': 'ALL'  # Grant all permissions
            },
            'HR Admin': {
                'description': 'HR department administrator with full HRMS access',
                'is_system_role': True,
                'permissions': {
                    'employee': ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
                    'department': ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
                    'designation': ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
                    'location': ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
                    'attendance': ['VIEW', 'CREATE', 'EDIT', 'APPROVE'],
                    'leave': ['VIEW', 'CREATE', 'EDIT', 'APPROVE'],
                    'payroll': ['VIEW', 'CREATE', 'EDIT'],
                    'user': ['VIEW'],
                }
            },
            'Manager': {
                'description': 'Team manager with approval rights',
                'is_system_role': True,
                'permissions': {
                    'employee': ['VIEW'],
                    'attendance': ['VIEW', 'APPROVE'],
                    'leave': ['VIEW', 'APPROVE'],
                    'department': ['VIEW'],
                }
            },
            'Employee': {
                'description': 'Standard employee with basic access',
                'is_system_role': True,
                'permissions': {
                    'employee': ['VIEW'],  # Can view own profile
                    'attendance': ['VIEW', 'CREATE'],  # Can mark attendance
                    'leave': ['VIEW', 'CREATE'],  # Can apply for leave
                    'department': ['VIEW'],
                }
            },
            'Finance': {
                'description': 'Finance team with payroll access',
                'is_system_role': True,
                'permissions': {
                    'employee': ['VIEW'],
                    'payroll': ['VIEW', 'CREATE', 'EDIT'],
                    'department': ['VIEW'],
                }
            },
        }
        
        created_count = 0
        with transaction.atomic():
            for role_name, config in roles_config.items():
                role, created = Role.objects.get_or_create(
                    tenant=tenant,
                    name=role_name,
                    defaults={
                        'description': config['description'],
                        'is_system_role': config['is_system_role']
                    }
                )
                
                if created:
                    created_count += 1
                    self.stdout.write(f'  - Created role: {role_name}')
                
                # Clear existing permissions for the role
                RolePermission.objects.filter(role=role).delete()
                
                # Assign permissions
                if config['permissions'] == 'ALL':
                    # Grant all permissions
                    all_permissions = Permission.objects.filter(tenant=tenant)
                    for permission in all_permissions:
                        RolePermission.objects.create(role=role, permission=permission)
                    self.stdout.write(f'    -> Granted ALL permissions ({all_permissions.count()})')
                else:
                    # Grant specific permissions
                    granted = 0
                    for resource, actions in config['permissions'].items():
                        for action in actions:
                            try:
                                permission = Permission.objects.get(
                                    tenant=tenant,
                                    resource=resource,
                                    action=action
                                )
                                RolePermission.objects.create(role=role, permission=permission)
                                granted += 1
                            except Permission.DoesNotExist:
                                self.stdout.write(
                                    self.style.WARNING(
                                        f'    ! Permission not found: {resource}:{action}'
                                    )
                                )
                    self.stdout.write(f'    -> Granted {granted} permissions')
        
        self.stdout.write(f'  - Total roles created: {created_count}')
