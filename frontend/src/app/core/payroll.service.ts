import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
// import { environment } from '../../environments/environment';

export interface SalaryComponent {
  id: number;
  name: string;
  code: string;
  type: 'EARNING' | 'DEDUCTION';
  calculation_type: 'FIXED' | 'PERCENTAGE' | 'FORMULA';
  value: number;
  is_taxable: boolean;
  is_active: boolean;
}

export interface SalaryStructure {
  id: number;
  name: string;
  description: string;
  components: any[];
  is_default: boolean;
}

export interface PayrollRun {
  id: number;
  month: string;
  status: 'DRAFT' | 'PROCESSING' | 'COMPLETED' | 'LOCKED';
  total_net_pay: number;
  processed_at?: string;
}

export interface Payslip {
  id: number;
  payslip_number: string;
  employee_name: string;
  employee_code?: string; // Added from serializer
  basic_salary: number;
  gross_earnings: number;
  total_deductions: number;
  net_pay: number;
  total_days: number;
  working_days: number;
  lop_days: number;
  payment_status: string;
}

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PayrollService {
  private http = inject(HttpClient);
  // private apiUrl = environment.apiUrl + '/hrms/payroll'; 
  // Need to verify if I should use /hrms/ prefix.
  // In urls.py: path('api/hrms/', include('hrms.urls'))
  // Router in hrms/urls.py registers 'salary-components' etc.
  // So full URL: /api/hrms/salary-components/
  private apiUrl = `${environment.apiUrl}/hrms`; // Hardcoded for now matching others

  // Components
  getComponents(): Observable<SalaryComponent[]> {
    return this.http.get<SalaryComponent[]>(`${this.apiUrl}/salary-components/`);
  }

  createComponent(data: any): Observable<SalaryComponent> {
    return this.http.post<SalaryComponent>(`${this.apiUrl}/salary-components/`, data);
  }

  // Structures
  getStructures(): Observable<SalaryStructure[]> {
    return this.http.get<SalaryStructure[]>(`${this.apiUrl}/salary-structures/`);
  }

  createStructure(data: any): Observable<SalaryStructure> {
    return this.http.post<SalaryStructure>(`${this.apiUrl}/salary-structures/`, data);
  }

  // Payroll Runs
  getPayrollRuns(): Observable<PayrollRun[]> {
    return this.http.get<PayrollRun[]>(`${this.apiUrl}/payroll-runs/`);
  }

  runPayroll(month: string): Observable<PayrollRun> {
    return this.http.post<PayrollRun>(`${this.apiUrl}/payroll-runs/process_batch/`, { month });
  }

  // Payslips
  getPayslips(runId?: number, employeeId?: number): Observable<Payslip[]> {
    let params: any = {};
    if (runId) params.payroll_run = runId;
    if (employeeId) params.employee = employeeId;
    return this.http.get<Payslip[]>(`${this.apiUrl}/payslips/`, { params });
  }
}
