import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService, HeadcountStats, AttritionStats, AttendanceStats, PayrollStats } from '../../../../core/analytics.service';
import { ErrorHandlerService } from '../../../../core/error-handler.service';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics-dashboard.component.html',
  styleUrl: './analytics-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnalyticsDashboardComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);
  private errorHandler = inject(ErrorHandlerService);

  // State management with signals
  headcount = signal<HeadcountStats | null>(null);
  attrition = signal<AttritionStats | null>(null);
  attendance = signal<AttendanceStats | null>(null);
  payroll = signal<PayrollStats | null>(null);
  isLoading = signal(false);

  ngOnInit() {
    this.loadAllStats();
  }

  loadAllStats() {
    this.isLoading.set(true);
    
    // Load headcount stats
    this.analyticsService.getHeadcountStats().subscribe({
      next: (data) => this.headcount.set(data),
      error: (err) => this.errorHandler.handleHttpError(err, 'Failed to load headcount stats')
    });

    // Load attrition stats
    this.analyticsService.getAttritionStats().subscribe({
      next: (data) => this.attrition.set(data),
      error: (err) => this.errorHandler.handleHttpError(err, 'Failed to load attrition stats')
    });

    // Load attendance stats
    this.analyticsService.getAttendanceStats().subscribe({
      next: (data) => this.attendance.set(data),
      error: (err) => this.errorHandler.handleHttpError(err, 'Failed to load attendance stats')
    });

    // Load payroll stats
    this.analyticsService.getPayrollStats().subscribe({
      next: (data) => {
        this.payroll.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to load payroll stats');
        this.isLoading.set(false);
      }
    });
  }

  getMaxValue(data: { month: string; value: number }[] | undefined): number {
    if (!data || data.length === 0) return 1;
    return Math.max(...data.map(d => d.value), 1); // Avoid division by zero
  }
}
