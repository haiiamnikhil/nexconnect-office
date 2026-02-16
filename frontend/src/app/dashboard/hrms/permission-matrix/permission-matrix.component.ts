import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RbacService, PermissionMatrixRow, Permission } from '../../../core/rbac.service';
import { ToastService } from '../../../core/toast.service';
import { AuthService } from '../../../core/auth.service';
import { PERMISSION_GROUPS, ROLE_TEMPLATES, PermissionGroup, RoleTemplate } from './permission-config';

interface GroupedPermission {
  permission_id: number;
  resource: string;
  action: string;
  granted: boolean;
  description?: string;
}

interface PermissionGroupData {
  key: string;
  config: PermissionGroup;
  permissions: GroupedPermission[];
  selectedCount: number;
  totalCount: number;
}

@Component({
  selector: 'app-permission-matrix',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './permission-matrix.component.html',
  styleUrl: './permission-matrix.component.scss'
})
export class PermissionMatrixComponent implements OnInit {
  // Services
  private rbacService = inject(RbacService);
  private toastService = inject(ToastService);
  authService = inject(AuthService);

  // State
  matrixData = signal<PermissionMatrixRow[]>([]);
  permissions = signal<Permission[]>([]);
  selectedRoleId = signal<number | null>(null);
  searchQuery = signal<string>('');
  selectedTemplate = signal<string>('');
  isLoading = signal(false);
  isSaving = signal(false);

  // Configuration
  permissionGroups = PERMISSION_GROUPS;
  roleTemplates = ROLE_TEMPLATES;

  // Computed
  roles = computed(() => this.matrixData().map(r => ({ id: r.role_id, name: r.role_name })));
  
  selectedRole = computed(() => {
    const roleId = this.selectedRoleId();
    if (!roleId) return null;
    return this.matrixData().find(r => r.role_id === roleId) || null;
  });

  groupedPermissions = computed(() => {
    const role = this.selectedRole();
    if (!role) return [];

    const query = this.searchQuery().toLowerCase();
    const groups: PermissionGroupData[] = [];

    Object.entries(this.permissionGroups).forEach(([key, config]) => {
      const groupPermissions = role.permissions.filter(p => {
        const matchesGroup = config.permissions.includes(`${p.resource}:${p.action}`);
        const matchesSearch = !query || 
          p.resource.toLowerCase().includes(query) ||
          p.action.toLowerCase().includes(query) ||
          config.label.toLowerCase().includes(query);
        return matchesGroup && matchesSearch;
      });

      if (groupPermissions.length > 0 || !query) {
        const selectedCount = groupPermissions.filter(p => p.granted).length;
        groups.push({
          key,
          config,
          permissions: groupPermissions,
          selectedCount,
          totalCount: groupPermissions.length
        });
      }
    });

    return groups;
  });

  ngOnInit(): void {
    this.loadMatrix();
  }

  loadMatrix(): void {
    this.isLoading.set(true);
    
    this.rbacService.getPermissions().subscribe({
      next: (data: any) => {
        const permissions = Array.isArray(data) ? data : (data.results || []);
        this.permissions.set(permissions);
        
        this.rbacService.getPermissionMatrix().subscribe({
          next: (matrix) => {
            this.matrixData.set(matrix);
            // Auto-select first role
            if (matrix.length > 0 && !this.selectedRoleId()) {
              this.selectedRoleId.set(matrix[0].role_id);
            }
            this.isLoading.set(false);
          },
          error: (error) => {
            console.error('Error loading permission matrix:', error);
            this.toastService.error('Failed to load permission matrix');
            this.isLoading.set(false);
          }
        });
      },
      error: (error) => {
        console.error('Error loading permissions:', error);
        this.toastService.error('Failed to load permissions');
        this.isLoading.set(false);
      }
    });
  }

  togglePermission(permission: GroupedPermission): void {
    const role = this.selectedRole();
    if (!role) return;

    const perm = role.permissions.find(p => 
      p.permission_id === permission.permission_id
    );
    
    if (perm) {
      perm.granted = !perm.granted;
      // Trigger reactivity
      this.matrixData.set([...this.matrixData()]);
    }
  }

  toggleModulePermissions(groupKey: string, selectAll: boolean): void {
    const role = this.selectedRole();
    if (!role) return;

    const config = this.permissionGroups[groupKey];
    if (!config) return;

    role.permissions.forEach(p => {
      if (config.permissions.includes(`${p.resource}:${p.action}`)) {
        p.granted = selectAll;
      }
    });

    // Trigger reactivity
    this.matrixData.set([...this.matrixData()]);
  }

  applyTemplate(templateKey: string): void {
    if (!templateKey || !this.selectedRole()) {
      return;
    }

    const template = this.roleTemplates[templateKey];
    if (!template) return;

    const role = this.selectedRole();
    if (!role) return;

    // First, clear all permissions
    role.permissions.forEach(p => p.granted = false);

    // Then, apply template permissions
    template.permissions.forEach(permStr => {
      role.permissions.forEach(p => {
        if (`${p.resource}:${p.action}` === permStr) {
          p.granted = true;
        }
      });
    });

    // Trigger reactivity
    this.matrixData.set([...this.matrixData()]);
    this.selectedTemplate.set('');
    this.toastService.success(`Applied ${template.name} template`);
  }

  saveMatrix(): void {
    this.isSaving.set(true);
    
    const updates = this.matrixData().map(role => ({
      role_id: role.role_id,
      permission_ids: role.permissions
        .filter(p => p.granted)
        .map(p => p.permission_id)
    }));
    
    this.rbacService.updatePermissionMatrix(updates).subscribe({
      next: () => {
        this.toastService.success('Permission matrix updated successfully!');
        this.isSaving.set(false);
        this.loadMatrix();
      },
      error: (error) => {
        console.error('Save error:', error);
        this.toastService.error('Failed to update permission matrix');
        this.isSaving.set(false);
      }
    });
  }

  getTemplateOptions() {
    return Object.entries(this.roleTemplates).map(([key, template]) => ({
      value: key,
      label: template.name
    }));
  }
}
