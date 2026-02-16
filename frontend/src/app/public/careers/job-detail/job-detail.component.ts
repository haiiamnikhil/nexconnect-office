import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RecruitmentService, JobPosting } from '../../../core/recruitment.service';

@Component({
  selector: 'app-public-job-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './job-detail.component.html'
})
export class PublicJobDetailComponent implements OnInit {
  job = signal<JobPosting | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string>('');

  // Application Form
  showApplyModal = false;
  applicant = {
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  };
  resumeFile: File | null = null;
  isSubmitting = false;

  constructor(
    private route: ActivatedRoute,
    private recruitmentService: RecruitmentService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadJob(Number(id));
    }
  }

  loadJob(id: number) {
    this.isLoading.set(true);
    this.recruitmentService.getPublicJob(id).subscribe({
      next: (data: JobPosting) => {
        this.job.set(data);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        this.error.set('Job not found or no longer available.');
        this.isLoading.set(false);
      }
    });
  }

  openApplyModal() {
    this.showApplyModal = true;
  }

  onFileSelected(event: any) {
    this.resumeFile = event.target.files[0];
  }

  submitApplication() {
    if (!this.job()) return;
    
    this.isSubmitting = true;
    const formData = new FormData();
    formData.append('job_id', this.job()!.id.toString());
    formData.append('first_name', this.applicant.first_name);
    formData.append('last_name', this.applicant.last_name);
    formData.append('email', this.applicant.email);
    formData.append('phone', this.applicant.phone);
    
    if (this.resumeFile) {
      formData.append('resume', this.resumeFile);
    }

    this.recruitmentService.applyToJob(formData).subscribe({
      next: () => {
        alert('Application submitted successfully!');
        this.showApplyModal = false;
        this.isSubmitting = false;
        // Reset form
        this.applicant = { first_name: '', last_name: '', email: '', phone: '' };
        this.resumeFile = null;
      },
      error: (err: any) => {
        alert(err.error?.error || 'Failed to apply');
        this.isSubmitting = false;
      }
    });
  }
}
