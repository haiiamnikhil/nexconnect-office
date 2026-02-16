import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface JobPosting {
  id: number;
  title: string;
  department_name: string;
  location_name: string;
  type: string;
  status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'HOLD';
  applications_count: number;
  created_at: string;
}

export interface Candidate {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
}

export interface JobApplication {
  id: number;
  candidate_details: Candidate;
  job_title: string;
  current_stage: 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFERED' | 'HIRED' | 'REJECTED';
  rating: number;
  applied_at: string;
}

export interface Interview {
  id: number;
  candidate_name: string; // derived in serializer or frontend
  interviewer_name: string;
  start_time: string;
  end_time: string;
  status: string;
  link: string;
}

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RecruitmentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/hrms/recruitment`;

  // Jobs
  getJobs(): Observable<JobPosting[]> {
    return this.http.get<JobPosting[]>(`${this.apiUrl}/jobs/`);
  }

  createJob(data: any): Observable<JobPosting> {
    return this.http.post<JobPosting>(`${this.apiUrl}/jobs/`, data);
  }

  getJob(id: number): Observable<JobPosting> {
    return this.http.get<JobPosting>(`${this.apiUrl}/jobs/${id}/`);
  }

  getPublicJob(id: number): Observable<JobPosting> {
    return this.http.get<JobPosting>(`${this.apiUrl}/jobs/${id}/public_detail/`);
  }

  applyToJob(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/applications/public_apply/`, data);
  }

  // Candidates
  getCandidates(): Observable<Candidate[]> {
    return this.http.get<Candidate[]>(`${this.apiUrl}/candidates/`);
  }

  // Applications
  getApplications(jobId?: number): Observable<JobApplication[]> {
    let url = `${this.apiUrl}/applications/`;
    if (jobId) {
      url += `?job=${jobId}`;
    }
    return this.http.get<JobApplication[]>(url);
  }

  updateStage(id: number, stage: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/applications/${id}/change_stage/`, { stage });
  }

  // Interviews
  getInterviews(): Observable<Interview[]> {
    return this.http.get<Interview[]>(`${this.apiUrl}/interviews/`);
  }

  createInterview(data: any): Observable<Interview> {
    return this.http.post<Interview>(`${this.apiUrl}/interviews/`, data);
  }
}
