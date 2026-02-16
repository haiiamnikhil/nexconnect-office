import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AppraisalCycle {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
}

export interface Goal {
  id: number;
  title: string;
  description: string;
  category: 'WORK' | 'DEVELOPMENT';
  weightage: number;
  progress: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  cycle: number;
}

export interface Review {
  id: number;
  employee_name: string;
  cycle_name: string;
  reviewer_name: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  self_rating?: string;
  manager_rating?: string;
  final_rating?: string;
  goals_achievement?: number;
  competency_rating?: number;
  overall_rating?: number;
  strengths?: string;
  areas_for_improvement?: string;
  comments?: string;
  self_assessment?: string;
}

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/hrms/performance`;

  // Cycles
  getCycles(): Observable<AppraisalCycle[]> {
    return this.http.get<AppraisalCycle[]>(`${this.apiUrl}/cycles/`);
  }

  // Goals
  getMyGoals(): Observable<Goal[]> {
    return this.http.get<Goal[]>(`${this.apiUrl}/goals/`);
  }

  createGoal(data: any): Observable<Goal> {
    return this.http.post<Goal>(`${this.apiUrl}/goals/`, data);
  }

  updateGoal(id: number, data: any): Observable<Goal> {
    return this.http.patch<Goal>(`${this.apiUrl}/goals/${id}/`, data);
  }

  deleteGoal(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/goals/${id}/`);
  }

  // Reviews
  getMyReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/reviews/`);
  }

  getReview(id: number): Observable<Review> {
    return this.http.get<Review>(`${this.apiUrl}/reviews/${id}/`);
  }

  submitSelfReview(id: number, data: any): Observable<Review> {
    return this.http.post<Review>(`${this.apiUrl}/reviews/${id}/submit_self_review/`, data);
  }

  submitManagerReview(id: number, data: any): Observable<Review> {
    return this.http.post<Review>(`${this.apiUrl}/reviews/${id}/submit_manager_review/`, data);
  }

  // Self Appraisal
  submitSelfAppraisal(id: number, data: any): Observable<Review> {
    return this.http.post<Review>(`${this.apiUrl}/reviews/${id}/submit_self_appraisal/`, data);
  }

  // Team Reviews (for managers)
  getTeamReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/reviews/team/`);
  }
}
