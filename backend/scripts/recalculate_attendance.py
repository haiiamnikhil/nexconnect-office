import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saas_core.settings')
django.setup()

from hrms.models import Attendance

def recalculate():
    print("Recalculating attendance hours for all records...")
    attendances = Attendance.objects.all()
    count = 0
    updated = 0
    
    for att in attendances:
        count += 1
        original_hours = att.working_hours
        # calling save() will trigger calculate_working_hours() due to our model update
        att.save() 
        
        if original_hours != att.working_hours:
            print(f"Updated {att}: {original_hours} -> {att.working_hours}")
            updated += 1
            
    print(f"Processed {count} records. Updated {updated}.")

if __name__ == "__main__":
    recalculate()
