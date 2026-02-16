import os
import django
from django.conf import settings

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saas_core.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework.request import Request
from hrms.views.notification_views import NotificationViewSet
from django.contrib.auth import get_user_model

User = get_user_model()

try:
    user = User.objects.first()
    if not user:
        print("No user found")
        exit()
        
    print(f"Testing view for user: {user.username}")
    
    factory = APIRequestFactory()
    request = factory.get('/api/hrms/notifications/unread_count/')
    force_authenticate(request, user=user)
    
    view = NotificationViewSet.as_view({'get': 'unread_count'})
    response = view(request)
    
    print(f"Status Code: {response.status_code}")
    print(f"Data: {response.data}")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
