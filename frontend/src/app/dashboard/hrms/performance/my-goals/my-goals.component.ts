import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PerformanceService, Goal, AppraisalCycle } from '../../../../core/performance.service';
import { ErrorHandlerService } from '../../../../core/error-handler.service';
import { DropdownComponent } from '../../../../shared/components/dropdown/dropdown.component';
import { AuthService } from '../../../../core/auth.service';
@Component({
  selector: 'app-my-goals',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DropdownComponent],
  templateUrl: './my-goals.component.html',
  styleUrl: './my-goals.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyGoalsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private performanceService = inject(PerformanceService);
  private errorHandler = inject(ErrorHandlerService);
  authService = inject(AuthService);
  // State management
  goals = signal<Goal[]>([]);
  cycles = signal<AppraisalCycle[]>([]);
  showModal = signal(false);
  isEditing = signal(false);
  isLoading = signal(false);
  currentGoalId: number | null = null;

  goalForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    category: ['WORK', Validators.required],
    weightage: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    cycle: [null, Validators.required],
    status: ['PENDING']
  });

  ngOnInit() {
    this.loadGoals();
    this.loadCycles();
  }

  loadGoals() {
    this.isLoading.set(true);
    this.performanceService.getMyGoals().subscribe({
      next: (data: any) => {
        const results = Array.isArray(data) ? data : (data.results || []);
        this.goals.set(results);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to load goals');
        this.isLoading.set(false);
      }
    });
  }

  loadCycles() {
    this.performanceService.getCycles().subscribe({
      next: (data: any) => {
        const results = Array.isArray(data) ? data : (data.results || []);
        this.cycles.set(results);
      },
      error: (err) => this.errorHandler.handleHttpError(err, 'Failed to load appraisal cycles')
    });
  }

  // Dropdown Options
  categoryOptions = computed(() => [
    { label: 'Work', value: 'WORK', icon: 'fas fa-briefcase' },
    { label: 'Personal', value: 'PERSONAL', icon: 'fas fa-user' },
    { label: 'Learning', value: 'LEARNING', icon: 'fas fa-book-reader' }
  ]);

  cycleOptions = computed(() => 
    this.cycles().map(c => ({
      label: c.name,
      value: c.id,
      description: `${new Date(c.start_date).toLocaleDateString()} - ${new Date(c.end_date).toLocaleDateString()}`,
      icon: 'fas fa-calendar-alt'
    }))
  );

  statusOptions = computed(() => [
    { label: 'Pending', value: 'PENDING', badge: 'PENDING', badgeClass: 'bg-gray-100 text-gray-800', icon: 'fas fa-clock' },
    { label: 'In Progress', value: 'IN_PROGRESS', badge: 'IN PROGRESS', badgeClass: 'bg-blue-100 text-blue-800', icon: 'fas fa-spinner' },
    { label: 'Completed', value: 'COMPLETED', badge: 'COMPLETED', badgeClass: 'bg-green-100 text-green-800', icon: 'fas fa-check-circle' },
    { label: 'Cancelled', value: 'CANCELLED', badge: 'CANCELLED', badgeClass: 'bg-red-100 text-red-800', icon: 'fas fa-ban' }
  ]);

  openCreateModal() {
    this.isEditing.set(false);
    this.currentGoalId = null;
    this.goalForm.reset({ category: 'WORK', weightage: 0, status: 'PENDING' });
    this.showModal.set(true);
  }

  openEditModal(goal: Goal) {
    this.isEditing.set(true);
    this.currentGoalId = goal.id;
    this.goalForm.patchValue({
      title: goal.title,
      description: goal.description,
      category: goal.category,
      weightage: goal.weightage,
      cycle: goal.cycle,
      status: goal.status
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  onSubmit() {
    if (this.goalForm.invalid) {
      this.errorHandler.showError('Please fill in all required fields');
      return;
    }

    const data = this.goalForm.value;

    if (this.isEditing() && this.currentGoalId) {
      this.performanceService.updateGoal(this.currentGoalId, data).subscribe({
        next: () => {
          this.errorHandler.showSuccess('Goal updated successfully');
          this.loadGoals();
          this.closeModal();
        },
        error: (err) => this.errorHandler.handleHttpError(err, 'Failed to update goal')
      });
    } else {
      this.performanceService.createGoal(data).subscribe({
        next: () => {
          this.errorHandler.showSuccess('Goal created successfully');
          this.loadGoals();
          this.closeModal();
        },
        error: (err) => this.errorHandler.handleHttpError(err, 'Failed to create goal')
      });
    }
  }

  deleteGoal(id: number) {
    if (confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      this.performanceService.deleteGoal(id).subscribe({
        next: () => {
          this.errorHandler.showSuccess('Goal deleted successfully');
          this.loadGoals();
        },
        error: (err) => this.errorHandler.handleHttpError(err, 'Failed to delete goal')
      });
    }
  }

  get totalWeightage(): number {
    return this.goals().reduce((sum, goal) => sum + goal.weightage, 0);
  }

  getProgressColor(progress: number): string {
    if (progress >= 75) return 'text-green-600';
    if (progress >= 50) return 'text-blue-600';
    if (progress >= 25) return 'text-yellow-600';
    return 'text-gray-600';
  }

  getStatusBadge(status: string): string {
    const map: Record<string, string> = {
      'PENDING': 'badge-pending',
      'IN_PROGRESS': 'badge-progress',
      'COMPLETED': 'badge-completed',
      'CANCELLED': 'badge-cancelled'
    };
    return map[status] || 'badge-pending';
  }
}
