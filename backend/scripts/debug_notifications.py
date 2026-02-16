import os
import django
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saas_core.settings')
django.setup()

from hrms.models import Notification
from users.models import User

def debug_notifications():
    user = User.objects.first()
    print(f"Checking user: {user.email}")
    
    count = Notification.objects.filter(tenant=user.tenant, user=user, is_read=False).count()
    print(f"Unread Count in DB: {count}")
    
    # Check if API would return the same
    # The viewset uses: Notification.objects.filter(tenant=self.request.user.tenant, user=self.request.user).filter(is_read=False).count()
    # Matches exactly.

if __name__ == '__main__':
    debug_notifications()
