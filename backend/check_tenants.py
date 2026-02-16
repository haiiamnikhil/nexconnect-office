import os
import django
import sys

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app_engine.settings')
django.setup()

from users.models import Tenant, User
from hrms.models import Employee

print(f"{'ID':<5} {'Name':<20} {'Domain':<15}")
print("-" * 45)
for t in Tenant.objects.all():
    print(f"{t.id:<5} {t.name:<20} {t.domain:<15}")

print("\nUsers:")
print(f"{'ID':<5} {'Username':<15} {'Role':<15} {'Tenant':<20}")
print("-" * 60)
for u in User.objects.all().select_related('tenant'):
    print(f"{u.id:<5} {u.username:<15} {u.role:<15} {u.tenant.name if u.tenant else 'None':<20}")

print("\nEmployees (First 5):")
print(f"{'ID':<5} {'Name':<20} {'Tenant':<20}")
print("-" * 50)
for e in Employee.objects.all().select_related('tenant')[:5]:
    print(f"{e.id:<5} {e.first_name:<20} {e.tenant.name if e.tenant else 'None':<20}")
