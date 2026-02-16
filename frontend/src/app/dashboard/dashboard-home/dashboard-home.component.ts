import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth.service';
import { DashboardService, DashboardStats } from '../../core/dashboard.service';
import { EmployeeDashboardComponent } from '../employee-dashboard/employee-dashboard.component';
import { PunchWidgetComponent } from '../hrms/attendance-dashboard/punch-widget/punch-widget.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterModule, EmployeeDashboardComponent, PunchWidgetComponent],
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.scss'
})
export class DashboardHomeComponent implements OnInit {
  authService = inject(AuthService);
  dashboardService = inject(DashboardService);
  
  stats = signal<DashboardStats | null>(null);

  ngOnInit() {
    if (this.authService.hasRole('Admin')) {
        this.loadStats();
    }
  }

  loadStats() {
    this.dashboardService.getStats().subscribe({
        next: (data) => this.stats.set(data),
        error: (err) => console.error('Failed to load dashboard stats', err)
    });
  }
}
