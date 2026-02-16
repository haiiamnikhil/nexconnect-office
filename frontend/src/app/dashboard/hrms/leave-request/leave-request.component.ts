import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeaveService, LeaveBalance, Leave, LeaveType } from '../../../core/leave.service';
import { AuthService } from '../../../core/auth.service';
import { ErrorHandlerService } from '../../../core/error-handler.service';
import { OrgStructureService, Designation } from '../../../core/org-structure.service';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { ColumnDef, RowAction } from '../../../shared/components/data-table/data-table.types';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
// SOLID Architecture Services
import { LeaveFilterService } from '../../../core/services/leave-filter.service';
import { LeaveStatsCalculator, LeaveStats } from '../../../core/services/leave-stats-calculator.service';
import { calculateDaysBetween, formatLeaveDuration } from '../../../core/utils/leave/leave.utils';

@Component({
  selector: 'app-leave-request',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, DropdownComponent],
  templateUrl: './leave-request.component.html',
  styleUrl: './leave-request.component.scss'
})
export class LeaveRequestComponent implements OnInit {
  // ... (services)

  // ... (properties)

  employmentTypeOptions: DropdownOption[] = [];


  designationOptions: DropdownOption[] = [];


  leaveTypeOptions: DropdownOption[] = [];

  updateLeaveTypeOptions() {
    this.leaveTypeOptions = this.leaveTypes.map(t => {
      const balance = this.balances.find(b => b.leave_type === t.id);
      const available = balance ? balance.available : 0;
      
      return {
        label: t.name,
        value: t.id,
        icon: 'fas fa-calendar-alt',
        description: `Available: ${available} days`,
        badge: available.toString(),
        badgeClass: available > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      };
    });
  }

  // Services (following Dependency Inversion Principle)
  private leaveService = inject(LeaveService);
  authService = inject(AuthService);
  private errorHandler = inject(ErrorHandlerService);
  private orgService = inject(OrgStructureService);
  
  // SOLID Architecture Services
  private leaveFilterService = inject(LeaveFilterService);
  private leaveStatsCalc = inject(LeaveStatsCalculator);
  
  balances: LeaveBalance[] = [];
  leaveTypes: LeaveType[] = [];
  myLeaves: Leave[] = [];
  pendingApprovals: Leave[] = [];
  designations: Designation[] = [];
  
  showApplyModal = false;
  newLeave: Partial<Leave> = {};
  isLoading = false;

  // Columns
  myLeavesColumns: ColumnDef[] = [
    { 
      field: 'leave_type', 
      header: 'Type',
      format: (row) => {
        const type = this.leaveTypes.find(t => t.id === row.leave_type);
        return type ? type.name : row.leave_type;
      }
    },
    { field: 'start_date', header: 'Start Date', type: 'date' },
    { field: 'end_date', header: 'End Date', type: 'date' },
    { field: 'number_of_days', header: 'Days', type: 'number' },
    { field: 'reason', header: 'Reason' },
    { field: 'status', header: 'Status', type: 'badge', badgeColors: {
      'APPROVED': 'bg-green-50 text-green-700 border-green-200',
      'REJECTED': 'bg-red-50 text-red-700 border-red-200',
      'PENDING': 'bg-orange-50 text-orange-700 border-orange-200'
    }}
  ];

  pendingColumns: ColumnDef[] = [
    { field: 'employee_name', header: 'Employee' },
    { 
      field: 'leave_type', 
      header: 'Type',
      format: (row) => {
        const type = this.leaveTypes.find(t => t.id === row.leave_type);
        return type ? type.name : row.leave_type;
      }
    },
    { field: 'start_date', header: 'Start Date', type: 'date' },
    { field: 'end_date', header: 'End Date', type: 'date' },
    { field: 'number_of_days', header: 'Days' },
    { field: 'reason', header: 'Reason' }
  ];

  pendingActions: RowAction[] = [
    { label: 'Approve', action: 'approve', icon: 'fas fa-check', classes: 'text-green-600 hover:bg-green-50' },
    { label: 'Reject', action: 'reject', icon: 'fas fa-times', classes: 'text-red-600 hover:bg-red-50' }
  ];
  
  // Admin Tabs
  adminTabs = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
  activeAdminTab = 'ALL';
  allLeaves: Leave[] = [];
  
  // --- Allocation Logic ---
  showAllocationModal = false;
  allocationData = {
      year: new Date().getFullYear(),
      leave_type_id: 0,
      employment_type: 'PERMANENT',
      designation: '',
      days: 0
  };
  
  employmentTypes = [
      { label: 'Permanent', value: 'PERMANENT' },
      { label: 'Contract', value: 'CONTRACT' },
      { label: 'Intern', value: 'INTERN' },
      { label: 'Consultant', value: 'CONSULTANT' },
      { label: 'Part Time', value: 'PART_TIME' }
  ];

  get isAdmin(): boolean {
    const user = this.authService.currentUser();
    return user?.is_superuser || user?.role === 'Admin' || user?.role === 'SUPER_ADMIN';
  }

  private get currentEmployeeId(): number {
    const empId = this.authService.getCurrentEmployeeId();
    if (!empId) {
      this.errorHandler.handleError('Employee profile not found. Please contact administrator.');
      return 0;
    }
    return empId;
  }

  ngOnInit() {
    this.loadBalances();
    this.loadTypes();
    this.loadMyLeaves();
    this.loadDesignations();

    this.employmentTypeOptions = this.employmentTypes.map(t => ({
      label: t.label,
      value: t.value,
      icon: 'fas fa-briefcase'
    }));
    
    if (this.isAdmin) {
      this.loadAllLeaves();
    } else {
      this.loadPendingApprovals();
    }
  }

