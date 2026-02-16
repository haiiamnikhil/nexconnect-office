import os
import django
import sys

# Set up Django environment
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saas_core.settings')
django.setup()

from users.models import Tenant, User
from hrms.services.tenant_init_service import TenantInitializationService

def seed_existing_tenants():
    print("Seeding permissions for existing tenants...")
    tenants = Tenant.objects.all()
    for tenant in tenants:
        print(f"Processing tenant: {tenant.name}")
        # Find an admin user for this tenant
        admin_user = User.objects.filter(tenant=tenant, is_superuser=True).first()
        if not admin_user:
            admin_user = User.objects.filter(tenant=tenant, role='SUPER_ADMIN').first()
        
        if admin_user:
            print(f"  Found admin user: {admin_user.username}")
        else:
            print("  No admin user found. Seeding permissions/roles without assigning to user.")
            
        TenantInitializationService.seed_permissions(tenant, admin_user)
        print("  Done.")

if __name__ == '__main__':
    seed_existing_tenants()
