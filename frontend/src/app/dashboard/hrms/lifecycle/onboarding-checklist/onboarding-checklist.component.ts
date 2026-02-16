import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LifecycleService, OnboardingTask } from '../../../../core/lifecycle.service';
import { EmployeeService } from '../../../../core/employee.service';
import { ErrorHandlerService } from '../../../../core/error-handler.service';

@Component({
  selector: 'app-onboarding-checklist',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './onboarding-checklist.component.html',
  styleUrl: './onboarding-checklist.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OnboardingChecklistComponent implements OnInit {
  private fb = inject(FormBuilder);
  private lifecycleService = inject(LifecycleService);
  private employeeService = inject(EmployeeService);
  private errorHandler = inject(ErrorHandlerService);

  // State management
  tasks = signal<OnboardingTask[]>([]);
  employees = signal<any[]>([]);
  showModal = signal(false);
  isLoading = signal(false);

  // Computed progress
  completionProgress = computed(() => {
    const allTasks = this.tasks();
    if (allTasks.length === 0) return 0;
    const completed = allTasks.filter(t => t.status === 'COMPLETED').length;
    return Math.round((completed / allTasks.length) * 100);
  });

  pendingTasks = computed(() =>
    this.tasks().filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS')
  );

  completedTasks = computed(() =>
    this.tasks().filter(t => t.status === 'COMPLETED')
  );

  taskForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    employee: [null, Validators.required],
    due_date: ['', Validators.required],
    status: ['PENDING']
  });

  ngOnInit() {
    this.loadTasks();
    this.loadEmployees();
  }

  loadTasks() {
    this.isLoading.set(true);
    this.lifecycleService.getOnboardingTasks().subscribe({
      next: (data) => {
        this.tasks.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to load onboarding tasks');
        this.isLoading.set(false);
      }
    });
  }

  loadEmployees() {
    this.employeeService.getEmployees({}).subscribe({
      next: (data) => this.employees.set(data.results || data),
      error: (err) => this.errorHandler.handleHttpError(err, 'Failed to load employees')
    });
  }
  
  openModal() {
    this.taskForm.reset({ status: 'PENDING' });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  onSubmit() {
    if (this.taskForm.invalid) {
      this.errorHandler.showError('Please fill in all required fields');
      return;
    }

    this.lifecycleService.createOnboardingTask(this.taskForm.value).subscribe({
      next: () => {
        this.errorHandler.showSuccess('Onboarding task created successfully');
        this.loadTasks();
        this.closeModal();
      },
      error: (err) => this.errorHandler.handleHttpError(err, 'Failed to create task')
    });
  }

  updateStatus(task: OnboardingTask, status: string) {
    this.lifecycleService.updateTaskStatus(task.id, status).subscribe({
      next: () => {
        this.errorHandler.showSuccess(`Task marked as ${status.toLowerCase()}`);
        // Optimistic update
        this.tasks.update(tasks =>
          tasks.map(t =>
            t.id === task.id ? { ...t, status: status as any } : t
          )
        );
      },
      error: (err) => this.errorHandler.handleHttpError(err, 'Failed to update task status')
    });
  }

  getStatusBadge(status: string): string {
    const map: Record<string, string> = {
      'PENDING': 'badge-pending',
      'IN_PROGRESS': 'badge-progress',
      'COMPLETED': 'badge-completed'
    };
    return map[status] || 'badge-pending';
  }

  getProgressBarColor(): string {
    const progress = this.completionProgress();
    if (progress === 100) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    return 'bg-yellow-500';
  }

  isOverdue(task: OnboardingTask): boolean {
    if (task.status === 'COMPLETED') return false;
    return new Date(task.due_date) < new Date();
  }
}
