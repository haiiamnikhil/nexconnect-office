import os
import sys
import django
import requests
import json
print(f"DEBUG: CWD = {os.getcwd()}")
print(f"DEBUG: sys.path = {sys.path}")

# Setup Django Environment
# We expect PYTHONPATH to handle the root, but we keep the fallback
sys.path.append(os.getcwd()) # Add current working directory (backend root)
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) # Add script's parent (backend) just in case
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saas_core.settings')
django.setup()

from django.conf import settings
settings.ALLOWED_HOSTS = ['*'] # patch allowed hosts for test

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from hrms.models import Employee, Attendance

User = get_user_model()

def verify_biometric_sync():
    print("--- Verifying Biometric Sync ---")
    
    # 1. Setup User and Employee
    username = "biometric_test_admin"
    email = "biometric_test_admin@example.com"
    
    # Create or Get User by Username
    user, created = User.objects.get_or_create(username=username, defaults={
        'email': email,
        'is_staff': True,
        'is_superuser': True
    })
    
    if created:
        user.set_password('admin')
        user.save()
        print(f"Created User: {username}")
    else:
        print(f"Using Existing User: {username}")

    # Create or Get Tenant
    from users.models import Tenant
    tenant, created = Tenant.objects.get_or_create(name="Test Tenant", defaults={
        'domain': 'test',
        'owner': user
    })
    
    # Associate User with Tenant if needed (depending on model, usually user.tenant field)
    # Check if user model has tenant field
    if hasattr(user, 'tenant') and not user.tenant:
        user.tenant = tenant
        user.save()
    
    if not user.tenant:
         print("User has no tenant and could not assign one. Aborting.")
         return

    tenant = user.tenant
    
    # Ensure Employee exists
    emp_code = "TEST001"
    employee, created = Employee.objects.get_or_create(
        employee_code=emp_code,
        tenant=tenant,
        defaults={
            'user': user,
            'first_name': 'Biometric',
            'last_name': 'Tester',
            'joining_date': '2025-01-01',
            'salary': 50000,
            # 'official_email': 'bio@test.com' # Removed as it does not exist
             'personal_email': 'bio@test.com'
        }
    )
    if created:
        print(f"Created Test Employee: {emp_code}")
    else:
        print(f"Using Existing Employee: {emp_code}")

    # 2. Simulate Webhook Request
    client = APIClient()
    client.force_authenticate(user=user)
    
    payload = {
        "device_id": "LOC-001",
        "logs": [
            { "employee_code": emp_code, "timestamp": "2025-02-10 09:00:00", "direction": "IN" },
            { "employee_code": emp_code, "timestamp": "2025-02-10 18:00:00", "direction": "OUT" }
        ]
    }
    
    url = '/api/hrms/attendance/biometric_sync/'
    print(f"Sending POST to {url} with payload...")
    
    response = client.post(url, payload, format='json')
    
    print(f"Response Code: {response.status_code}")
    print(f"Response Data: {response.data}")
    
    if response.status_code == 200:
        # 3. Verify Database
        att = Attendance.objects.filter(employee=employee, date="2025-02-10").first()
        if att:
            print(f"Attendance Record Found: {att}")
            print(f"Check In: {att.check_in}")
            print(f"Check Out: {att.check_out}")
            print(f"Working Hours: {att.working_hours}")
            
            if str(att.check_in) == "09:00:00" and str(att.check_out) == "18:00:00":
                print("✅ Biometric Sync Verified Successfully!")
            else:
                print("❌ Check-in/out times do not match expectation.")
        else:
            print("❌ Attendance record not created.")
    else:
        print("❌ API Request failed.")

if __name__ == "__main__":
    verify_biometric_sync()
