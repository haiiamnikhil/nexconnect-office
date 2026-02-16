import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OnboardingTask {
  id: number;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  due_date: string;
  employee_name: string;
  assigned_by: number;
}

export interface ExitClearance {
  id: number;
  department: 'IT' | 'FINANCE' | 'ADMIN' | 'MANAGER';
  status: 'PENDING' | 'CLEARED' | 'REJECTED';
  remarks: string;
  cleared_by_name: string;
  cleared_at: string;
}

export interface OffboardingRequest {
  id: number;
  employee: number;
  employee_name: string;
  resignation_date: string;
  last_working_day: string;
  reason: string;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  clearances: ExitClearance[];
}

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LifecycleService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/hrms/lifecycle`;

  getOnboardingTasks(myTasks: boolean = false): Observable<OnboardingTask[]> {
    const params: any = {};
    if (myTasks) params.my_tasks = 'true';
    return this.http.get<OnboardingTask[]>(`${this.apiUrl}/onboarding/`, { params });
  }

  createOnboardingTask(data: any): Observable<OnboardingTask> {
    return this.http.post<OnboardingTask>(`${this.apiUrl}/onboarding/`, data);
  }

  updateTaskStatus(id: number, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/onboarding/${id}/`, { status });
  }

  // Offboarding
  getOffboardingRequests(): Observable<OffboardingRequest[]> {
    return this.http.get<OffboardingRequest[]>(`${this.apiUrl}/offboarding/`);
  }

  submitResignation(data: any): Observable<OffboardingRequest> {
    return this.http.post<OffboardingRequest>(`${this.apiUrl}/offboarding/`, data);
  }

  approveOffboarding(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/offboarding/${id}/approve/`, {});
  }

  // Clearances
  updateClearance(id: number, data: { status: string, remarks: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/clearances/${id}/clear/`, data);
  }
}
