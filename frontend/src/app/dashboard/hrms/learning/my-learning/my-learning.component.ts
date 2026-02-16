import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../../../core/auth.service';
@Component({
  selector: 'app-my-learning',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-learning.component.html',
})
export class MyLearningComponent implements OnInit {
  authService = inject(AuthService);
  enrolledCourses: any[] = [];
  loading = true;
  ngOnInit() {
    this.loadEnrollments();
  }

  loadEnrollments() {
    // Mock data
    // Mock data removed.
    this.enrolledCourses = [];
    this.loading = false;
  }
}
