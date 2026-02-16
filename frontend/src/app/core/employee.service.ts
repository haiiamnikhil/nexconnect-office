import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';


export interface Education {
  id?: number;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date?: string;
  grade?: string;
  document?: number;
  document_details?: EmployeeDocument;
}

export interface Experience {
  id?: number;
  company_name: string;
  designation: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  description?: string;
  document?: number;
  document_details?: EmployeeDocument;
}

export interface BGVCheck {
  id?: number;
  check_type: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'VERIFIED' | 'FAILED' | 'DISCREPANCY';
  agency_name?: string;
  reference_number?: string;
  remarks?: string;
  verification_date?: string;
}

export interface Employee {
  id?: number;
  user?: number;
  employee_code: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  personal_email: string;
  mobile_number: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  blood_group?: string;
  
  // Employment
  department?: number;
  designation?: string;
  reporting_manager?: number;
  joining_date?: string; // Mandatory in backend
  employee_status?: string;
  employment_type?: string;
  department_name?: string;
  
  // Address
  current_address?: string;
  permanent_address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  
  // Bank & Statutory
  pan_number?: string;
  aadhaar_number?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  
  // Salary
  salary?: number; // Mandatory in backend
  hra?: number;
  other_allowances?: number;
  
  is_active?: boolean;
  user_role?: number;
  temp_password?: string; // Initial password (only visible to superuser)
  
  // Nested Details
  education?: Education[];
  experience?: Experience[];
  bgv_checks?: BGVCheck[];
}

export interface EmployeeDocument {
  id?: number;
  employee: number;
  document_type: string;
  document_name: string;
  document_file: File | string;
  file_url?: string;
  file_size?: number;
  uploaded_at?: string;
}

export interface EmployeeSkill {
  id?: number;
  employee: number;
  skill_name: string;
  proficiency: string;
  years_of_experience: number;
  certification_name?: string;
  certification_authority?: string;
  certification_date?: string;
}

export interface UserActivity {
  id: number;
  user: number;
  action: string;
  module: string;
  description: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = `${environment.apiUrl}/hrms/employees-v2`;
  private docApiUrl = `${environment.apiUrl}/hrms/employee-documents`;
  private skillApiUrl = `${environment.apiUrl}/hrms/employee-skills`;
  private activityApiUrl = `${environment.apiUrl}/auth/activities`;

  constructor(private http: HttpClient) {}
  


// ... (existing imports)

  // Activities
  getActivities(userId: number): Observable<UserActivity[]> {
    return this.http.get<any>(this.activityApiUrl + '/', {
      params: { user_id: userId.toString() }
    }).pipe(
      map(response => {
        if (Array.isArray(response)) return response;
        return response.results || [];
      })
    );
  }

  // Employee CRUD
  getEmployees(params?: any): Observable<any> {
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

  getEmployee(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/${id}/`);
  }

  getCurrentEmployee(): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/me/`);
  }

  createEmployee(employee: Employee): Observable<Employee> {
    return this.http.post<Employee>(this.apiUrl + '/', employee);
  }

  updateEmployee(id: number, employee: Partial<Employee>): Observable<Employee> {
    return this.http.patch<Employee>(`${this.apiUrl}/${id}/`, employee);
  }

  deleteEmployee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/`);
  }

  // Advanced queries
  searchEmployees(query: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/search/`, { params: { q: query } });
  }

  getEmployeeStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats/`);
  }

  getReportees(id: number): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.apiUrl}/${id}/reportees/`);
  }

  // Documents
  getDocuments(employeeId: number): Observable<EmployeeDocument[]> {
    return this.http.get<EmployeeDocument[]>(this.docApiUrl + '/', {
      params: { employee: employeeId.toString() }
    });
  }

  uploadDocument(document: FormData): Observable<EmployeeDocument> {
    return this.http.post<EmployeeDocument>(this.docApiUrl + '/', document);
  }

  deleteDocument(id: number): Observable<void> {
    return this.http.delete<void>(`${this.docApiUrl}/${id}/`);
  }

  // Roles
  getRoles(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/hrms/roles/`);
  }

  // Skills
  getSkills(employeeId: number): Observable<EmployeeSkill[]> {
    return this.http.get<EmployeeSkill[]>(this.skillApiUrl + '/', {
      params: { employee: employeeId.toString() }
    });
  }

  createSkill(skill: EmployeeSkill): Observable<EmployeeSkill> {
    return this.http.post<EmployeeSkill>(this.skillApiUrl + '/', skill);
  }

  updateSkill(id: number, skill: Partial<EmployeeSkill>): Observable<EmployeeSkill> {
    return this.http.patch<EmployeeSkill>(`${this.skillApiUrl}/${id}/`, skill);
  }

  deleteSkill(id: number): Observable<void> {
    return this.http.delete<void>(`${this.skillApiUrl}/${id}/`);
  }

  // Profile-specific methods
  getEmployeeById(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/${id}/`);
  }

  getUserStats(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}/user_stats/`);
  }

  uploadAvatar(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('avatar', file);
    return this.http.post(`${this.apiUrl}/${id}/upload_avatar/`, formData);
  }
}
