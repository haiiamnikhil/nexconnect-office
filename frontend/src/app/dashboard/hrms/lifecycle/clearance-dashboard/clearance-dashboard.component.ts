import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LifecycleService, OffboardingRequest, ExitClearance } from '../../../../core/lifecycle.service';
import { ErrorHandlerService } from '../../../../core/error-handler.service';

@Component({
  selector: 'app-clearance-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clearance-dashboard.component.html',
  styleUrl: './clearance-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClearanceDashboardComponent implements OnInit {
  private lifecycleService = inject(LifecycleService);
  private errorHandler = inject(ErrorHandlerService);

  // State management
  requests = signal<OffboardingRequest[]>([]);
  isLoading = signal(false);
  showModal = signal(false);
  selectedClearance = signal<ExitClearance | null>(null);
  remarks = signal('');
  filterStatus = signal<string>('all');

  // Computed filtered requests
  filteredRequests = computed(() => {
    const all = this.requests();
    const filter = this.filterStatus();
    
    if (filter === 'pending') {
      return all.filter(r => r.status === 'REQUESTED' || r.status === 'APPROVED');
    }
    if (filter === 'completed') {
      return all.filter(r => r.status === 'COMPLETED');
    }
    return all;
  });

  // Statistics
  pendingCount = computed(() =>
    this.requests().filter(r => r.status === 'REQUESTED').length
  );

  completedCount = computed(() =>
    this.requests().filter(r => r.status === 'COMPLETED').length
  );

  ngOnInit() {
    this.loadRequests();
  }

  loadRequests() {
    this.isLoading.set(true);
    this.lifecycleService.getOffboardingRequests().subscribe({
      next: (data) => {
        this.requests.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to load clearance requests');
        this.isLoading.set(false);
      }
    });
  }

  openClearanceModal(clearance: ExitClearance) {
    this.selectedClearance.set(clearance);
    this.remarks.set('');
    this.showModal.set(true);
  }

  closeModal() {
    this.selectedClearance.set(null);
    this.showModal.set(false);
  }

  submitClearance(approved: boolean) {
    const clearance = this.selectedClearance();
    if (!clearance) return;

    this.lifecycleService.updateClearance(clearance.id, {
      status: approved ? 'CLEARED' : 'REJECTED',
      remarks: this.remarks()
    }).subscribe({
      next: () => {
        this.errorHandler.showSuccess(`Clearance ${approved ? 'approved' : 'rejected'} successfully`);
        this.loadRequests();
        this.closeModal();
      },
      error: (err) => this.errorHandler.handleHttpError(err, 'Failed to update clearance')
    });
  }

  setFilter(filter: string) {
    this.filterStatus.set(filter);
  }

  getStatusBadge(status: string): string {
    const map: Record<string, string> = {
      'PENDING': 'badge-pending',
      'APPROVED': 'badge-success',
      'REJECTED': 'badge-error',
      'CLEARED': 'badge-completed'
    };
    return map[status] || 'badge-pending';
  }
}
