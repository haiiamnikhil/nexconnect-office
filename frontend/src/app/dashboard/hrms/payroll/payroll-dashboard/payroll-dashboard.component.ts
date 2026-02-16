import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PayrollService, PayrollRun } from '../../../../core/payroll.service';
import { ErrorHandlerService } from '../../../../core/error-handler.service';
import { AuthService } from '../../../../core/auth.service';
@Component({
  selector: 'app-payroll-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './payroll-dashboard.component.html',
  styleUrl: './payroll-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PayrollDashboardComponent implements OnInit {
  private payrollService = inject(PayrollService);
  private errorHandler = inject(ErrorHandlerService);
  authService = inject(AuthService);
  // State management
  recentRuns = signal<PayrollRun[]>([]);
  isLoading = signal(false);
  
  // Computed metrics
  totalProcessed = signal(0);
  pendingRuns = signal(0);
  lastRunStatus = signal<string>('');

  ngOnInit() {
    this.loadPayrollRuns();
  }

  loadPayrollRuns() {
    this.isLoading.set(true);
    this.payrollService.getPayrollRuns().subscribe({
      next: (data) => {
        this.recentRuns.set(Array.isArray(data) ? data : []);
        this.calculateMetrics(Array.isArray(data) ? data : []);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to load payroll runs');
        this.recentRuns.set([]); // Ensure it's always an array
        this.isLoading.set(false);
      }
    });
  }

  calculateMetrics(runs: PayrollRun[]) {
    const completed = runs.filter(r => r.status === 'COMPLETED').length;
    const pending = runs.filter(r => r.status === 'DRAFT' || r.status === 'PROCESSING').length;
    
    this.totalProcessed.set(completed);
    this.pendingRuns.set(pending);
    this.lastRunStatus.set(runs[0]?.status || 'N/A');
  }

  getStatusBadge(status: string): string {
    const map: Record<string, string> = {
      'DRAFT': 'badge-draft',
      'PROCESSING': 'badge-processing',
      'COMPLETED': 'badge-completed',
      'LOCKED': 'badge-locked'
    };
    return map[status] || 'badge-draft';
  }

  refreshData() {
    this.loadPayrollRuns();
  }
}
