import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  registerForm = this.fb.group({
    company_name: ['', Validators.required],
    domain: ['', [Validators.required, Validators.pattern('^[a-z0-9-]+$')]], // Slug pattern
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit() {
    if (this.registerForm.valid) {
      this.authService.register(this.registerForm.value).subscribe({
        next: () => {
             this.toastService.success('Registration successful! Redirecting to dashboard...');
             // Auth service usually handles redirect or state, but let's ensure navigation
             this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          const msg = err.error?.detail || 'Registration failed. Domain or username might be taken.';
          this.toastService.error(msg);
          console.error(err);
        }
      });
    }
  }
}
