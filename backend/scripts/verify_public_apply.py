import os
import django
import sys
import random

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saas_core.settings')
django.setup()

from hrms.models import JobPosting, Candidate, JobApplication
from users.models import User, Tenant
from django.test import RequestFactory
from hrms.views.recruitment_views import JobApplicationViewSet

def verify_public_apply():
    print("--- Verifying Public Job Application ---")
    
    # 1. Setup Data
    user = User.objects.filter(is_superuser=True).first()
    if not user:
        print("No superuser found.")
        return
    tenant = user.tenant
    
    job, _ = JobPosting.objects.get_or_create(
        title="Frontend Developer",
        tenant=tenant,
        defaults={'description': 'React', 'requirements': 'JS', 'posted_by': user, 'status': 'OPEN'}
    )
    
    email = f"applicant.{random.randint(1000,9999)}@test.com"
    
    # 2. Simulate Request
    factory = RequestFactory()
    data = {
        'job_id': job.id,
        'first_name': 'Jane',
        'last_name': 'Doe',
        'email': email,
        'phone': '1234567890'
    }
    
    request = factory.post('/api/hrms/applications/public_apply/', data=data)
    request.data = data # DRF expects .data, Factory gives WSGI request without it
    request.query_params = {} # DRF also expects query_params
    
    # Call View Method
    view = JobApplicationViewSet()
    view.action_map = {'post': 'public_apply'}
    view.request = request
    # Since it's public (AllowAny), we don't need to force auth, but ViewSet structure might need setup
    view.format_kwarg = None
    
    response = view.public_apply(request)
    
    print(f"Response: {response.status_code} - {response.data}")
    
    # 3. Verify DB
    if response.status_code == 201:
        if JobApplication.objects.filter(candidate__email=email, job=job).exists():
            print(f"Success! Application created for {email}")
        else:
            print("Failed: DB record not found")
    else:
        print("Failed: API returned error")

if __name__ == '__main__':
    try:
        verify_public_apply()
    except Exception as e:
        print(f"Error: {e}")
