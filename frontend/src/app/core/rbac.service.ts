import { Injectable, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface Permission {
  id: number;
  resource: string;
  action: string;
  description: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  is_system_role: boolean;
  permissions: Permission[];
  permission_count: number;
  user_count: number;
}

export interface UserRoleAssignment {
  id: number;
  user_id: number;
  username: string;
  user_email: string;
  role: Role;
  assigned_by_name: string;
  assigned_at: string;
}

export interface PermissionMatrixRow {
  role_id: number;
  role_name: string;
  permissions: {
    permission_id: number;
    resource: string;
    action: string;
    granted: boolean;
  }[];
}

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RbacService {
  private baseUrl = `${environment.apiUrl}/entitlements`;
  private userPermissions$ = new BehaviorSubject<Set<string>>(new Set());

  // Inject AuthService directly
  private authService: AuthService;

  constructor(private http: HttpClient, private injector: Injector) {
    // Use injector to avoid circular dependency if any future circular refs arise
    this.authService = this.injector.get(AuthService);
    this.loadUserPermissions();
  }

  // Roles
  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.baseUrl}/roles/`);
  }

  createRole(role: Partial<Role>): Observable<Role> {
    return this.http.post<Role>(`${this.baseUrl}/roles/`, role);
  }

  updateRole(id: number, role: Partial<Role>): Observable<Role> {
    return this.http.put<Role>(`${this.baseUrl}/roles/${id}/`, role);
  }

  deleteRole(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/roles/${id}/`);
  }

  assignPermissions(roleId: number, permissionIds: number[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/roles/${roleId}/assign_permissions/`, {
      permission_ids: permissionIds
    });
  }

  // Permissions
  getPermissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.baseUrl}/permissions/`);
  }

  bulkCreatePermissions(resources: string[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/permissions/bulk_create/`, { resources });
  }

  // User Role Assignments
  getUserRoles(userId: number): Observable<UserRoleAssignment[]> {
    return this.http.get<UserRoleAssignment[]>(`${this.baseUrl}/user-roles/user/${userId}/`);
  }

  assignRolesToUser(userId: number, roleIds: number[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/user-roles/bulk_assign/`, {
      user_id: userId,
      role_ids: roleIds
    });
  }

  // Permission Matrix
  getPermissionMatrix(): Observable<PermissionMatrixRow[]> {
    return this.http.get<PermissionMatrixRow[]>(`${this.baseUrl}/permission-matrix/`);
  }

  updatePermissionMatrix(updates: { role_id: number; permission_ids: number[] }[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/permission-matrix/update_matrix/`, { updates });
  }

  // Permission Checking
  private loadUserPermissions(): void {
    // Load user's permissions from local storage or API
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      const permissions = user.permissions || [];
      
      const permSet = new Set<string>();
      permissions.forEach((p: any) => {
          if (typeof p === 'string') {
              permSet.add(p);
          } else if (typeof p === 'object' && p.resource && p.action) {
              permSet.add(`${p.resource}:${p.action}`);
          }
      });
      
      this.userPermissions$.next(permSet);
    }
  }

  hasPermission(resource: string, action: string): boolean {
    // Super User Bypass: Admin (or SUPER_ADMIN via hasRole) gets full access
    if (this.authService && this.authService.hasRole('Admin')) {
        return true;
    }
    return this.userPermissions$.value.has(`${resource}:${action}`);
  }

  canView(resource: string): boolean {
    return this.hasPermission(resource, 'VIEW');
  }

  canCreate(resource: string): boolean {
    return this.hasPermission(resource, 'CREATE');
  }

  canEdit(resource: string): boolean {
    return this.hasPermission(resource, 'EDIT');
  }

  canDelete(resource: string): boolean {
    return this.hasPermission(resource, 'DELETE');
  }

  canApprove(resource: string): boolean {
    return this.hasPermission(resource, 'APPROVE');
  }
}
