import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSig = signal<any>(null);

  currentUser = computed(() => this.currentUserSig());
  isAuthenticated = computed(() => !!this.currentUserSig());

  constructor(private http: HttpClient, private router: Router) {
    // Check local storage on init
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    if (token && user) {
        this.currentUserSig.set(JSON.parse(user));
    }
  }

  login(credentials: any, returnUrl: string = '/dashboard'): Observable<any> {
    return this.http.post(`${this.apiUrl}/login/`, credentials).pipe(
      tap((response: any) => {
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.currentUserSig.set(response.user);
        
        // Check if user must change password
        if (response.user?.must_change_password) {
          this.router.navigate(['/change-password']);
        } else {
          // Navigate to the originally requested URL or dashboard
          this.router.navigate([returnUrl]);
        }
      })
    );
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register/`, data).pipe(
      tap((response: any) => {
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.currentUserSig.set(response.user);
        this.router.navigate(['/dashboard']);
      })
    );
  }

  refreshUserProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me/`).pipe(
      tap((user: any) => {
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUserSig.set(user);
      })
    );
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this.currentUserSig.set(null);
    this.router.navigate(['/login']);
  }

  /**
   * Get current employee ID from authenticated user
   * @returns Employee ID or null if not available
   */
  getCurrentEmployeeId(): number | null {
    const user = this.currentUserSig();
    return user?.employee_profile?.id || null;
  }

  /**
   * Get current user's ID
   * @returns User ID or null if not authenticated
   */
  getCurrentUserId(): number | null {
    const user = this.currentUserSig();
    return user?.id || null;
  }

  /**
   * Get current user's full name
   * @returns Full name or 'User' as fallback
   */
  getCurrentUserName(): string {
    const user = this.currentUserSig();
    if (user?.first_name || user?.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user?.username || 'User';
  }

  /**
   * Check if current user has a specific role
   * @param role Role to check
   * @returns True if user has the role
   */
  hasRole(role: string): boolean {
    const user = this.currentUserSig();
    // SUPER_ADMIN has access to everything, including 'Admin' checks
    if (user?.role === 'SUPER_ADMIN' || user?.is_superuser) {
      return true;
    }
    return user?.role === role || user?.role === 'Admin';
  }

  /**
   * Check if current user has a specific permission
   * @param permission 'resource:action' string to check (e.g. 'employee:create')
   * @returns True if user has the permission
   */
  hasPermission(permission: string): boolean {
    const user = this.currentUserSig();
    if (!user) return false;

    // Super Admin / Superuser check
    if (user.is_superuser || user.role === 'SUPER_ADMIN') return true;
    
    // Check for wildcard permission
    if (user.permissions?.includes('*:*')) return true;

    // Check specific permission
    return user.permissions?.includes(permission) || false;
  }
  /**
   * Get HTTP Headers with Auth Token
   */
  getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }
}

