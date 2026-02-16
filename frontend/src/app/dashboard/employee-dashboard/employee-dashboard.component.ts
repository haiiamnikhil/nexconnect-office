import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './employee-dashboard.component.html',
  styleUrl: './employee-dashboard.component.scss'
})
export class EmployeeDashboardComponent {
  authService = inject(AuthService);
  
  // Mock data for "My Stats" - in real app would connect to services
  // Stats initialized to zero
  myStats = {
    leaveBalance: 0,
    attendanceStreak: 0,
    pendingTasks: 0,
    nextHoliday: 'None'
  };

  currentDate = new Date();
}
