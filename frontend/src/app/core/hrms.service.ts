import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HrmsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/hrms`;

  getEmployees(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/employees/`);
  }

  getDepartments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/departments/`);
  }

  getLeaves(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/leaves/`);
  }

  requestLeave(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/leaves/`, data);
  }
}
