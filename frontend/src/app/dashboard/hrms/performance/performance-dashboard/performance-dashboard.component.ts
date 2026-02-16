import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PerformanceService, Goal, Review, AppraisalCycle } from '../../../../core/performance.service';
import { ErrorHandlerService } from '../../../../core/error-handler.service';

@Component({
  selector: 'app-performance-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './performance-dashboard.component.html',
  styleUrl: './performance-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerformanceDashboardComponent implements OnInit {
  private performanceService = inject(PerformanceService);
  private errorHandler = inject(ErrorHandlerService);

  // State management
  goals = signal<Goal[]>([]);
  reviews = signal<Review[]>([]);
  cycles = signal<AppraisalCycle[]>([]);
  isLoading = signal(false);

  // Computed metrics
  activeGoalsCount = computed(() => 
    this.goals().filter(g => g.status !== 'COMPLETED' && g.status !== 'CANCELLED').length
  );

  completedGoalsCount = computed(() =>
    this.goals().filter(g => g.status === 'COMPLETED').length
  );

  averageGoalProgress = computed(() => {
    const goals = this.goals();
    if (goals.length === 0) return 0;
    const totalProgress = goals.reduce((sum, g) => sum + (g.progress || 0), 0);
    return Math.round(totalProgress / goals.length);
  });

  pendingReviewsCount = computed(() =>
    this.reviews().filter(r => r.status === 'PENDING' || r.status === 'IN_PROGRESS').length
  );

  completedReviewsCount = computed(() =>
    this.reviews().filter(r => r.status === 'COMPLETED').length
  );

  currentCycle = computed(() => {
    const now = new Date();
    return this.cycles().find(c => {
      const start = new Date(c.start_date);
      const end = new Date(c.end_date);
      return now >= start && now <= end;
    });
  });

  ngOnInit() {
    this.loadAllData();
  }

  loadAllData() {
    this.isLoading.set(true);
    
    // Load goals
    this.performanceService.getMyGoals().subscribe({
      next: (data: any) => {
        const results = Array.isArray(data) ? data : (data.results || []);
        this.goals.set(results);
      },
      error: (err) => this.errorHandler.handleHttpError(err, 'Failed to load goals')
    });

    // Load reviews
    this.performanceService.getMyReviews().subscribe({
      next: (data: any) => {
        const results = Array.isArray(data) ? data : (data.results || []);
        this.reviews.set(results);
      },
      error: (err) => this.errorHandler.handleHttpError(err, 'Failed to load reviews')
    });

    // Load cycles
    this.performanceService.getCycles().subscribe({
      next: (data: any) => {
        const results = Array.isArray(data) ? data : (data.results || []);
        this.cycles.set(results);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to load appraisal cycles');
        this.isLoading.set(false);
      }
    });
  }

  getProgressColor(progress: number): string {
    if (progress >= 75) return 'text-green-600';
    if (progress >= 50) return 'text-blue-600';
    if (progress >= 25) return 'text-yellow-600';
    return 'text-gray-600';
  }

  refreshData() {
    this.loadAllData();
  }
}
