import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RecruitmentService, Interview, JobApplication } from '../../../../core/recruitment.service';
import { EmployeeService } from '../../../../core/employee.service';
import { ErrorHandlerService } from '../../../../core/error-handler.service';
import { DropdownComponent } from '../../../../shared/components/dropdown/dropdown.component';

@Component({
  selector: 'app-interview-scheduler',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DropdownComponent],
  templateUrl: './interview-scheduler.component.html',
  styleUrl: './interview-scheduler.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InterviewSchedulerComponent implements OnInit {
  private fb = inject(FormBuilder);
  private recruitmentService = inject(RecruitmentService);
  private employeeService = inject(EmployeeService);
  private errorHandler = inject(ErrorHandlerService);

  // State management
  interviews = signal<Interview[]>([]);
  applications = signal<JobApplication[]>([]);
  employees = signal<any[]>([]);
  showModal = signal(false);
  isLoading = signal(false);

  // Dropdown Options
  applicationOptions = computed(() => 
    this.applications().map(app => ({
      label: `${app.candidate_details.first_name} ${app.candidate_details.last_name} - ${app.job_title}`,
      value: app.id,
      description: `Stage: ${app.current_stage}`,
      icon: 'fas fa-user-clock'
    }))
  );

  interviewerOptions = computed(() => 
    this.employees().map(emp => ({
      label: `${emp.first_name} ${emp.last_name}`,
      value: emp.id,
      description: emp.designation,
      icon: 'fas fa-user-tie'
    }))
  );

  interviewForm: FormGroup = this.fb.group({
    application: [null, Validators.required],
    interviewer: [null, Validators.required],
    start_time: ['', Validators.required],
    end_time: ['', Validators.required],
    link: [''],
    status: ['SCHEDULED']
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    
    // Load interviews
    this.recruitmentService.getInterviews().subscribe({
      next: (data) => this.interviews.set(data),
      error: (err) => this.errorHandler.handleHttpError(err, 'Failed to load interviews')
    });

    // Load applications in interview stage
    this.recruitmentService.getApplications().subscribe({
      next: (data) => {
        const relevant = data.filter(app =>
          ['SCREENING', 'INTERVIEW'].includes(app.current_stage)
        );
        this.applications.set(relevant);
      },
      error: (err) => this.errorHandler.handleHttpError(err, 'Failed to load applications')
    });

    // Load employees for interviewer dropdown
    this.employeeService.getEmployees({}).subscribe({
      next: (data) => {
        this.employees.set(data.results || data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to load employees');
        this.isLoading.set(false);
      }
    });
  }

  openModal() {
    this.interviewForm.reset({ status: 'SCHEDULED' });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  onSubmit() {
    if (this.interviewForm.invalid) {
      this.errorHandler.showError('Please fill in all required fields');
      return;
    }

    this.recruitmentService.createInterview(this.interviewForm.value).subscribe({
      next: () => {
        this.errorHandler.showSuccess('Interview scheduled successfully');
        this.loadData();
        this.closeModal();
      },
      error: (err) => this.errorHandler.handleHttpError(err, 'Failed to schedule interview')
    });
  }

  getStatusBadge(status: string): string {
    const map: Record<string, string> = {
      'SCHEDULED': 'badge-scheduled',
      'COMPLETED': 'badge-completed',
      'CANCELLED': 'badge-cancelled',
      'RESCHEDULED': 'badge-rescheduled'
    };
    return map[status] || 'badge-scheduled';
  }

  formatDateTime(dateTime: string): string {
    return new Date(dateTime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  isUpcoming(interview: Interview): boolean {
    return new Date(interview.start_time) > new Date();
  }
}
