import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; // Keep Router for viewJob
import { RecruitmentService, JobPosting } from '../../../../core/recruitment.service';
import { OrgStructureService } from '../../../../core/org-structure.service';
import { ErrorHandlerService } from '../../../../core/error-handler.service';
import { AuthService } from '../../../../core/auth.service';
@Component({
  selector: 'app-job-board',
  standalone: true,
  imports: [CommonModule, RouterModule], 
  templateUrl: './job-board.component.html',
  styleUrl: './job-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobBoardComponent implements OnInit {
  private recruitmentService = inject(RecruitmentService);
  private errorHandler = inject(ErrorHandlerService);
  private router = inject(Router);
  authService = inject(AuthService);
  jobs = signal<JobPosting[]>([]);
  isLoading = signal(false);
  viewJob(id: number) {
    this.router.navigate(['/dashboard/recruitment/jobs', id]);
  }

  ngOnInit() {
    this.loadJobs();
  }

  loadJobs() {
    this.isLoading.set(true);
    this.recruitmentService.getJobs().subscribe({
      next: (data: any) => {
        const results = Array.isArray(data) ? data : (data.results || []);
        this.jobs.set(results);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to load job postings');
        this.isLoading.set(false);
      }
    });
  }

  openCreateModal() {
     this.router.navigate(['/dashboard/recruitment/jobs/create']);
  }

  getStatusBadge(status: string): string {
    const map: Record<string, string> = {
      'DRAFT': 'badge-draft',
      'OPEN': 'badge-open',
      'CLOSED': 'badge-closed',
      'HOLD': 'badge-hold'
    };
    return map[status] || 'badge-draft';
  }
}
