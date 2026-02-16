import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface LeaveType {
  id?: number;
  name: string;
  code: string;
  default_days_per_year: number;
  is_paid: boolean;
  requires_approval: boolean;
  max_consecutive_days?: number;
  is_active: boolean;
}

export interface LeaveBalance {
  id?: number;
  employee: number;
  employee_name?: string;
  leave_type: number;
  leave_type_name?: string;
  year: number;
  total_allocated: number;
  used: number;
  pending: number;
  available: number;
  carried_forward: number;
}

export interface Leave {
  id?: number;
  employee: number;
  employee_name?: string;
  leave_type: number;
  start_date: string;
  end_date: string;
  number_of_days?: number;
  reason: string;
  status: string;
  approved_by?: number;
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
}

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LeaveService {
  private typeApiUrl = `${environment.apiUrl}/hrms/leave-types`;
  private balanceApiUrl = `${environment.apiUrl}/hrms/leave-balances`;
  private leaveApiUrl = `${environment.apiUrl}/hrms/leave-applications`;

  constructor(private http: HttpClient) {}

  // Leave Types
  getLeaveTypes(): Observable<LeaveType[]> {
    return this.http.get<LeaveType[]>(this.typeApiUrl + '/');
  }

  createLeaveType(type: LeaveType): Observable<LeaveType> {
    return this.http.post<LeaveType>(this.typeApiUrl + '/', type);
  }

  // Leave Balances
  getLeaveBalances(params?: any): Observable<LeaveBalance[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key]) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<LeaveBalance[]>(this.balanceApiUrl + '/', { params: httpParams });
  }

  getEmployeeBalances(employeeId: number, year?: number): Observable<LeaveBalance[]> {
    let params: any = { employee_id: employeeId };
    if (year) {
      params.year = year;
    }
    return this.http.get<LeaveBalance[]>(`${this.balanceApiUrl}/by_employee/`, { params });
  }

  allocateLeaves(payload: { year: number, leave_type_id: number, employment_type: string, days: number }): Observable<any> {
    return this.http.post(`${this.balanceApiUrl}/allocate/`, payload);
  }

  // Leave Applications
  getLeaves(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key]) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get(this.leaveApiUrl + '/', { params: httpParams });
  }

  getLeave(id: number): Observable<Leave> {
    return this.http.get<Leave>(`${this.leaveApiUrl}/${id}/`);
  }

  applyLeave(leave: Leave): Observable<Leave> {
    return this.http.post<Leave>(this.leaveApiUrl + '/', leave);
  }

  approveLeave(id: number): Observable<Leave> {
    return this.http.post<Leave>(`${this.leaveApiUrl}/${id}/approve/`, {});
  }

  rejectLeave(id: number, reason: string): Observable<Leave> {
    return this.http.post<Leave>(`${this.leaveApiUrl}/${id}/reject/`, { reason });
  }

  getPendingApprovals(): Observable<Leave[]> {
    return this.http.get<Leave[]>(`${this.leaveApiUrl}/pending_approvals/`);
  }
}
