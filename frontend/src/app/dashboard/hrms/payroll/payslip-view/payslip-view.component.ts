import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PayrollService, Payslip } from '../../../../core/payroll.service';
import { ErrorHandlerService } from '../../../../core/error-handler.service';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { ColumnDef, RowAction } from '../../../../shared/components/data-table/data-table.types';
import { AuthService } from '../../../../core/auth.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-payslip-view',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  templateUrl: './payslip-view.component.html',
  styleUrl: './payslip-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PayslipViewComponent implements OnInit {
  private payrollService = inject(PayrollService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private errorHandler = inject(ErrorHandlerService);
  private http = inject(HttpClient);

  // State management
  payslips = signal<Payslip[]>([]);
  isLoading = signal(false);
  
  columns: ColumnDef[] = [
    { field: 'employee_code', header: 'Emp Code' },
    { field: 'month_year', header: 'Period', type: 'date', format: 'mediumDate' }, // Backend has 'month' in PayrollRun, Payslip usually has 'generated_at' or we typically show PayrollRun month. 
    // Wait, Payslip model doesn't have 'month_year' field directly. It has 'payroll_run' (ID).
    // The previous code might have been assuming something. 
    // Let's use 'payment_date' or 'generated_at' for now, or just 'id'.
    { field: 'generated_at', header: 'Date', type: 'date', format: 'mediumDate' },
    { field: 'gross_earnings', header: 'Gross Pay', type: 'number', format: 'currency' },
    { field: 'total_deductions', header: 'Deductions', type: 'number', format: 'currency' },
    { field: 'net_pay', header: 'Net Pay', type: 'number', format: 'currency' },
    { field: 'payment_status', header: 'Status', type: 'badge', badgeColors: {
        'PENDING': 'bg-yellow-50 text-yellow-700',
        'PAID': 'bg-green-50 text-green-700',
        'PROCESSING': 'bg-blue-50 text-blue-700'
    }}
  ];

  actions: RowAction[] = [
    { label: 'Download PDF', action: 'download', icon: 'fas fa-file-pdf', classes: 'text-red-600 hover:bg-red-50' }
  ];

  ngOnInit() {
    this.loadPayslips();
  }

  loadPayslips() {
    this.isLoading.set(true);
    this.payrollService.getPayslips().subscribe({
      next: (data) => {
        this.payslips.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to load payslips');
        this.isLoading.set(false);
      }
    });
  }

  handleAction(event: { action: string, row: any }) {
    if (event.action === 'download') {
      this.downloadPayslip(event.row);
    }
  }

  downloadPayslip(payslip: Payslip) {
    // Construct URL directly for simple download or use blob
    // Using blob to handle auth headers
    const url = `${environment.apiUrl}/hrms/payslips/${payslip.id}/download/`;
    
    this.http.get(url, { 
        headers: this.authService.getHeaders(), 
        responseType: 'blob' 
    }).subscribe({
        next: (blob) => {
            const downloadURL = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadURL;
            link.download = `Payslip_${payslip.id}.pdf`; // Helper to name it better? Backend sends Content-Disposition
            link.click();
            window.URL.revokeObjectURL(downloadURL);
        },
        error: (err) => this.errorHandler.showError('Download failed')
    });
  }
}
