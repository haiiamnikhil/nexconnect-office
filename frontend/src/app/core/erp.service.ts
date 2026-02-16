import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ErpService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/erp`;

  getProjects(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/projects/`);
  }

  getTasks(projectId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tasks/?project=${projectId}`);
  }

  getInventory(): Observable<any[]> {
      return this.http.get<any[]>(`${this.apiUrl}/inventory/`);
  }

  addStock(data: any): Observable<any> {
      return this.http.post(`${this.apiUrl}/stock/`, data);
  }
}