  loadDesignations() {
      this.orgService.getDesignations().subscribe({
          next: (data: any) => {
              this.designations = data.results || data;
              this.designationOptions = [
                { label: 'All Designations', value: '', icon: 'fas fa-users' },
                ...this.designations.map(d => ({
                  label: d.title,
                  value: d.title,
                  icon: 'fas fa-id-badge'
                }))
              ];
          },
          error: (err: any) => console.error('Failed to load designations', err)
      });
  }
  
  loadBalances() {
    if (!this.currentEmployeeId) return;
    
    this.isLoading = true;
    this.leaveService.getEmployeeBalances(this.currentEmployeeId).subscribe({
      next: (data) => {
        this.balances = data;
        this.updateLeaveTypeOptions();
        this.isLoading = false;
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to load leave balances');
        this.isLoading = false;
      }
    });
  }
  
  loadTypes() {
    this.leaveService.getLeaveTypes().subscribe({
      next: (data) => {
        this.leaveTypes = data;
        this.updateLeaveTypeOptions();
      },
      error: (err) => this.errorHandler.handleHttpError(err, 'Failed to load leave types')
    });
  }
  
  // Tabs for My Leaves
  tabs = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
  activeTab = 'ALL';

  loadMyLeaves() {
    if (!this.currentEmployeeId) return;
    
    const params: any = { employee: this.currentEmployeeId };
    if (this.activeTab !== 'ALL') {
      params.status = this.activeTab;
    }

    this.leaveService.getLeaves(params).subscribe({
      next: (data: any) => {
        this.myLeaves = Array.isArray(data) ? data : (data.results || []);
      },
      error: (err) => this.errorHandler.handleHttpError(err, 'Failed to load your leaves')
    });
  }
  
  setTab(tab: string) {
    this.activeTab = tab;
    this.loadMyLeaves();
  }

  loadAllLeaves() {
    const params: any = {};
    if (this.activeAdminTab !== 'ALL') {
      params.status = this.activeAdminTab;
    }
    
    this.leaveService.getLeaves(params).subscribe({
      next: (data: any) => {
        this.allLeaves = Array.isArray(data) ? data : (data.results || []);
      },
      error: (err) => this.errorHandler.handleHttpError(err, 'Failed to load company leaves')
    });
  }

  setAdminTab(tab: string) {
    this.activeAdminTab = tab;
    this.loadAllLeaves();
  }
  
  // Keep loadPendingApprovals for non-admins (Managers)
  loadPendingApprovals() {
    this.leaveService.getPendingApprovals().subscribe({
      next: (data) => this.pendingApprovals = data,
      error: (err) => this.errorHandler.handleHttpError(err, 'Failed to load pending approvals')
    });
  }
  
  openApplyModal() {
    this.newLeave = { employee: this.currentEmployeeId };
    this.showApplyModal = true;
  }
  
  closeModal() {
    this.showApplyModal = false;
    this.newLeave = {};
  }
  
  applyLeave() {
    this.leaveService.applyLeave(this.newLeave as Leave).subscribe({
      next: () => {
        this.errorHandler.showSuccess('Leave request submitted successfully');
        this.loadMyLeaves();
        this.loadBalances();
        if (this.isAdmin) this.loadAllLeaves();
        this.closeModal();
      },
      error: (err) => this.errorHandler.handleHttpError(err, 'Failed to submit leave request')
    });
  }
  
  handleAction(event: { action: string, row: any }) {
    if (event.action === 'approve') {
      this.approve(event.row.id);
    } else if (event.action === 'reject') {
      this.reject(event.row.id);
    }
  }

  approve(id: number) {
    this.leaveService.approveLeave(id).subscribe({
      next: () => {
        this.errorHandler.showSuccess('Leave approved successfully');
        if (this.isAdmin) {
            this.loadAllLeaves();
        } else {
            this.loadPendingApprovals();
        }
      },
      error: (err) => this.errorHandler.handleHttpError(err, 'Failed to approve leave')
    });
  }
  
  reject(id: number) {
    const reason = prompt('Rejection reason:');
    if (reason) {
      this.leaveService.rejectLeave(id, reason).subscribe({
        next: () => {
          this.errorHandler.showInfo('Leave rejected');
          if (this.isAdmin) {
            this.loadAllLeaves();
          } else {
            this.loadPendingApprovals();
          }
        },
        error: (err) => this.errorHandler.handleHttpError(err, 'Failed to reject leave')
      });
    }
  }
  
  getStatusClass(status: string): string {
    const map: any = {
      'PENDING': 'status-pending',
      'APPROVED': 'status-approved',
      'REJECTED': 'status-rejected'
    };
    return map[status] || '';
  }

  openAllocationModal() {
      this.showAllocationModal = true;
      // Default reset
      this.allocationData = {
        year: new Date().getFullYear(),
        leave_type_id: this.leaveTypes.length > 0 ? this.leaveTypes[0].id || 0 : 0,
        employment_type: 'PERMANENT',
        designation: '',
        days: 12
      };
  }

  closeAllocationModal() {
      this.showAllocationModal = false;
  }

  allocateLeave() {
      if (!this.allocationData.leave_type_id || !this.allocationData.days) {
          this.errorHandler.handleError('Please fill all fields');
          return;
      }
      
      this.leaveService.allocateLeaves(this.allocationData).subscribe({
          next: (res) => {
              this.errorHandler.showSuccess(res.message || 'Allocation successful');
              this.closeAllocationModal();
              if (this.currentEmployeeId) this.loadBalances();
          },
          error: (err) => this.errorHandler.handleHttpError(err, 'Allocation failed')
      });
  }
}
