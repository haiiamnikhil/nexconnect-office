from decimal import Decimal
from django.utils import timezone
from hrms.models import LeaveType, LeaveBalance, Employee

class LeaveAccrualService:
    """
    Service to manage leave accruals (Monthly/Yearly)
    """
    def __init__(self, tenant):
        self.tenant = tenant

    def run_monthly_accrual(self):
        """
        Credit monthly leave balance to all eligible employees
        """
        current_year = timezone.now().year
        employees = Employee.objects.filter(tenant=self.tenant, is_active=True)
        leave_types = LeaveType.objects.filter(tenant=self.tenant, is_active=True)
        
        results = {'processed': 0, 'updated': 0}
        
        for emp in employees:
            results['processed'] += 1
            for lt in leave_types:
                # Simple logic: Pro-rated monthly credit
                # If 12 days/year -> 1 day/month
                if lt.default_days_per_year > 0:
                    credit_amount = Decimal(lt.default_days_per_year) / Decimal('12.0')
                    
                    balance, created = LeaveBalance.objects.get_or_create(
                        employee=emp,
                        leave_type=lt,
                        year=current_year,
                        defaults={
                            'total_allocated': 0,
                            'available': 0
                        }
                    )
                    
                    # Add credit
                    balance.total_allocated += credit_amount
                    balance.save() # save() triggers available calculation
                    
                    results['updated'] += 1
        
        return results
