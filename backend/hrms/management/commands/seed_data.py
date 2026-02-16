from django.core.management.base import BaseCommand
from django.utils import timezone
from users.models import Tenant, User
from hrms.models import (
    Department, Designation, Location, Employee, 
    Attendance, LeaveBalance, Leave,
    PayrollRun, Payslip, SalaryStructure,
    Goal, Review, AppraisalCycle,
    JobPosting, Candidate, JobApplication,
    Ticket, Notification, CompanyDocument, DocumentCategory
)
from faker import Faker
import random
from datetime import timedelta

class Command(BaseCommand):
    help = 'Seeds the database with dummy data for HRMS'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding data...')
        fake = Faker()
        
        # 1. Tenant
        tenant, _ = Tenant.objects.get_or_create(name="Demo Corp", domain="demo")
        
        # 2. Users (Admin)
        admin_user, _ = User.objects.get_or_create(
            username='admin', 
            defaults={
                'email': 'admin@demo.com', 
                'role': 'Admin', 
                'tenant': tenant
            }
        )
        admin_user.set_password('admin123')
        admin_user.save()

        # 3. Org Structure
        departments = []
        for dept_name in ['Engineering', 'HR', 'Sales', 'Finance']:
            d, _ = Department.objects.get_or_create(name=dept_name, tenant=tenant)
            departments.append(d)

        designations = []
        for desig_name in ['Manager', 'Team Lead', 'Senior Associate', 'Junior Associate']:
            d, _ = Designation.objects.get_or_create(title=desig_name, tenant=tenant)
            designations.append(d)
            
        locations = []
        loc_data = [
            ('New York', 'NYC', '10001'), 
            ('London', 'LDN', 'SW1A'), 
            ('Remote', 'REM', '00000')
        ]
        
        for name, code, pincode in loc_data:
            l, _ = Location.objects.get_or_create(
                tenant=tenant, code=code,
                defaults={
                    'name': name,
                    'address': f"123 {name} Street",
                    'city': name,
                    'state': name,
                    'country': 'USA' if name == 'New York' else 'UK' if name == 'London' else 'Global',
                    'pincode': pincode
                }
            )
            locations.append(l)

        # 4. Employees
        employees = []
        for i in range(20):
            first_name = fake.first_name()
            last_name = fake.last_name()
            username = f"{first_name.lower()}.{last_name.lower()}{random.randint(1000,9999)}"
            email = f"{username}@demo.com"
            
            user, created = User.objects.get_or_create(
                username=username,
                defaults={'email': email, 'role': 'Employee', 'tenant': tenant}
            )
            if created:
                user.set_password('password123')
                user.save()

            dept = random.choice(departments)
            desig = random.choice(designations)
            
            # Ensure unique employee code
            emp_code = f"EMP{random.randint(10000, 99999)}"
            while Employee.objects.filter(tenant=tenant, employee_code=emp_code).exists():
                 emp_code = f"EMP{random.randint(10000, 99999)}"
            
            emp, _ = Employee.objects.get_or_create(
                user=user,
                defaults={
                    'tenant': tenant,
                    'employee_code': emp_code,
                    'first_name': first_name,
                    'last_name': last_name,
                    'department': dept,
                    'designation': desig.title,
                    'personal_email': email,
                    'joining_date': timezone.now().date() - timedelta(days=random.randint(30, 1000)),
                    'date_of_joining': timezone.now().date() - timedelta(days=random.randint(30, 1000)),
                    'salary': random.randint(50000, 150000)
                }
            )
            employees.append(emp)

        # 5. Leaves & Balances
        from hrms.models import LeaveType
        leave_types_objs = []
        leave_types = [('Sick Leave', 'SL'), ('Casual Leave', 'CL'), ('Earned Leave', 'EL')]
        
        for name, code in leave_types:
            lt, _ = LeaveType.objects.get_or_create(
                tenant=tenant, code=code,
                defaults={'name': name, 'default_days_per_year': 12}
            )
            leave_types_objs.append(lt)

        for emp in employees:
            for lt in leave_types_objs:
                LeaveBalance.objects.get_or_create(
                    employee=emp, leave_type=lt, year=2025,
                    defaults={'total_allocated': 12, 'available': 12}
                )
            
            # Create some leave applications
            if random.choice([True, False]):
                Leave.objects.create(
                    employee=emp, leave_type=random.choice(leave_types_objs),
                    start_date=timezone.now().date() - timedelta(days=random.randint(1, 30)),
                    end_date=timezone.now().date() - timedelta(days=random.randint(1, 28)),
                    reason="Not feeling well", 
                    status=random.choice(['APPROVED', 'PENDING', 'REJECTED']),
                    tenant=tenant,
                    number_of_days=1 
                )

        # 6. Attendance (Last 7 days)
        for i in range(7):
            date = timezone.now().date() - timedelta(days=i)
            for emp in employees:
                if date.weekday() < 5: # Weekdays only
                    status_type = 'PRESENT'
                    check_in = timezone.now().replace(hour=9, minute=0, second=0)
                    check_out = timezone.now().replace(hour=18, minute=0, second=0)
                    
                    if random.random() < 0.1:
                        status_type = 'ABSENT'
                        check_in = None
                        check_out = None
                    elif random.random() < 0.2:
                        # Late/Early
                        check_in = timezone.now().replace(hour=10, minute=random.randint(0, 30))
                        
                    if status_type == 'PRESENT':
                        Attendance.objects.create(
                            employee=emp, date=date, status=status_type,
                            check_in=check_in, check_out=check_out, tenant=tenant
                        )

        # 7. Recruitment
        job, _ = JobPosting.objects.get_or_create(
            title="Software Engineer", department=departments[0],
            defaults={'tenant': tenant, 'description': "We need a dev.", 'status': 'OPEN'}
        )
        
        for _ in range(5):
            cand = Candidate.objects.create(
                first_name=fake.first_name(), last_name=fake.last_name(),
                email=fake.email(), phone=fake.phone_number()[:20], tenant=tenant
            )
            JobApplication.objects.create(
                job=job, candidate=cand, current_stage=random.choice(['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFERED']),
                tenant=tenant
            )

        # 8. Helpdesk
        for _ in range(10):
            Ticket.objects.create(
                requester=random.choice(employees).user,
                title=fake.sentence(nb_words=6),
                description=fake.paragraph(),
                priority=random.choice(['LOW', 'MEDIUM', 'HIGH']),
                status=random.choice(['OPEN', 'IN_PROGRESS', 'RESOLVED']),
                category=random.choice(['IT', 'HR']),
                tenant=tenant
            )

        # 9. Notifications
        for _ in range(5):
            Notification.objects.create(
                user=admin_user, tenant=tenant,
                title="System Alert", message=fake.sentence(),
                notification_type=random.choice(['INFO', 'WARNING'])
            )

        # 10. DMS
        cat, _ = DocumentCategory.objects.get_or_create(name="Policies", tenant=tenant)
        CompanyDocument.objects.create(
            title="Employee Handbook", category=cat,
            description="Official handbook", visibility='ALL',
            document_file="company_docs/handbook.pdf", # Mock path
            tenant=tenant, uploaded_by=admin_user
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded dummy data'))
