import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';

import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-public-job-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './public-job-list.component.html'
})
export class PublicJobListComponent implements OnInit {
  jobs: any[] = [];
  isLoading = true;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadJobs();
  }

  viewDetails(id: number) {
    this.router.navigate(['/careers/jobs', id]);
  }

  loadJobs() {
    // No Auth Header needed for public endpoint
    this.http.get<any[]>(`${environment.apiUrl}/hrms/recruitment/jobs/public_jobs/`).subscribe({
      next: (data) => {
        this.jobs = data;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }
}
