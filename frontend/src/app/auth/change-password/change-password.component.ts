import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss'
})
export class ChangePasswordComponent {
  http = inject(HttpClient);
  router = inject(Router);
  authService = inject(AuthService);
  toastService = inject(ToastService);

  isLoading = signal(false);
  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);
  errorMessage = signal('');

  form = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  // Check if this is a forced password change
  isFirstTime = false;

  ngOnInit() {
    const currentUser = this.authService.currentUser();
    this.isFirstTime = currentUser?.must_change_password || false;
  }

  changePassword() {
    this.errorMessage.set('');

    // Validation
    if (!this.form.oldPassword || !this.form.newPassword || !this.form.confirmPassword) {
      this.errorMessage.set('All fields are required');
      return;
    }

    if (this.form.newPassword.length < 8) {
      this.errorMessage.set('New password must be at least 8 characters long');
      return;
    }

    if (this.form.newPassword !== this.form.confirmPassword) {
      this.errorMessage.set('New passwords do not match');
      return;
    }

    if (this.form.oldPassword === this.form.newPassword) {
      this.errorMessage.set('New password must be different from current password');
      return;
    }

    this.isLoading.set(true);



    this.http.post(`${environment.apiUrl}/auth/change-password/`, {
      old_password: this.form.oldPassword,
      new_password: this.form.newPassword,
      is_first_time: this.isFirstTime
    }).subscribe({
      next: (response: any) => {
        this.toastService.success(response.message || 'Password changed successfully');
        
        // If logout required (first-time change), logout and redirect to login
        if (response.logout_required || this.isFirstTime) {
          this.authService.logout();
          this.router.navigate(['/login']);
        } else {
          // Regular password change, go back to dashboard
          this.router.navigate(['/dashboard']);
        }
      },
      error: (error) => {
        this.errorMessage.set(error.error?.error || 'Failed to change password');
        this.isLoading.set(false);
      }
    });
  }

  cancel() {
    this.router.navigate(['/dashboard']);
  }
}
