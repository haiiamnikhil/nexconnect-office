from hrms.models import LeaveType
from users.models import Tenant

def seed_leave_types():
    tenants = Tenant.objects.all()
    if not tenants.exists():
        print("No tenants found.")
        return

    defaults = [
        {'name': 'Casual Leave', 'code': 'CL', 'days': 12, 'paid': True},
        {'name': 'Sick Leave', 'code': 'SL', 'days': 12, 'paid': True},
        {'name': 'Earned Leave', 'code': 'EL', 'days': 15, 'paid': True},
        {'name': 'Loss of Pay', 'code': 'LOP', 'days': 0, 'paid': False},
    ]

    for tenant in tenants:
        print(f"Seeding for tenant: {tenant.name}")
        for d in defaults:
            lt, created = LeaveType.objects.get_or_create(
                tenant=tenant,
                code=d['code'],
                defaults={
                    'name': d['name'],
                    'default_days_per_year': d['days'],
                    'is_paid': d['paid'],
                    'requires_approval': True
                }
            )
            if created:
                print(f"  Created {d['name']}")
            else:
                print(f"  Exists {d['name']}")

seed_leave_types()
