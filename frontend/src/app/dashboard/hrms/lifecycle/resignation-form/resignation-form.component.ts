import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LifecycleService, OffboardingRequest } from '../../../../core/lifecycle.service';
import { AuthService } from '../../../../core/auth.service';
import { ErrorHandlerService } from '../../../../core/error-handler.service';

@Component({
  selector: 'app-resignation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './resignation-form.component.html',
  styleUrl: './resignation-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResignationFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private lifecycleService = inject(LifecycleService);
  private authService = inject(AuthService);
  private errorHandler = inject(ErrorHandlerService);

  // State management
  requests = signal<OffboardingRequest[]>([]);
  showModal = signal(false);
  isLoading = signal(false);
  noticePeriodDays = signal(30); // Default notice period

  resignationForm: FormGroup = this.fb.group({
    resignation_date: ['', Validators.required],
    last_working_day: ['', Validators.required],
    reason: ['', Validators.required]
  });

  reasonOptions = [
    'Better Opportunity',
    'Career Change',
    'Higher Compensation',
    'Relocation',
    'Personal Reasons',
    'Further Education',
    'Work-Life Balance',
    'Other'
  ];

  ngOnInit() {
    this.loadRequests();
    this.setupDateValidation();
  }

  setupDateValidation() {
    // Watch resignation_date and auto-calculate last_working_day
    this.resignationForm.get('resignation_date')?.valueChanges.subscribe(date => {
      if (date) {
        const resignationDate = new Date(date);
        const lastWorkingDay = new Date(resignationDate);
        lastWorkingDay.setDate(lastWorkingDay.getDate() + this.noticePeriodDays());
        
        this.resignationForm.patchValue({
          last_working_day: this.formatDate(lastWorkingDay)
        }, { emitEvent: false });
      }
    });
  }

  loadRequests() {
    this.isLoading.set(true);
    this.lifecycleService.getOffboardingRequests().subscribe({
      next: (data) => {
        this.requests.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to load resignation requests');
        this.isLoading.set(false);
      }
    });
  }
  
  openModal() {
    this.resignationForm.reset();
    // Set today as default resignation date
    this.resignationForm.patchValue({
      resignation_date: this.formatDate(new Date())
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  onSubmit() {
    if (this.resignationForm.invalid) {
      this.errorHandler.showError('Please fill in all required fields');
      return;
    }

    // Validate dates
    const resignDate = new Date(this.resignationForm.value.resignation_date);
    const lastDate = new Date(this.resignationForm.value.last_working_day);
    
    if (lastDate <= resignDate) {
      this.errorHandler.showError('Last working day must be after resignation date');
      return;
    }

    this.isLoading.set(true);
    this.lifecycleService.submitResignation(this.resignationForm.value).subscribe({
      next: () => {
        this.errorHandler.showSuccess('Resignation submitted successfully');
        this.loadRequests();
        this.closeModal();
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to submit resignation');
        this.isLoading.set(false);
      }
    });
  }

  getStatusBadge(status: string): string {
    const map: Record<string, string> = {
      'PENDING': 'badge-pending',
      'APPROVED': 'badge-success',
      'REJECTED': 'badge-error',
      'WITHDRAWN': 'badge-cancelled'
    };
    return map[status] || 'badge-pending';
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  withdrawRequest(request: OffboardingRequest) {
    if (confirm('Are you sure you want to withdraw this resignation request?')) {
      // TODO: Implement withdraw endpoint
      this.errorHandler.showInfo('Withdraw functionality coming soon');
    }
  }
}
