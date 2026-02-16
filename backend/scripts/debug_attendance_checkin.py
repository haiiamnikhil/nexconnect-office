import os
import sys
import django
from datetime import datetime
from django.utils import timezone

# Setup Django Environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saas_core.settings')
django.setup()

from hrms.models import Attendance, Employee, AttendancePolicy
from rest_framework.test import APIRequestFactory
from hrms.views.attendance_views import AttendanceViewSet

def test_check_in():
    print("Testing Check-In Logic...")
    
    # 1. Get an Employee
    employee = Employee.objects.first()
    if not employee:
        print("No employee found!")
        return
        
    print(f"Testing for Employee: {employee.get_full_name()} ({employee.id})")
    
    # 2. Prepare Payload
    factory = APIRequestFactory()
    url = '/api/hrms/attendance-v2/check_in/'
    payload = {
        'employee_id': employee.id,
        'local_time': datetime.now().isoformat()
    }
    
    # 3. Create Request
    from rest_framework.test import force_authenticate
    request = factory.post(url, payload, format='json')
    force_authenticate(request, user=employee.user)
    
    # 4. View Logic
    view = AttendanceViewSet.as_view({'post': 'check_in'})
    
    try:
        response = view(request)
        print(f"Status Code: {response.status_code}")
        print(f"Data: {response.data}")
    except Exception as e:
        print(f"CRASH: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_check_in()
