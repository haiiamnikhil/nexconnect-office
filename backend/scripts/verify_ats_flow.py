import os
import django
import sys
import random

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saas_core.settings')
django.setup()

from hrms.models import JobPosting, Candidate, JobApplication, Employee
from users.models import User, Tenant

def verify_ats():
    print("--- Verifying ATS Hire Flow ---")
    
    # 1. Setup Data
    user = User.objects.filter(is_superuser=True).first()
    if not user:
        print("No superuser found.")
        return
        
    tenant = user.tenant
    
    # Create Job
    job, _ = JobPosting.objects.get_or_create(
        title="Test Developer",
        tenant=tenant,
        defaults={'description': 'Test', 'requirements': 'Python', 'posted_by': user}
    )
    print(f"Job: {job.title}")

    # Create Candidate
    email = f"candidate.{random.randint(1000,9999)}@test.com"
    candidate = Candidate.objects.create(
        first_name="John",
        last_name="Doe",
        email=email,
        tenant=tenant
    )
    print(f"Candidate: {candidate.email}")

    # Create Application
    app = JobApplication.objects.create(
        job=job,
        candidate=candidate,
        tenant=tenant,
        current_stage='INTERVIEW'
    )
    
    # 2. Trigger Workflow (Simulate View Logic)
    print("Changing stage to HIRED...")
    
    # Mimic the logic added to view
    from hrms.actions.recruitment_workflow import create_employee_from_candidate
    app.current_stage = 'HIRED'
    app.save()
    
    emp = create_employee_from_candidate(app)
    
    # 3. Verify
    if Employee.objects.filter(personal_email=email).exists():
        new_emp = Employee.objects.get(personal_email=email)
        print(f"Success! Employee created: {new_emp.first_name} {new_emp.last_name}")
        print(f"   User: {new_emp.user.username} / Role: {new_emp.user.role}")
    else:
        print("Failed: Employee not found.")

if __name__ == '__main__':
    try:
        verify_ats()
    except Exception as e:
        print(f"Error: {e}")
