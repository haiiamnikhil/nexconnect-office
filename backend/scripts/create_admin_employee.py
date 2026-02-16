from users.models import User
from hrms.models import Employee, Department, Designation
from hrms.actions.leave_utils import LeaveAccrualService
from django.utils import timezone

try:
    user = User.objects.get(username='admin')
    tenant = user.tenant
    
    # Ensure Dept/Desig exist
    dept, _ = Department.objects.get_or_create(tenant=tenant, name='Administration')
    desig, _ = Designation.objects.get_or_create(tenant=tenant, title='System Administrator')
    
    emp, created = Employee.objects.get_or_create(
        user=user,
        defaults={
            'tenant': tenant,
            'employee_code': 'ADMIN001',
            'first_name': 'System',
            'last_name': 'Admin',
            'personal_email': 'admin@example.com',
            'department': dept,
            'designation': desig,
            'joining_date': timezone.now().date(),
            'salary': 100000.00,
            'current_ctc': 1200000.00,
            'is_active': True
        }
    )
    
    if created:
        print("Created Employee profile for admin")
    else:
        print("Employee profile for admin already exists")
        
    # Run Accrual
    print("Running Leave Accrual...")
    service = LeaveAccrualService(tenant)
    stats = service.run_monthly_accrual()
    print("Accrual Stats:", stats)
    
except User.DoesNotExist:
    print("User 'admin' not found")
except Exception as e:
    print(f"Error: {e}")
