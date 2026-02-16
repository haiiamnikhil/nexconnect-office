import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TicketComment {
  id: number;
  user_name: string;
  text: string;
  created_at: string;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  category: 'IT' | 'HR' | 'FINANCE' | 'ADMIN';
  requester_name: string;
  assigned_to_name: string;
  created_at: string;
  comments: TicketComment[];
}

export type Comment = TicketComment;

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HelpdeskService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/hrms/helpdesk`;

  getTickets(myTickets: boolean = false): Observable<Ticket[]> {
    const params: any = {};
    if (myTickets) params.my_tickets = 'true';
    return this.http.get<Ticket[]>(`${this.apiUrl}/tickets/`, { params });
  }

  getTicket(id: number): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.apiUrl}/tickets/${id}/`);
  }

  createTicket(data: any): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.apiUrl}/tickets/`, data);
  }

  addComment(id: number, text: string): Observable<TicketComment> {
    return this.http.post<TicketComment>(`${this.apiUrl}/tickets/${id}/add_comment/`, { text });
  }

  updateTicketStatus(id: number, status: string): Observable<Ticket> {
    return this.http.patch<Ticket>(`${this.apiUrl}/tickets/${id}/`, { status });
  }
}
