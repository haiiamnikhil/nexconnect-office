from django.core.management.base import BaseCommand
from users.models import Tenant, User
from hrms.models import (
    Department, Designation, Location, Employee, 
    Attendance, LeaveBalance, Leave,
    PayrollRun, Payslip, SalaryStructure, SalaryComponent,
    Goal, Review, AppraisalCycle,
    JobPosting, Candidate, JobApplication, Interview,
    Ticket, Notification, CompanyDocument, DocumentCategory,
    Asset, AssetCategory, AssetAllocation
)

class Command(BaseCommand):
    help = 'Clears dummy data from the database, preserving the Admin user and Demo Tenant'

    def handle(self, *args, **kwargs):
        self.stdout.write('Clearing dummy data...')

        # 1. Clear Transactional Data (Order matters for foreign keys)
        self.stdout.write('Deleting Attendance records...')
        Attendance.objects.all().delete()
        
        self.stdout.write('Deleting Leave records...')
        Leave.objects.all().delete()
        LeaveBalance.objects.all().delete()
        
        self.stdout.write('Deleting Payroll records...')
        Payslip.objects.all().delete()
        PayrollRun.objects.all().delete()
        
        self.stdout.write('Deleting Performance records...')
        Review.objects.all().delete()
        Goal.objects.all().delete()
        
        self.stdout.write('Deleting Recruitment records...')
        Interview.objects.all().delete()
        JobApplication.objects.all().delete()
        Candidate.objects.all().delete()
        JobPosting.objects.all().delete()
        
        self.stdout.write('Deleting Helpdesk & Notifications...')
        Ticket.objects.all().delete()
        Notification.objects.all().delete()
        
        self.stdout.write('Deleting Documents & Assets...')
        CompanyDocument.objects.all().delete()
        DocumentCategory.objects.all().delete()
        AssetAllocation.objects.all().delete()
        Asset.objects.all().delete()
        AssetCategory.objects.all().delete()

        # 2. Delete Employees
        self.stdout.write('Deleting Employees...')
        # Keep employees linked to admin/superuser if any? 
        # Usually admin doesn't have an employee profile in seed data, but if they do, we might want to keep it?
        # For now, delete ALL employees to be safe and clean.
        Employee.objects.all().delete()

        # 3. Can't easily delete Departments/Designations/Locations/SalaryStructures if we want to keep configuration
        # But user said "Delete ALL dummy data". These were created by seed_data. 
        # So we should delete them.
        self.stdout.write('Deleting Organization Structure...')
        SalaryStructure.objects.all().delete()
        SalaryComponent.objects.all().delete()
        Location.objects.all().delete()
        Designation.objects.all().delete()
        Department.objects.all().delete()

        # 4. Delete Users (Except Admin/Superuser)
        self.stdout.write('Deleting Users (creating clean slate)...')
        # identifying dummy users by email domain or excluding specific usernames
        # seed_data created users with @demo.com
        # admin is admin@demo.com
        
        # We want to keep 'admin'
        User.objects.exclude(username='admin').exclude(is_superuser=True).delete()
        
        self.stdout.write(self.style.SUCCESS('Successfully cleared dummy data. Admin user and Tenant preserved.'))
