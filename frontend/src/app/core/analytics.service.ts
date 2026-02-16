import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface HeadcountStats {
  total_active: number;
  trends: { month: string; joined: number }[];
}

export interface AttritionStats {
  total_exits_ytd: number;
  attrition_rate: number;
}

export interface AttendanceStats {
  avg_daily_hours: number;
  present_today: number;
}

export interface PayrollStats {
  trends: { month: string; cost: number }[];
}

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/hrms/analytics`;

  getHeadcountStats(): Observable<HeadcountStats> {
    return this.http.get<HeadcountStats>(`${this.apiUrl}/headcount/`);
  }

  getAttritionStats(): Observable<AttritionStats> {
    return this.http.get<AttritionStats>(`${this.apiUrl}/attrition/`);
  }

  getAttendanceStats(): Observable<AttendanceStats> {
    return this.http.get<AttendanceStats>(`${this.apiUrl}/attendance/`);
  }

  getPayrollStats(): Observable<PayrollStats> {
    return this.http.get<PayrollStats>(`${this.apiUrl}/payroll/`);
  }
}
