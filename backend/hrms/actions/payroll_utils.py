from decimal import Decimal
from datetime import date
from django.db.models import Sum
from django.conf import settings
from hrms.models import (
    Employee, SalaryStructure, EmployeeSalary, PayrollRun, 
    Payslip, PayslipComponent, SalaryComponent, Attendance, 
    TaxDeclaration
)

class PayrollService:
    """
    Core engine for Payroll Calculations
    """
    def __init__(self, tenant):
        self.tenant = tenant

    def calculate_tax(self, taxable_income, regime='NEW', age=30):
        """
        Calculate Income Tax based on Indian Tax Slabs (FY 2025-26 assumption)
        """
        tax = Decimal('0.00')
        income = Decimal(taxable_income)
        
        if regime == 'NEW':
            # Simplified New Regime Slabs (Example)
            # 0-3L: Nil
            # 3-6L: 5%
            # 6-9L: 10%
            # 9-12L: 15%
            # 12-15L: 20%
            # >15L: 30%
            
            standard_deduction = Decimal('75000.00') # Budget 2025 proposal assumption
            income = max(0, income - standard_deduction)

            if income <= 300000:
                return Decimal('0.00')
            
            # 3L - 6L
            slab_income = min(income, 600000) - 300000
            if slab_income > 0:
                tax += slab_income * Decimal('0.05')
            
            # 6L - 9L
            if income > 600000:
                slab_income = min(income, 900000) - 600000
                tax += slab_income * Decimal('0.10')
            
            # 9L - 12L
            if income > 900000:
                slab_income = min(income, 1200000) - 900000
                tax += slab_income * Decimal('0.15')

            # 12L - 15L
            if income > 1200000:
                slab_income = min(income, 1500000) - 1200000
                tax += slab_income * Decimal('0.20')
            
            # > 15L
            if income > 1500000:
                slab_income = income - 1500000
                tax += slab_income * Decimal('0.30')
                
        else:
            # Old Regime (Complex, requires deductions 80C, etc.)
            # For MVP, we use flat 20% after exemptions if not implemented fully
            pass
            
        # Add Cess (4%)
        cess = tax * Decimal('0.04')
        return tax + cess

    def process_payroll(self, month_date, processed_by, dry_run=False):
        """
        Process payroll for all active employees for a given month.
        If dry_run=True, returns the calculated data without saving to DB.
        """
        # Create Run Record or Mock
        if not dry_run:
            run, created = PayrollRun.objects.get_or_create(
                tenant=self.tenant,
                month=month_date,
                defaults={'status': 'PROCESSING', 'processed_by': processed_by}
            )
        else:
            run = None # No DB record
        
        employees = Employee.objects.filter(tenant=self.tenant, is_active=True)
        total_payout = Decimal('0.00')
        estimated_records = []
        
        for emp in employees:
            if not hasattr(emp, 'salary_details'):
                continue
                
            salary_details = emp.salary_details
            structure = salary_details.structure
            base_salary = salary_details.base_salary # Monthly CTC basis usually or Basic
            
            # 1. Calculate Working Days
            # In real system, query Attendance model
            # For now, assume 30 days unless LOP logic is added
            total_days = 30
            # TODO: Real LOP calculation from Attendance
            lop_days = 0 
            working_days = total_days - lop_days
            
            # Prorata factor
            prorata = Decimal(working_days) / Decimal(total_days)
            
            # 2. Calculate Components
            gross_earnings = Decimal('0.00')
            total_deductions = Decimal('0.00')
            line_items = []
            
            # Fetch components from structure
            # Simplification: Assume 'base_salary' is Basic, others are derived.
            
            # Basic (Earning)
            basic_val = base_salary * prorata
            gross_earnings += basic_val
            line_items.append({
                'name': 'Basic Salary', 
                'code': 'BASIC', 
                'type': 'EARNING', 
                'amount': float(basic_val)
            })
            
            # HRA (40% of Basic usually)
            hra_val = basic_val * Decimal('0.40')
            gross_earnings += hra_val
            line_items.append({'name': 'HRA', 'code': 'HRA', 'type': 'EARNING', 'amount': float(hra_val)})
            
            # PF (Deduction) - 12% of Basic
            pf_val = basic_val * Decimal('0.12')
            total_deductions += pf_val
            line_items.append({'name': 'Provident Fund', 'code': 'PF', 'type': 'DEDUCTION', 'amount': float(pf_val)})
            
            # Professional Tax (Fixed 200)
            pt_val = Decimal('200.00')
            total_deductions += pt_val
            line_items.append({'name': 'Professional Tax', 'code': 'PT', 'type': 'DEDUCTION', 'amount': float(pt_val)})
            
            # TDS (Income Tax)
            annual_income = gross_earnings * 12
            annual_tax = self.calculate_tax(annual_income)
            monthly_tds = annual_tax / 12
            
            total_deductions += monthly_tds
            line_items.append({'name': 'TDS (Income Tax)', 'code': 'TDS', 'type': 'DEDUCTION', 'amount': float(monthly_tds)})
            
            # Net Pay
            net_pay = gross_earnings - total_deductions
            total_payout += net_pay
            
            if dry_run:
                estimated_records.append({
                    'employee_name': f"{emp.first_name} {emp.last_name}",
                    'employee_code': emp.employee_code,
                    'gross_earnings': float(gross_earnings),
                    'total_deductions': float(total_deductions),
                    'net_pay': float(net_pay),
                    'working_days': working_days,
                    'lop_days': lop_days
                })
                continue
            
            # Create Payslip (DB)
            payslip, _ = Payslip.objects.update_or_create(
                payroll_run=run,
                employee=emp,
                tenant=self.tenant,
                defaults={
                    'payslip_number': f"PS-{month_date.strftime('%Y%m')}-{emp.employee_code}",
                    'basic_salary': basic_val,
                    'gross_earnings': gross_earnings,
                    'total_deductions': total_deductions,
                    'net_pay': net_pay,
                    'working_days': working_days,
                    'lop_days': lop_days
                }
            )
            
            # Create Components
            payslip.line_items.all().delete() # Reset
            for item in line_items:
                PayslipComponent.objects.create(
                    payslip=payslip,
                    name=item['name'],
                    code=item['code'],
                    type=item['type'],
                    amount=item['amount']
                )
            
            # Notify Employee
            from hrms.actions.notification_utils import notify_payslip_generated
            notify_payslip_generated(payslip)
            
        if dry_run:
            return {
                'month': month_date.strftime('%Y-%m'),
                'total_employees': employees.count(),
                'total_payout': float(total_payout),
                'details': estimated_records
            }

        run.total_net_pay = total_payout
        run.status = 'COMPLETED'
        run.save()
        
        return run
