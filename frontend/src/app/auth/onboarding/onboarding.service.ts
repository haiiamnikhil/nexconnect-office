import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth.service';

export interface OnboardingStatus {
  step: number;
  is_complete: boolean;
  currency: string;
  status_actions: Record<string, any>;
}

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
  private http = inject(HttpClient);
  private authService: AuthService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/auth/onboarding`;

  currentStep = signal<number>(1);
  onboardingState = signal<OnboardingStatus | null>(null);

  getStatus(): Observable<OnboardingStatus> {
    return this.http.get<OnboardingStatus>(`${this.apiUrl}/status/`).pipe(
      tap(status => {
        this.onboardingState.set(status);
        this.currentStep.set(Number(status.step));
      })
    );
  }

  updateStep(step: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/update_step/`, { step, data }).pipe(
      tap((res: any) => {
        // Update local state optimistic/based on response
        if (res.current_step) {
            this.currentStep.set(res.current_step);
            this.onboardingState.update(s => s ? { ...s, step: res.current_step } : null);
        }
      })
    );
  }

  completeOnboarding(): Observable<any> {
    return this.http.post(`${this.apiUrl}/complete/`, {}).pipe(
      tap(() => {
        // Update user's local state to reflect completion?
        // Maybe refresh user profile or just redirect
        this.authService.refreshUserProfile().subscribe();
      })
    );
  }
}
