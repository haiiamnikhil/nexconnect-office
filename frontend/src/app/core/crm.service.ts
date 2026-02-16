import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CrmService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/crm`;

  getClients(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/clients/`);
  }

  getLeads(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/leads/`);
  }

  updateLead(id: number, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/leads/${id}/`, data);
  }

  createLead(data: any): Observable<any> {
      return this.http.post(`${this.apiUrl}/leads/`, data);
  }
}
