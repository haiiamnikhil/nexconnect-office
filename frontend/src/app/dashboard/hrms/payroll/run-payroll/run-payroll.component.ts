import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PayrollService, PayrollRun } from '../../../../core/payroll.service';
import { ErrorHandlerService } from '../../../../core/error-handler.service';

@Component({
  selector: 'app-run-payroll',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './run-payroll.component.html',
  styleUrl: './run-payroll.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RunPayrollComponent implements OnInit {
  private payrollService = inject(PayrollService);
  private router = inject(Router);
  private errorHandler = inject(ErrorHandlerService);

  // State management
  selectedMonth = signal('');
  isLoading = signal(false);
  showConfirmDialog = signal(false);
  estimatedEmployees = signal(0);
  message = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  ngOnInit() {
    // Set default to first day of current month
    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    this.selectedMonth.set(defaultMonth);
  }

  onProcess() {
    this.openConfirmDialog();
  }

  openConfirmDialog() {
    if (!this.selectedMonth()) {
      this.errorHandler.showError('Please select a month');
      return;
    }

    // TODO: Fetch estimated employee count for the month
    this.estimatedEmployees.set(0); // Placeholder
    this.showConfirmDialog.set(true);
  }

  closeConfirmDialog() {
    this.showConfirmDialog.set(false);
  }

  processPayroll() {
    const monthValue = this.selectedMonth();
    
    if (!monthValue) {
      this.errorHandler.showError('Please select a month');
      return;
    }

    this.isLoading.set(true);
    this.closeConfirmDialog();

    // Format for backend: YYYY-MM-DD
    const monthToSend = monthValue.length === 7 ? monthValue + '-01' : monthValue;

    this.payrollService.runPayroll(monthToSend).subscribe({
      next: (run: PayrollRun) => {
        this.isLoading.set(false);
        this.errorHandler.showSuccess(`Payroll processed successfully for ${this.formatMonth(monthValue)}`);
        
        // Navigate to payroll dashboard after 1.5 seconds
        setTimeout(() => {
          this.router.navigate(['/dashboard/payroll'], {
            queryParams: { runId: run.id, refresh: true }
          });
        }, 1500);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorHandler.handleHttpError(err, 'Failed to process payroll');
      }
    });
  }

  formatMonth(monthString: string): string {
    const date = new Date(monthString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  getMinMonth(): string {
    // Allow payroll for previous 12 months
    const date = new Date();
    date.setMonth(date.getMonth() - 12);
    return date.toISOString().substring(0, 7);
  }

  getMaxMonth(): string {
    // Allow payroll for current month only
    const date = new Date();
    return date.toISOString().substring(0, 7);
  }
}
