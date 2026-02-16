import os
import sys
import django
from datetime import timedelta
from django.utils import timezone

# Setup Django Environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saas_core.settings')
django.setup()

from hrms.models import Attendance

def auto_logout_users():
    """
    Auto-logout users who have not punched out within 12 hours of check-in.
    """
    print(f"Running auto-logout script at {timezone.now()}")
    
    # 1. Find Open Sessions (Checked In but NOT Checked Out)
    active_records = Attendance.objects.filter(check_in__isnull=False, check_out__isnull=True)
    
    count = 0
    for record in active_records:
        if not record.check_in: 
            continue
            
        # Compose check-in datetime
        # Naive combination using record.date and record.check_in
        # Assuming record.date is the date of check-in (in server or local time)
        # We need to recognize if check-in was 'yesterday' relative to now.
        
        # Best approach: Treat record.date + record.check_in as the start datetime
        # Note: Attendance model stores naive TimeField. We assume it belongs to record.date.
        check_in_dt = timezone.datetime.combine(record.date, record.check_in)
        
        # Make it aware?
        if timezone.is_aware(timezone.now()):
             check_in_dt = timezone.make_aware(check_in_dt)
        
        # Calculate duration
        now = timezone.now()
        duration = now - check_in_dt
        
        # Check if duration > 12 hours
        if duration > timedelta(hours=12):
            print(f"Auto-logging out {record.employee} - Checked in at {check_in_dt}, Elapsed: {duration}")
            
            # Set check_out time to 12 hours after check_in exactly? Or Now?
            # User request: "logout automatically after 12 hours".
            # Implies strictly capping at 12h or logging out at the 12h mark.
            # Usually strict capping is better for compliance, but logging out 'Now' is safer for real data.
            # "If user didn't logout then only logout automatically after 12 hours"
            # Let's set it to check_in + 12h to prevent "infinite work" accumulation.
            
            auto_checkout_dt = check_in_dt + timedelta(hours=12)
            
            # If auto_checkout_dt is a different day, does model support it?
            # Attendance model Logic (calculate_working_hours) supports next day checkout.
            
            record.check_out = auto_checkout_dt.time()
            
            # Recalculate working hours (should be 12.0)
            record.calculate_working_hours()
            record.status = 'PRESENT' # Ensure status is correct
            record.save()
            count += 1
            
    print(f"Auto-logged out {count} employees.")

if __name__ == "__main__":
    auto_logout_users()
