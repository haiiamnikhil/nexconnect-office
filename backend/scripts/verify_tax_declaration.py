import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "saas_core.settings")
django.setup()

from django.contrib.auth import get_user_model
from hrms.models import Employee, TaxDeclaration, Tenant

User = get_user_model()

def verify_tax_declaration():
    print("--- Verifying Tax Declaration Workflow ---")
    
    # 1. Setup Data
    email = "tax.test@test.com"
    user, created = User.objects.get_or_create(email=email, defaults={'username': 'tax.test', 'role': 'Employee'})
    if created:
        user.set_password("password")
        user.save()
        print(f"Created User: {user.email}")
        
    tenant, _ = Tenant.objects.get_or_create(name="Test Tenant", domain="test_tax.com")
    user.tenant = tenant
    user.save()

    emp, _ = Employee.objects.get_or_create(user=user, defaults={
        'first_name': 'Tax', 'last_name': 'Payer', 
        'employee_code': 'TAX001', 'designation': 'Software Engineer', 
        'tenant': tenant, 'date_of_joining': '2024-01-01',
        'joining_date': '2024-01-01', 'salary': 50000
    })
    
    # 2. Create Declaration (Draft)
    decl = TaxDeclaration.objects.create(
        employee=emp,
        tenant=tenant,
        financial_year='2025-2026',
        regime='NEW',
        section='80C',
        declared_amount=150000,
        status='PENDING'
    )
    print(f"Created Declaration: {decl.id} (Status: {decl.status})")
    
    # 3. Submit
    from rest_framework.test import APIRequestFactory, force_authenticate
    from hrms.views.tax_declaration_views import TaxDeclarationViewSet
    
    factory = APIRequestFactory()
    view = TaxDeclarationViewSet.as_view({'post': 'submit'})
    
    req = factory.post(f'/api/hrms/tax-declarations/{decl.id}/submit/')
    force_authenticate(req, user=user)
    resp = view(req, pk=decl.id)
    
    decl.refresh_from_db()
    print(f"Submit Action: {resp.status_code} - Status: {decl.status}")
    if decl.status != 'SUBMITTED':
        print("FAILED: Status did not change to SUBMITTED")
        return

    # 4. Admin Approve
    admin_user, _ = User.objects.get_or_create(email="admin.tax@test.com", defaults={'username': 'admin.tax', 'role': 'Admin', 'is_staff': True})
    admin_user.tenant = tenant
    admin_user.save()
    
    view_approve = TaxDeclarationViewSet.as_view({'post': 'approve'})
    req_approve = factory.post(f'/api/hrms/tax-declarations/{decl.id}/approve/', {'verified_amount': 100000, 'remarks': 'Verified partially'})
    force_authenticate(req_approve, user=admin_user)
    
    resp_approve = view_approve(req_approve, pk=decl.id)
    decl.refresh_from_db()
    
    print(f"Approve Action: {resp_approve.status_code} - Status: {decl.status}, Verified: {decl.verified_amount}")
    
    if decl.status == 'APPROVED' and decl.verified_amount == 100000:
        print("SUCCESS: Declaration workflow verified!")
    else:
        print("FAILED: Verification mismatch")

if __name__ == "__main__":
    verify_tax_declaration()
