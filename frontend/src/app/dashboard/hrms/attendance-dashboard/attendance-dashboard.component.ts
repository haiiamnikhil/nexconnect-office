import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttendanceService, Attendance } from '../../../core/attendance.service';
import { EmployeeService, Employee } from '../../../core/employee.service';
import { ToastService } from '../../../core/toast.service';
import { AuthService } from '../../../core/auth.service';
import { AllAttendanceComponent } from './all-attendance.component';
import { PunchWidgetComponent } from './punch-widget/punch-widget.component';

@Component({
  selector: 'app-attendance-dashboard',
  standalone: true,
  imports: [CommonModule, AllAttendanceComponent, PunchWidgetComponent],
  templateUrl: './attendance-dashboard.component.html',
  styleUrl: './attendance-dashboard.component.scss'
})
export class AttendanceDashboardComponent implements OnInit {
  attendanceService = inject(AttendanceService);
  employeeService = inject(EmployeeService);
  toastService = inject(ToastService);
  authService = inject(AuthService);
  
  todayAttendance: Attendance | null = null;
  monthlyAttendance: Attendance[] = [];
  currentEmployeeId: number | null = null;
  
  ngOnInit() {
    // Only load personal data if NOT showing All Attendance (or if we want to show it anyway in bg)
    // For efficiency, check role first.
    if (!this.authService.hasRole('SUPER_ADMIN') && !this.authService.hasRole('ADMIN')) {
        this.loadEmployeeData();
    }
  }
  
  loadEmployeeData() {
    this.employeeService.getCurrentEmployee().subscribe({
      next: (employee) => {
        this.currentEmployeeId = employee.id!;
        this.loadTodayAttendance();
        this.loadMonthlyAttendance();
      },
      error: (err) => {
        this.toastService.error('Unable to load employee profile.');
      }
    });
  }
  
  loadTodayAttendance() {
    if (!this.currentEmployeeId) return;
    
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    this.attendanceService.getAttendances({ employee: this.currentEmployeeId, date: dateStr }).subscribe({
      next: (data) => {
        const records = Array.isArray(data) ? data : (data.results || []);
        this.todayAttendance = records.length > 0 ? records[0] : null;
      }
    });
  }
  
  loadMonthlyAttendance() {
    if (!this.currentEmployeeId) return;
    
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM
    this.attendanceService.getMonthlyAttendance(this.currentEmployeeId, month).subscribe({
      next: (data: any) => {
        this.monthlyAttendance = Array.isArray(data) ? data : (data.results || []);
      }
    });
  }
  
  formatTime(timeStr: string | undefined): string {
    if (!timeStr) return '--:--:--';
    return timeStr.split('.')[0]; 
  }
}
