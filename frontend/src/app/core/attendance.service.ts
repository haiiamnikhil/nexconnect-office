import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface Attendance {
  id?: number;
  employee: number;
  employee_name?: string;
  date: string;
  shift?: number;
  shift_name?: string;
  check_in?: string;
  check_out?: string;
  working_hours?: number;
  overtime_hours?: number;
  status: string;
  is_regularized?: boolean;
  regularization_reason?: string;
}

export interface AttendancePolicy {
  id?: number;
  name: string;
  work_hours_per_day: number;
  grace_period_minutes: number;
  half_day_hours: number;
  allow_overtime: boolean;
  allow_reentry?: boolean;
  is_default: boolean;
  is_active: boolean;
}

export interface Shift {
  id?: number;
  name: string;
  start_time: string;
  end_time: string;
  is_night_shift: boolean;
  is_default: boolean;
  is_active: boolean;
}

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private apiUrl = `${environment.apiUrl}/hrms/attendance-v2`;
  private policyApiUrl = `${environment.apiUrl}/hrms/attendance-policies`;
  private shiftApiUrl = `${environment.apiUrl}/hrms/shifts`;

  constructor(private http: HttpClient) {}

  // Attendance
  getAttendances(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key]) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get(this.apiUrl + '/', { params: httpParams });
  }

  getAttendance(id: number): Observable<Attendance> {
    return this.http.get<Attendance>(`${this.apiUrl}/${id}/`);
  }

  updateAttendance(id: number, data: Partial<Attendance>): Observable<Attendance> {
    return this.http.patch<Attendance>(`${this.apiUrl}/${id}/`, data);
  }

  checkIn(employeeId: number, customTime?: string): Observable<Attendance> {
    const payload = { 
        employee_id: employeeId,
        local_time: customTime || new Date().toISOString()
    };
    return this.http.post<Attendance>(`${this.apiUrl}/check_in/`, payload);
  }

  checkOut(employeeId: number, customTime?: string, date?: string): Observable<Attendance> {
    const payload: any = { 
        employee_id: employeeId,
        local_time: customTime || new Date().toISOString()
    };
    
    // Add date parameter for admin punch-out on specific dates
    if (date) {
      payload.date = date;
    }
    
    return this.http.post<Attendance>(`${this.apiUrl}/check_out/`, payload);
  }


  getMonthlyAttendance(employeeId: number, month: string): Observable<Attendance[]> {
    return this.http.get<Attendance[]>(`${this.apiUrl}/monthly/`, {
      params: { employee_id: employeeId.toString(), month }
    });
  }

  regularizeAttendance(id: number, reason: string): Observable<Attendance> {
    return this.http.post<Attendance>(`${this.apiUrl}/${id}/regularize/`, {
      reason
    });
  }

  // Policies
  getPolicies(): Observable<AttendancePolicy[]> {
    return this.http.get<AttendancePolicy[]>(this.policyApiUrl + '/');
  }

  createPolicy(policy: AttendancePolicy): Observable<AttendancePolicy> {
    return this.http.post<AttendancePolicy>(this.policyApiUrl + '/', policy);
  }

  updatePolicy(id: number, policy: AttendancePolicy): Observable<AttendancePolicy> {
    return this.http.put<AttendancePolicy>(`${this.policyApiUrl}/${id}/`, policy);
  }

  deletePolicy(id: number): Observable<void> {
    return this.http.delete<void>(`${this.policyApiUrl}/${id}/`);
  }

  // Shifts
  getShifts(): Observable<Shift[]> {
    return this.http.get<Shift[]>(this.shiftApiUrl + '/');
  }

  createShift(shift: Shift): Observable<Shift> {
    return this.http.post<Shift>(this.shiftApiUrl + '/', shift);
  }
}
