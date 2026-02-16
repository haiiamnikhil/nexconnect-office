
import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttendanceService, Attendance } from '../../../../core/attendance.service';
import { EmployeeService } from '../../../../core/employee.service';
import { ToastService } from '../../../../core/toast.service';

@Component({
  selector: 'app-punch-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './punch-widget.component.html',
  styles: []
})
export class PunchWidgetComponent implements OnInit, OnDestroy {
  attendanceService = inject(AttendanceService);
  employeeService = inject(EmployeeService);
  toastService = inject(ToastService);

  isLoading = signal(true);
  actionLoading = signal(false);
  
  currentEmployeeId: number | null = null;
  todayAttendance: Attendance | null = null;
  
  timerSubscription: any;
  timerDisplay: string = '00:00:00';
  isPunchedIn: boolean = false;

  ngOnInit() {
    this.employeeService.getCurrentEmployee().subscribe({
      next: (employee) => {
        this.currentEmployeeId = employee.id!;
        this.loadTodayStatus();
      },
      error: () => {
         this.isLoading.set(false);
      }
    });
  }

  ngOnDestroy() {
     if (this.timerSubscription) clearInterval(this.timerSubscription);
  }

  loadTodayStatus() {
    if (!this.currentEmployeeId) return;
    
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    this.attendanceService.getAttendances({ employee: this.currentEmployeeId, date: dateStr }).subscribe({
        next: (data) => {
            const records = Array.isArray(data) ? data : (data.results || []);
            this.todayAttendance = records.length > 0 ? records[0] : null;
            this.updateState();
            this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
    });
  }

  updateState() {
     if (this.todayAttendance?.check_in && !this.todayAttendance?.check_out) {
        this.isPunchedIn = true;
        this.startTimer(this.todayAttendance.check_in, this.todayAttendance.date);
     } else {
        this.isPunchedIn = false;
        localStorage.removeItem('lastPunchIn');
        if (this.timerSubscription) clearInterval(this.timerSubscription);
        
        // Show total hours if checked out, else 00:00:00
        this.timerDisplay = this.todayAttendance?.working_hours 
            ? `${this.todayAttendance.working_hours} hrs` 
            : '00:00:00';
     }
  }

  startTimer(startTimeStr: string, dateStr: string) {
     if (this.timerSubscription) clearInterval(this.timerSubscription);
     
     // Parse backend time (HH:mm:ss) and date (YYYY-MM-DD)
     const [y, month, day] = dateStr.split('-').map(Number);
     const [hours, minutes, seconds] = startTimeStr.split('.')[0].split(':').map(Number);
     
     const startDate = new Date(y, month - 1, day, hours, minutes, seconds || 0, 0);
     
     this.timerSubscription = setInterval(() => {
         const now = new Date();
         let diff = now.getTime() - startDate.getTime();
         if (diff < 0) diff = 0;
         
         const h = Math.floor(diff / 3600000);
         const m = Math.floor((diff % 3600000) / 60000);
         const s = Math.floor((diff % 60000) / 1000);
         
         this.timerDisplay = `${this.pad(h)}:${this.pad(m)}:${this.pad(s)}`;
     }, 1000);
  }

  pad(n: number) { return n.toString().padStart(2, '0'); }

  checkIn() {
    if (!this.currentEmployeeId) {
        this.toastService.error('Employee profile not found. Please contact HR.');
        return;
    }
    this.actionLoading.set(true);
    
    this.attendanceService.checkIn(this.currentEmployeeId).subscribe({
        next: () => {
            this.toastService.success('Checked in!');
            this.loadTodayStatus();
            this.actionLoading.set(false);
        },
        error: (err) => {
            this.toastService.error(err.error?.detail || 'Check-in failed');
            this.actionLoading.set(false);
        }
    });
  }

  checkOut() {
      if (!this.currentEmployeeId) {
          this.toastService.error('Employee profile not found. Please contact HR.');
          return;
      }
      this.actionLoading.set(true);
      
      this.attendanceService.checkOut(this.currentEmployeeId).subscribe({
          next: () => {
              this.toastService.success('Checked out!');
              this.loadTodayStatus();
              this.actionLoading.set(false);
          },
          error: (err) => {
              this.toastService.error(err.error?.detail || 'Check-out failed');
              this.actionLoading.set(false);
          }
      });
  }
}
