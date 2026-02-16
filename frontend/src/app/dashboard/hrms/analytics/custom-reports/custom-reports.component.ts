import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { AnalyticsService } from '../../../../core/analytics.service';
import { ErrorHandlerService} from '../../../../core/error-handler.service';
import { AuthService } from '../../../../core/auth.service';
@Component({
  selector: 'app-custom-reports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './custom-reports.component.html',
  styleUrl: './custom-reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomReportsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private analyticsService = inject(AnalyticsService);
  private errorHandler = inject(ErrorHandlerService);
  authService = inject(AuthService);
  // State management
  reports = signal<any[]>([]);
  reportData = signal<any>(null);
  isLoading = signal(false);
  isGenerating = signal(false);

  reportForm: FormGroup = this.fb.group({
    report_type: ['headcount', Validators.required],
    start_date: ['', Validators.required],
    end_date: ['', Validators.required],
    department: [null],
    format: ['table', Validators.required] // table, chart, export
  });

  reportTypes = [
    { value: 'headcount', label: 'Headcount Analysis' },
    { value: 'attrition', label: 'Attrition Report' },
    { value: 'attendance', label: 'Attendance Summary' },
    { value: 'payroll', label: 'Payroll Statistics' },
    { value: 'performance', label: 'Performance Metrics' }
  ];

  ngOnInit() {
    // Set default date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    
    this.reportForm.patchValue({
      start_date: this.formatDate(startDate),
      end_date: this.formatDate(endDate)
    });
  }

  generateReport() {
    if (this.reportForm.invalid) {
      this.errorHandler.showError('Please fill in all required fields');
      return;
    }

    this.isGenerating.set(true);
    const formData = this.reportForm.value;

    // Call appropriate analytics endpoint based on report type
    this.loadReportData(formData.report_type, formData);
  }

  loadReportData(type: string, filters: any) {
    let observable: Observable<any>;
    
    switch (type) {
      case 'headcount':
        observable = this.analyticsService.getHeadcountStats();
        break;
      case 'attrition':
        observable = this.analyticsService.getAttritionStats();
        break;
      case 'attendance':
        observable = this.analyticsService.getAttendanceStats();
        break;
      case 'payroll':
        observable = this.analyticsService.getPayrollStats();
        break;
      default:
        this.errorHandler.showError('Invalid report type');
        this.isGenerating.set(false);
        return;
    }

    observable.subscribe({
      next: (data: any) => {
        this.reportData.set(data);
        this.errorHandler.showSuccess('Report generated successfully');
        this.isGenerating.set(false);
      },
      error: (err: any) => {
        this.errorHandler.handleHttpError(err, 'Failed to generate report');
        this.isGenerating.set(false);
      }
    });
  }

  exportReport() {
    const data = this.reportData();
    if (!data) {
      this.errorHandler.showInfo('No report data to export');
      return;
    }

    // Convert to CSV
    const csv = this.convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${this.reportForm.value.report_type}_${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    this.errorHandler.showSuccess('Report exported successfully');
  }

  convertToCSV(data: any): string {
    // Simple CSV conversion (can be enhanced)
    if (Array.isArray(data)) {
      const headers = Object.keys(data[0] || {}).join(',');
      const rows = data.map(row => Object.values(row).join(','));
      return [headers, ...rows].join('\n');
    }
    return JSON.stringify(data);
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  clearReport() {
    this.reportData.set(null);
  }
}
