import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { RecruitmentService, JobPosting, JobApplication } from '../../../../core/recruitment.service';
import { AuthService } from '../../../../core/auth.service';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { ColumnDef } from '../../../../shared/components/data-table/data-table.types';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, DataTableComponent],
  templateUrl: './job-detail.component.html'
})
export class JobDetailComponent implements OnInit {
  job = signal<JobPosting | null>(null);
  applications = signal<JobApplication[]>([]);
  isLoading = signal<boolean>(true);
  
  // DataTable Config
  appColumns: ColumnDef[] = [
    { field: 'candidate_details.first_name', header: 'Candidate', format: (row: any) => `${row.candidate_details.first_name} ${row.candidate_details.last_name}` },
    { field: 'current_stage', header: 'Stage', type: 'badge', badgeColors: { 
        'APPLIED': 'bg-blue-100 text-blue-800', 
        'HIRED': 'bg-green-100 text-green-800',
        'REJECTED': 'bg-red-100 text-red-800'
      } 
    },
    { field: 'applied_at', header: 'Applied Date', type: 'date' }
  ];

  appActions = [
    { label: 'Screen', action: 'screen', class: 'text-blue-600' },
    { label: 'Reject', action: 'reject', class: 'text-red-600' }
  ];

  constructor(
    private route: ActivatedRoute,
    private recruitmentService: RecruitmentService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    const jobId = this.route.snapshot.paramMap.get('id');
    if (jobId) {
      this.loadData(Number(jobId));
    }
  }

  loadData(id: number) {
    this.isLoading.set(true);
    
    // ForkJoin or sequential? Sequential is fine for now.
    this.recruitmentService.getJob(id).subscribe({
        next: (job) => {
            this.job.set(job);
            // After job load, get applications
            this.recruitmentService.getApplications(id).subscribe({
                next: (apps) => {
                    this.applications.set(apps);
                    this.isLoading.set(false);
                }
            });
        },
        error: () => this.isLoading.set(false)
    });
  }

  refresh() {
    const job = this.job();
    if (job?.id) {
        this.loadData(job.id);
    }
  }

  handleAction(event: any) {
    const { action, row } = event;
    if (action === 'screen') {
        this.changeStage(row.id, 'SCREENING');
    } else if (action === 'reject') {
        this.changeStage(row.id, 'REJECTED');
    }
  }

  changeStage(appId: number, stage: string) {
    if (confirm(`Move candidate to ${stage}?`)) {
        this.recruitmentService.updateStage(appId, stage).subscribe(() => {
            const currentJobId = this.job()?.id;
            if (currentJobId) this.loadData(currentJobId);
        });
    }
  }
}
