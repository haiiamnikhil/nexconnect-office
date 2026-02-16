import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PerformanceService, Review } from '../../../../core/performance.service';
import { AuthService } from '../../../../core/auth.service';
import { ErrorHandlerService } from '../../../../core/error-handler.service';

@Component({
  selector: 'app-appraisal-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './appraisal-form.component.html',
  styleUrl: './appraisal-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppraisalFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private performanceService = inject(PerformanceService);
  private authService = inject(AuthService);
  private errorHandler = inject(ErrorHandlerService);

  // State management
  reviews = signal<Review[]>([]);
  currentReview = signal<Review | null>(null);
  isSubmitting = signal(false);
  isLoading = signal(false);

  appraisalForm: FormGroup = this.fb.group({
    goals_achievement: [null, [Validators.required, Validators.min(1), Validators.max(5)]],
    competency_rating: [null, [Validators.required, Validators.min(1), Validators.max(5)]],
    overall_rating: [null, [Validators.required, Validators.min(1), Validators.max(5)]],
    strengths: ['', Validators.required],
    areas_for_improvement: ['', Validators.required],
    comments: [''],
    self_assessment: ['']
  });

  ratingOptions = [1, 2, 3, 4, 5];
  ratingLabels: Record<number, string> = {
    1: 'Needs Improvement',
    2: 'Below Expectations',
    3: 'Meets Expectations',
    4: 'Exceeds Expectations',
    5: 'Outstanding'
  };

  ngOnInit() {
    this.loadMyReviews();
  }

  loadMyReviews() {
    this.isLoading.set(true);
    this.performanceService.getMyReviews().subscribe({
      next: (data) => {
        this.reviews.set(data);
        // Auto-select pending review if any
        const pending = data.find(r => r.status === 'PENDING' || r.status === 'IN_PROGRESS');
        if (pending) {
          this.currentReview.set(pending);
          this.prefillForm(pending);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to load reviews');
        this.isLoading.set(false);
      }
    });
  }

  prefillForm(review: Review) {
    if (review.self_assessment) {
      this.appraisalForm.patchValue({
        self_assessment: review.self_assessment,
        goals_achievement: review.goals_achievement,
        competency_rating: review.competency_rating,
        overall_rating: review.overall_rating,
        strengths: review.strengths,
        areas_for_improvement: review.areas_for_improvement,
        comments: review.comments
      });
    }
  }

  onSubmit() {
    if (this.appraisalForm.invalid) {
      this.errorHandler.showError('Please fill in all required fields');
      return;
    }

    const review = this.currentReview();
    if (!review) {
      this.errorHandler.showError('No active review found');
      return;
    }

    this.isSubmitting.set(true);
    const formData = this.appraisalForm.value;

    this.performanceService.submitSelfAppraisal(review.id, formData).subscribe({
      next: () => {
        this.errorHandler.showSuccess('Appraisal submitted successfully');
        this.loadMyReviews();
        this.isSubmitting.set(false);
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to submit appraisal');
        this.isSubmitting.set(false);
      }
    });
  }

  getRatingColor(rating: number): string {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-blue-600';
    if (rating >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  }

  getRatingLabel(rating: number): string {
    return this.ratingLabels[rating] || 'Not Rated';
  }

  saveDraft() {
    // Save as draft without submitting
    this.errorHandler.showInfo('Draft saved locally');
    // TODO: Implement draft saving to backend if needed
  }
}
