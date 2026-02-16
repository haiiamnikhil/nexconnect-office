import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RbacService, Role } from '../../../core/rbac.service';
import { ToastService } from '../../../core/toast.service';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './role-list.component.html',
  styleUrl: './role-list.component.scss'
})
export class RoleListComponent implements OnInit {
  roles: Role[] = [];
  filteredRoles: Role[] = [];
  searchTerm = '';
  isLoading = false;
  showModal = false;
  
  // Form data
  selectedRole: Role | null = null;
  roleForm = {
    name: '',
    description: ''
  };

  constructor(
    private rbacService: RbacService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.isLoading = true;
    this.rbacService.getRoles().subscribe({
      next: (data: any) => {
        const roles = Array.isArray(data) ? data : (data.results || []);
        this.roles = roles;
        this.filteredRoles = roles;
        this.isLoading = false;
      },
      error: (error) => {
        this.toastService.error('Failed to load roles');
        this.isLoading = false;
      }
    });
  }

  searchRoles(): void {
    if (!this.searchTerm.trim()) {
      this.filteredRoles = this.roles;
      return;
    }
    
    const term = this.searchTerm.toLowerCase();
    this.filteredRoles = this.roles.filter(role =>
      role.name.toLowerCase().includes(term) ||
      role.description.toLowerCase().includes(term)
    );
  }

  openCreateModal(): void {
    this.selectedRole = null;
    this.roleForm = { name: '', description: '' };
    this.showModal = true;
  }

  openEditModal(role: Role): void {
    this.selectedRole = role;
    this.roleForm = {
      name: role.name,
      description: role.description
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedRole = null;
    this.roleForm = { name: '', description: '' };
  }

  saveRole(): void {
    if (this.selectedRole) {
      //Update existing role
      this.rbacService.updateRole(this.selectedRole.id, this.roleForm).subscribe({
        next: () => {
          this.toastService.success('Role updated successfully');
          this.loadRoles();
          this.closeModal();
        },
        error: (error) => this.toastService.error('Failed to update role')
      });
    } else {
      // Create new role
      this.rbacService.createRole(this.roleForm).subscribe({
        next: () => {
          this.toastService.success('Role created successfully');
          this.loadRoles();
          this.closeModal();
        },
        error: (error) => this.toastService.error('Failed to create role')
      });
    }
  }

  deleteRole(role: Role): void {
    if (role.is_system_role) {
      this.toastService.warning('System roles cannot be deleted');
      return;
    }
    
    if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      this.rbacService.deleteRole(role.id).subscribe({
        next: () => {
          this.toastService.success('Role deleted successfully');
          this.loadRoles();
        },
        error: (error) => this.toastService.error('Failed to delete role')
      });
    }
  }
}
