import os
import django
import sys
from pathlib import Path

# Add project root to path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saas_core.settings')
django.setup()

from hrms.models import Notification
from users.models import User

def seed_notifications():
    print("Seeding test notifications...")
    
    # Get first user (usually admin)
    user = User.objects.first()
    if not user:
        print("No users found!")
        return

    print(f"Creating notification for user: {user.email}")
    
    Notification.objects.create(
        tenant=user.tenant,
        user=user,
        notification_type='INFO',
        title='Test Notification',
        message='This is a test notification to verify the real-time system.',
        is_read=False
    )
    
    Notification.objects.create(
        tenant=user.tenant,
        user=user,
        notification_type='SUCCESS',
        title='System Online',
        message='Notification system is fully operational.',
        is_read=False
    )
    
    print("Done! Notifications created.")

if __name__ == '__main__':
    seed_notifications()
