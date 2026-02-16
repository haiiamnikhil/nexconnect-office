import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { ColumnDef, RowAction } from '../../../../shared/components/data-table/data-table.types';
import { AuthService } from '../../../../core/auth.service';

interface JobApplication {
  id: number;
  candidate_name: string; // Preprocessed
  job_title: string;      // Preprocessed
  current_stage: string;
  applied_at: string;
  // Raw data needed for logic
  candidate: { first_name: string, last_name: string, email: string };
  job: { title: string };
}

import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-job-application-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  templateUrl: './job-application-list.component.html'
})
export class JobApplicationListComponent implements OnInit {
  applications: JobApplication[] = [];
  
  columns: ColumnDef[] = [
    { field: 'candidate_name', header: 'Candidate' },
    { field: 'job_title', header: 'Job' },
    { field: 'current_stage', header: 'Stage', type: 'badge', badgeColors: {
      'APPLIED': 'bg-blue-50 text-blue-700',
      'SCREENING': 'bg-indigo-50 text-indigo-700',
      'INTERVIEW': 'bg-purple-50 text-purple-700',
      'OFFER': 'bg-yellow-50 text-yellow-700',
      'HIRED': 'bg-green-50 text-green-700',
      'REJECTED': 'bg-red-50 text-red-700'
    }},
    { field: 'applied_at', header: 'Applied Date', type: 'date', format: 'mediumDate' }
  ];

  actions: RowAction[] = [
    { label: 'Hire', action: 'hire', icon: 'fas fa-user-check', classes: 'text-green-600 hover:bg-green-50' },
    { label: 'Reject', action: 'reject', icon: 'fas fa-times', classes: 'text-red-600 hover:bg-red-50' }
  ];

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit() {
    this.loadApplications();
  }

  loadApplications() {
    this.http.get<any>(`${environment.apiUrl}/hrms/recruitment/applications/`, {
      headers: this.authService.getHeaders()
    }).subscribe(data => {
      const results = Array.isArray(data) ? data : (data.results || []);
      this.applications = results.map((app: any) => ({
        ...app,
        candidate_name: `${app.candidate.first_name} ${app.candidate.last_name}`,
        job_title: app.job.title
      }));
    });
  }

  handleAction(event: { action: string, row: any }) {
    if (event.action === 'hire') {
      this.changeStage(event.row.id, 'HIRED');
    } else if (event.action === 'reject') {
      this.changeStage(event.row.id, 'REJECTED');
    }
  }

  changeStage(id: number, stage: string) {
    if (!confirm(`Are you sure you want to mark this candidate as ${stage}?`)) return;

    this.http.post(`${environment.apiUrl}/hrms/applications/${id}/change_stage/`, { stage }, {
      headers: this.authService.getHeaders()
    }).subscribe({
      next: (res: any) => {
        alert('Stage updated successfully!');
        if (stage === 'HIRED' && res.warning) {
             alert(`Warning: ${res.warning}`);
        }
        this.loadApplications();
      },
      error: (err) => alert('Failed to update stage')
    });
  }
}
