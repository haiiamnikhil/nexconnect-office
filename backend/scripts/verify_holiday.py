import os
import sys
import django
from datetime import date

# Setup Django Environment
sys.path.append(os.getcwd())
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saas_core.settings')
django.setup()

from django.conf import settings
settings.ALLOWED_HOSTS = ['*']

from django.contrib.auth import get_user_model
from hrms.models import Holiday, LeaveType, LeaveBalance, Employee, Leave
from hrms.data.leave_serializers import LeaveSerializer
from rest_framework.test import APIRequestFactory

User = get_user_model()

def verify_holiday_deduction():
    print("--- Verifying Holiday Deduction ---")
    
    # 1. Setup Data
    email = "admin_holiday_test@example.com"
    user, _ = User.objects.get_or_create(username='admin_holiday', email=email, defaults={'is_superuser': True})
    
    from users.models import Tenant
    tenant, _ = Tenant.objects.get_or_create(name="Holiday Test Tenant", defaults={'domain': 'holiday_test'})
    if not hasattr(user, 'tenant') or not user.tenant: 
        user.tenant = tenant
        user.save()
        
    employee, _ = Employee.objects.get_or_create(employee_code="HOL001", tenant=tenant, defaults={
        'user': user, 'first_name': 'Holiday', 'last_name': 'Tester', 'joining_date': '2025-01-01', 'salary': 50000
    })
    
    # 2. Create Leave Type & Balance
    l_type, _ = LeaveType.objects.get_or_create(code="AL", tenant=tenant, defaults={'name': 'Annual Leave', 'default_days_per_year': 20})
    
    balance, _ = LeaveBalance.objects.get_or_create(employee=employee, leave_type=l_type, year=2025, defaults={
        'total_allocated': 20, 'available': 20
    })
    balance.available = 20 # Reset
    balance.pending = 0
    balance.used = 0
    balance.save()

    # 3. Create Holiday
    h_date = date(2025, 12, 25)
    Holiday.objects.get_or_create(tenant=tenant, date=h_date, defaults={'name': 'Xmas'})
    print(f"Created Holiday: {h_date}")

    # 4. Attempt Leave Application Overlapping Holiday
    # Range: 24th Dec to 26th Dec (3 calendar days, 1 holiday -> 2 leave days)
    data = {
        'employee': employee.id,
        'leave_type': l_type.id,
        'start_date': '2025-12-24',
        'end_date': '2025-12-26',
        'reason': 'Christmas Break'
    }
    
    factory = APIRequestFactory()
    request = factory.post('/api/hrms/leave-applications/', data)
    request.user = user
    
    serializer = LeaveSerializer(data=data, context={'request': request})
    
    if serializer.is_valid():
        leave = serializer.save()
        print(f"Leave Applied: {leave}")
        print(f"Defined Days (Should be 2): {leave.number_of_days}")
        
        if leave.number_of_days == 2.0:
            print("✅ Holiday Deduction Verified Successfully!")
        else:
            print(f"❌ Failed. Expected 2.0, got {leave.number_of_days}")
            
        # Cleanup
        leave.delete()
    else:
        print(f"❌ Validation Failed: {serializer.errors}")

if __name__ == "__main__":
    verify_holiday_deduction()
