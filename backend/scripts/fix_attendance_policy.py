import os
import sys
import django

# Setup Django Environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saas_core.settings')
django.setup()

from hrms.models import AttendancePolicy, Tenant

def setup_policy():
    print("Checking Attendance Policy...")
    
    tenant = Tenant.objects.first() # Using first tenant for debug
    if not tenant:
        print("No Tenant found!")
        return

    policy = AttendancePolicy.objects.filter(tenant=tenant, is_default=True).first()
    
    if not policy:
        print("No default policy found. Creating one...")
        policy = AttendancePolicy.objects.create(
            tenant=tenant,
            name="Default Policy",
            is_default=True,
            allow_overtime=True,
            allow_reentry=True # Force True
        )
    else:
        print(f"Policy found: {policy.name}")
        if not policy.allow_reentry:
            print("Enabling allow_reentry...")
            policy.allow_reentry = True
            policy.save()
        else:
            print("allow_reentry is already True.")
            
    print("Policy verification complete.")

if __name__ == "__main__":
    setup_policy()
