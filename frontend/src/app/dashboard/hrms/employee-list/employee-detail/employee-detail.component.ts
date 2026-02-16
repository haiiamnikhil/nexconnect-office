import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EmployeeService, Employee, UserActivity } from '../../../../core/employee.service';
import { ErrorHandlerService } from '../../../../core/error-handler.service';

import { AuthService } from '../../../../core/auth.service';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employee-detail.component.html',
  styleUrl: './employee-detail.component.scss'
})
export class EmployeeDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private employeeService = inject(EmployeeService);
  private errorHandler = inject(ErrorHandlerService);
  protected authService = inject(AuthService);

  // State management
  employee = signal<Employee | null>(null);
  isLoading = signal(false);
  activeTab = signal<'personal' | 'employment' | 'documents' | 'performance' | 'audit-log'>('personal');

  // Activities Logic
  activities = signal<UserActivity[]>([]);
  showActivities = signal(false);

  constructor() {
      // Reactively check permissions whenever user state changes
      effect(() => {
          const user = this.authService.currentUser();
          if (user) {
              const isAdmin = this.authService.hasRole('SUPER_ADMIN') || this.authService.hasRole('Admin');
              this.showActivities.set(isAdmin);
          }
      }, { allowSignalWrites: true });
  }

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    
    if (idParam === 'me') {
       const myId = this.authService.getCurrentEmployeeId();
       if (myId) {
         this.loadEmployeeDetails(myId);
       } else {
         console.warn('No employee profile linked to current user');
         this.router.navigate(['/dashboard']);
       }
       return;
    }

    const id = Number(idParam);
    if (!isNaN(id) && id > 0) {
      this.loadEmployeeDetails(id);
    }
  }

  loadEmployeeDetails(id: number) {
    this.isLoading.set(true);
    this.employeeService.getEmployeeById(id).subscribe({
      next: (employee) => {
        this.employee.set(employee);
        
        // Load activities if allowed and user is linked
        if (this.showActivities() && employee.user) {
            this.loadActivities(employee.user);
        }
        
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to load employee details');
        this.isLoading.set(false);
        this.router.navigate(['/dashboard/employees']);
      }
    });
  }

  loadActivities(userId: number) {
      this.employeeService.getActivities(userId).subscribe({
          next: (data) => this.activities.set(data),
          error: (err) => console.error('Failed to load activities', err)
      });
  }

  setActiveTab(tab: 'personal' | 'employment' | 'documents' | 'performance' | 'audit-log') {
    this.activeTab.set(tab);
    if (tab === 'audit-log' && this.activities().length === 0) {
        const emp = this.employee();
        if (emp && emp.user) {
            this.loadActivities(emp.user);
        }
    }
  }

  getFullName(emp: Employee): string {
    return `${emp.first_name} ${emp.middle_name ? emp.middle_name + ' ' : ''}${emp.last_name}`;
  }

  goBack() {
    this.router.navigate(['/dashboard/employees']);
  }

  openEdit(emp: Employee) {
    if (emp && emp.id) {
       this.router.navigate(['/dashboard/employees/edit', emp.id]);
    }
  }

  contactEmployee(emp: Employee) {
    if (emp && emp.personal_email) {
      window.location.href = `mailto:${emp.personal_email}`;
    }
  }
}
