import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { ToastService } from './toast.service';

export interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  is_read: boolean;
  link?: string;
  created_at: string;
}

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/hrms/notifications`;
  
  // Observable source for unread count to update UI automatically
  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/`).pipe(
        tap({
            next: (data) => console.log('NotificationService: Data received', data),
            error: (err) => console.error('NotificationService: Error', err)
        })
    );
  }

  getUnreadCount(): Observable<{ unread_count: number }> {
    return this.http.get<{ unread_count: number }>(`${this.apiUrl}/unread_count/`).pipe(
        tap(res => this.unreadCountSubject.next(res.unread_count))
    );
  }

  markAsRead(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/mark_read/`, {}).pipe(
        tap(() => this.refreshUnreadCount())
    );
  }

  markAllAsRead(): Observable<any> {
    return this.http.post(`${this.apiUrl}/mark_all_read/`, {}).pipe(
        tap(() => this.unreadCountSubject.next(0))
    );
  }

  refreshUnreadCount() {
      this.getUnreadCount().subscribe();
  }

  deleteNotification(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/`).pipe(
      tap(() => this.refreshUnreadCount())
    );
  }

  markAsUnread(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/mark_unread/`, {}).pipe(
      tap(() => this.refreshUnreadCount())
    );
  }

  // Polling Logic
  private pollingInterval: any;
  private previousCount = 0;
  private toastService = inject(ToastService);

  startPolling(intervalMs: number = 10000) {
      if (this.pollingInterval) return; // Already polling
      
      // Initial load
      this.getUnreadCount().subscribe(res => {
          this.previousCount = res.unread_count; // Set initial count without toasting
          this.unreadCountSubject.next(res.unread_count);
      });
      
      this.pollingInterval = setInterval(() => {
          this.checkAndNotify();
      }, intervalMs);
  }
  
  private checkAndNotify() {
      this.getUnreadCount().subscribe(res => {
          const newCount = res.unread_count;
          
          if (newCount > this.previousCount) {
              // New notification arrived! Fetch it to show toast
              this.getNotifications().subscribe(list => {
                  if (list.length > 0) {
                      const latest = list[0];
                      const msg = `${latest.title}: ${latest.message}`;
                      const type = latest.notification_type;
                      
                      switch (type) {
                          case 'SUCCESS':
                              this.toastService.success(msg);
                              break;
                          case 'WARNING':
                              this.toastService.warning(msg);
                              break;
                          case 'ERROR':
                              this.toastService.error(msg);
                              break;
                          default:
                              this.toastService.info(msg);
                              break;
                      }
                  }
              });
          }
          
          this.previousCount = newCount;
          this.unreadCountSubject.next(newCount);
      });
  }

  stopPolling() {
      if (this.pollingInterval) {
          clearInterval(this.pollingInterval);
          this.pollingInterval = null;
      }
  }
}
