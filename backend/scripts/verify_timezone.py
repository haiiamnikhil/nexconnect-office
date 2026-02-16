import os
import django
import sys
from pathlib import Path
from django.utils import timezone

# Add project root to path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saas_core.settings')
django.setup()

def verify_time():
    print("Verifying time behavior...")
    
    # 1. UTC Now
    utc_now = timezone.now()
    print(f"UTC Now (timezone.now()): {utc_now}")
    
    # 2. Local Time from UTC
    local_now = timezone.localtime(utc_now)
    print(f"Local Time (timezone.localtime()): {local_now}")
    
    # 3. Time Component check
    # Check if we were to take .time() directly from UTC vs Local
    utc_time_component = utc_now.time()
    local_time_component = local_now.time()
    
    print(f"UTC .time() component: {utc_time_component}")
    print(f"Local .time() component: {local_time_component}")
    
    # Expected behavior
    if utc_time_component != local_time_component:
        print("DIFFERENCE CONFIRMED: UTC time != Local time")
        print("Using .localtime() fixes this discrepancy for TimeField storage.")
    else:
        print("WARNING: Times are same? Are you running in UTC timezone or offset is 0?")

if __name__ == '__main__':
    verify_time()
