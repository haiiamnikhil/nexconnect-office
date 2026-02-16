import os
import django
import sys
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saas_core.settings')
django.setup()

from django.conf import settings
settings.ALLOWED_HOSTS = ['*'] # Allow testserver

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

def test_auth_flow():
    # 1. Get a user
    user = User.objects.filter(is_superuser=True).first()
    if not user:
        print("No superuser found. Creating one...")
        # Try to find any user or create one for test
        email = 'testadmin@example.com'
        user = User.objects.filter(email=email).first()
        if not user:
            from users.models import Tenant
            tenant, _ = Tenant.objects.get_or_create(name='Test Tenant', domain='test.com')
            user = User.objects.create_user(username='testadmin', email=email, password='password123', tenant=tenant, role='SUPER_ADMIN')
        else:
            user.set_password('password123')
            user.save()
        print(f"Using user: {user.username} / password123")
    else:
        # Reset password to known value for test if possible, or try to use a test user
        # safer to create a specific test user
        pass

    # Let's create a dedicated test user to avoid messing with real admins
    try:
        from users.models import Tenant
        tenant, _ = Tenant.objects.get_or_create(name='AuthTestTenant', domain='authtest.com')
        username = 'authtestuser'
        password = 'testpassword123'
        email = 'authtest@example.com'
        
        user = User.objects.filter(username=username).first()
        if not user:
            user = User.objects.create_user(username=username, email=email, password=password, tenant=tenant)
            print(f"Created test user: {username}")
        else:
            user.set_password(password)
            user.save()
            print(f"Reset password for test user: {username}")
            
    except Exception as e:
        print(f"Error preparing user: {e}")
        return

    client = APIClient()

    # 2. Login to get token
    print("\nAttempting Login...")
    login_url = '/api/auth/login/' # Assumption based on standard simplejwt, will check users/urls.py content from viewing
    # Based on previous turn view of users/views/auth_views.py, CustomTokenObtainPairView is used.
    # Typically mapped to 'login/' or 'token/'
    
    # I will first read users/urls.py in the tool execution to be sure of the URL.
    # But for this script I will assume 'api/auth/login/' based on common patterns and saas_core/urls.py include('users.urls')
    # If this fails 404, I'll update.
    
    login_data = {
        'username': username,
        'password': password
    }
    
    response = client.post(login_url, login_data, format='json')
    
    if response.status_code != 200:
        print(f"Login Failed: {response.status_code}")
        print(response.data)
        return

    print("Login Successful")
    tokens = response.data
    access_token = tokens.get('access')
    if not access_token:
        print("No access token found in response")
        print(tokens)
        return
        
    print(f"Got Access Token: {access_token[:20]}...")

    # 3. Request unread_count with token
    print("\nRequesting Notifications...")
    client.credentials(HTTP_AUTHORIZATION='Bearer ' + access_token)
    
    notif_url = '/api/hrms/notifications/unread_count/' 
    response = client.get(notif_url)
    
    print(f"Notification Response Code: {response.status_code}")
    print(f"Data: {response.data}")
    
    if response.status_code == 200:
        print("\nSUCCESS: Backend Auth Flow is working.")
    else:
        print("\nFAILURE: Backend Logic Error even with valid token.")

if __name__ == '__main__':
    test_auth_flow()
