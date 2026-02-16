from django.db import transaction
from django.utils import timezone
from hrms.models import Employee, User, JobApplication

def create_employee_from_candidate(application: JobApplication):
    """
    Creates a new Employee record from a Hired Job Application.
    Also creates a User account for them.
    """
    candidate = application.candidate
    job = application.job
    tenant = application.tenant
    
    # 1. Create User
    # Generate simple username: first_name.last_name
    base_username = f"{candidate.first_name.lower()}.{candidate.last_name.lower()}"
    username = base_username
    counter = 1
    while User.objects.filter(username=username).exists():
        username = f"{base_username}{counter}"
        counter += 1
        
    password = f"{candidate.first_name.capitalize()}@123" # Default password pattern
    
    with transaction.atomic():
        user = User.objects.create_user(
            username=username,
            email=candidate.email,
            password=password,
            first_name=candidate.first_name,
            last_name=candidate.last_name,
            tenant=tenant,
            role='EMPLOYEE' # Default role
        )
        
        # 2. Designation is a CharField in Employee, so we use the Job Title
        # We can also create a Designation model entry for master data if needed, but for Employee record it's a string
        
        # 3. Create Employee Profile
        employee = Employee.objects.create(
            user=user,
            tenant=tenant,
            first_name=candidate.first_name,
            last_name=candidate.last_name,
            personal_email=candidate.email,
            department=job.department, 
            designation=job.title, # Use Job Title as designation
            joining_date=timezone.now().date(),
            employee_code=f"EMP-{user.id}", # Placeholder code
            salary=0.00 # Default salary (required field)
        )
        
        return employee
