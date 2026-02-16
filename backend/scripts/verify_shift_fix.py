import os
import django
import sys
from pathlib import Path

# Add project root to path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saas_core.settings')
django.setup()

from hrms.models import Employee, Shift
from users.models import User

def verify_fix():
    print("Verifying Employee Shift Fix...")
    
    # Get first user layout
    user = User.objects.first()
    if not user:
        print("No users found")
        return

    # Get or create an employee
    employee = Employee.objects.filter(user=user).first()
    if not employee:
        print(f"No employee profile for {user.email}")
        return

    print(f"Checking Employee: {employee}")
    
    # Check if 'shift' attribute exists
    try:
        current_shift = employee.shift
        print(f"SUCCESS: 'shift' attribute exists. Value: {current_shift}")
    except AttributeError as e:
        print(f"FAILED: AttributeError: {e}")
        return

    # Try to assign a shift
    shift = Shift.objects.filter(tenant=employee.tenant).first()
    if shift:
        print(f"Assigning shift: {shift.name}")
        employee.shift = shift
        employee.save()
        
        # Reload
        employee.refresh_from_db()
        print(f"Reladed Employee Shift: {employee.shift.name}")
        assert employee.shift.id == shift.id
        print("SUCCESS: Shift assignment verified.")
    else:
        print("WARNING: No shifts found to assign.")

if __name__ == '__main__':
    verify_fix()
