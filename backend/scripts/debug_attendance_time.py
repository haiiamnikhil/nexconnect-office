import os
import django
from django.conf import settings
from datetime import datetime
from django.utils import timezone

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saas_core.settings')
django.setup()

def test_parsing():
    # Simulate frontend sending UTC ISO string
    # Case 1: 08:17 AM IST -> 02:47 UTC
    utc_iso = "2026-02-13T02:47:00.000Z" 
    print(f"Input: {utc_iso}")
    
    try:
        dt = datetime.fromisoformat(utc_iso.replace('Z', '+00:00'))
        print(f"Parsed DT (Aware): {dt}")
        print(f"Time (Naive, UTC): {dt.time()}")
        
        # What we WANT (Local Time - IST)
        local_dt = timezone.localtime(dt)
        print(f"Local DT (IST): {local_dt}")
        print(f"Local Time (Correct): {local_dt.time()}")
        
    except ValueError as e:
        print(f"Error: {e}")

    # Case 2: 20:17 IST -> 14:47 UTC
    utc_iso_pm = "2026-02-13T14:47:00.000Z"
    print(f"\nInput: {utc_iso_pm}")
    dt = datetime.fromisoformat(utc_iso_pm.replace('Z', '+00:00'))
    print(f"Parsed DT: {dt}")
    print(f"Time: {dt.time()}")
    print(f"Local Time: {timezone.localtime(dt).time()}")

if __name__ == '__main__':
    test_parsing()
