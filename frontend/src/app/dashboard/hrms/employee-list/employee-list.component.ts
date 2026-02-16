import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EmployeeService, Employee } from '../../../core/employee.service';
import { OrgStructureService, Department } from '../../../core/org-structure.service';
import { ErrorHandlerService } from '../../../core/error-handler.service';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { ColumnDef, RowAction } from '../../../shared/components/data-table/data-table.types';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { EmployeeFilterService } from '../../../core/services/employee-filter.service';
import { AuthService } from '../../../core/auth.service';
@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, DropdownComponent],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeListComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private orgService = inject(OrgStructureService);
  private errorHandler = inject(ErrorHandlerService);
  private router = inject(Router);
  authService = inject(AuthService);
  
  // SOLID Architecture Services
  private filterService = inject(EmployeeFilterService);  
  protected readonly Math = Math;
  
  // State management with signals
  employees = signal<Employee[]>([]);
  departments = signal<Department[]>([]);
  stats = signal<any>({});
  isLoading = signal(false);
  
  // Search/Filter state
  searchQuery = signal('');
  selectedDepartment = signal(null);

  departmentOptions = computed(() => {
    return [
      { label: 'All Departments', value: null, icon: 'fas fa-border-all' },
      ...this.departments().map(d => ({
        label: d.name,
        value: d.id, // Ensure this matches API expectation (ID or Name?)
        icon: 'fas fa-building'
      }))
    ];
  });

  // Pagination state (handled by DataTable mostly, but we keep for server-side loading)
  currentPage = signal(1);
  pageSize = signal(10);
  totalCount = signal(0);
  totalPages = signal(0);

  // DataTable Config
  columns: ColumnDef[] = [
    { field: 'full_name', header: 'Employee' }, // We need to preprocess this
    { field: 'employee_code', header: 'Code' },
    { field: 'department_name', header: 'Department', type: 'badge', badgeColors: {'*': 'bg-gray-100 text-gray-800'} },
    { field: 'designation', header: 'Designation' },
    { field: 'employee_status', header: 'Status', type: 'badge', badgeColors: {
      'DRAFT': 'bg-gray-100 text-gray-700 border-gray-200',
      'ACTIVE': 'bg-green-50 text-green-700 border-green-200',
      'PROBATION': 'bg-blue-50 text-blue-700 border-blue-200',
      'NOTICE': 'bg-orange-50 text-orange-700 border-orange-200',
      'RESIGNED': 'bg-gray-50 text-gray-700 border-gray-200',
      'TERMINATED': 'bg-red-50 text-red-700 border-red-200'
    }}
  ];

  // Filter actions based on permissions
  actions = computed<RowAction[]>(() => {
    const allowedActions: RowAction[] = [];
    
    if (this.authService.hasPermission('employee:EDIT')) {
      allowedActions.push({ 
        label: 'Edit', 
        action: 'edit', 
        icon: 'fas fa-edit', 
        classes: 'text-primary-600 hover:bg-primary-50' 
      });
    }
    
    if (this.authService.hasPermission('employee:DELETE')) {
      allowedActions.push({ 
        label: 'Delete', 
        action: 'delete', 
        icon: 'fas fa-trash-alt', 
        classes: 'text-red-600 hover:bg-red-50' 
      });
    }
    
    return allowedActions;
  });


  ngOnInit() {
    this.loadEmployees();
    this.loadDepartments();
    this.loadStats();
  }

  loadEmployees() {
    this.isLoading.set(true);
    const params: any = {
      page: this.currentPage(),
      page_size: this.pageSize() // We might want to fetch all if we rely on client-side pagination, but assume server-side
    };
    
    if (this.selectedDepartment()) {
      params.department = this.selectedDepartment();
    }
    
    this.employeeService.getEmployees(params).subscribe({
      next: (data) => {
        const results = data.results || data;
        const count = data.count || (Array.isArray(data) ? data.length : 0);
        
        // Preprocess data for DataTable
        const processed = (Array.isArray(results) ? results : []).map((emp: any) => ({
          ...emp,
          full_name: `${emp.first_name} ${emp.last_name}`,
          department_name: emp.department_name || 'Unassigned'
        }));

        this.employees.set(processed);
        this.totalCount.set(count);
        this.totalPages.set(Math.ceil(count / this.pageSize()));
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to load employees');
        this.employees.set([]);
        this.totalCount.set(0);
        this.isLoading.set(false);
      }
    });
  }

  viewProfile(row: any) {
      this.router.navigate(['/dashboard/employees', row.id]);
  }

  handleAction(event: { action: string, row: any }) {
    if (event.action === 'edit') {
      this.openEdit(event.row);
    } else if (event.action === 'delete') {
      this.delete(event.row.id);
    }
  }

  // ... (Keep other existing methods)

  getFullName(emp: Employee): string {
    return `${emp.first_name} ${emp.last_name}`.trim();
  }


  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadEmployees();
    }
  }

  getPages(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    
    // Simple pagination logic: show max 5 pages
    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + 4);
    
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }
    return pages;
  }

  loadDepartments() {
    this.orgService.getDepartments().subscribe({
      next: (data: any) => {
        const departments = Array.isArray(data) ? data : (data.results || []);
        this.departments.set(departments);
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to load departments');
        this.departments.set([]); // Ensure it's always an array
      }
    });
  }

  loadStats() {
    this.employeeService.getEmployeeStats().subscribe({
      next: (data) => this.stats.set(data),
      error: (err) => this.errorHandler.handleHttpError(err, 'Failed to load statistics')
    });
  }

  onSearch() {
    // NOTE: EmployeeFilterService is available for client-side filtering
    // Future enhancement: Load all employees once and use filterService.search() for better performance
    
    this.currentPage.set(1); // Reset to page 1
    if (this.searchQuery()) {
      this.isLoading.set(true);
      this.employeeService.searchEmployees(this.searchQuery()).subscribe({
        next: (data) => {
          const results = Array.isArray(data) ? data : (data.results || []);
          this.employees.set(results);
          this.isLoading.set(false);
          const count = Array.isArray(data) ? data.length : (data.count || 0);
          this.totalCount.set(count);
          this.totalPages.set(Math.ceil(count / this.pageSize()));
        },
        error: (err) => {
          this.errorHandler.handleHttpError(err, 'Search failed');
          this.isLoading.set(false);
        }
      });
    } else {
      this.loadEmployees();
    }
  }

  onDepartmentChange() {
    this.currentPage.set(1); // Reset to page 1
    this.loadEmployees();
  }

  openCreate() {
    this.router.navigate(['/dashboard/employees/create']);
  }

  openEdit(emp: Employee) {
    this.router.navigate(['/dashboard/employees/edit', emp.id]);
  }

  delete(id: number) {
    if (confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      this.employeeService.deleteEmployee(id).subscribe({
        next: () => {
          this.errorHandler.showSuccess('Employee deleted successfully');
          this.loadEmployees();
          this.loadStats(); // Refresh stats count
        },
        error: (err) => this.errorHandler.handleHttpError(err, 'Failed to delete employee')
      });
    }
  }


}
