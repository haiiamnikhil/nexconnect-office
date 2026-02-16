import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PerformanceService, Review } from '../../../../core/performance.service';
import { ErrorHandlerService } from '../../../../core/error-handler.service';

@Component({
  selector: 'app-team-reviews',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './team-reviews.component.html',
  styleUrl: './team-reviews.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamReviewsComponent implements OnInit {
  private performanceService = inject(PerformanceService);
  private errorHandler = inject(ErrorHandlerService);

  // State management  
  teamReviews = signal<Review[]>([]);
  isLoading = signal(false);
  filter = signal<string>('all'); // all, pending, completed

  ngOnInit() {
    this.loadTeamReviews();
  }

  loadTeamReviews() {
    this.isLoading.set(true);
    this.performanceService.getTeamReviews().subscribe({
      next: (data) => {
        this.teamReviews.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to load team reviews');
        this.isLoading.set(false);
      }
    });
  }

  get filteredReviews() {
    const all = this.teamReviews();
    const filterType = this.filter();
    
    if (filterType === 'pending') {
      return all.filter(r => r.status === 'PENDING' || r.status === 'IN_PROGRESS');
    }
    if (filterType === 'completed') {
      return all.filter(r => r.status === 'COMPLETED');
    }
    return all;
  }

  setFilter(filter: string) {
    this.filter.set(filter);
  }

  getStatusBadge(status: string): string {
    const map: Record<string, string> = {
      'PENDING': 'badge-pending',
      'IN_PROGRESS': 'badge-progress',
      'COMPLETED': 'badge-completed'
    };
    return map[status] || 'badge-pending';
  }

  getRatingColor(rating: number): string {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-blue-600';
    if (rating >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  }
}
