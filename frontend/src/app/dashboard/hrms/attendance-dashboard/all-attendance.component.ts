import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, Attendance } from '../../../core/attendance.service';
import { ErrorHandlerService } from '../../../core/error-handler.service';
import { EmployeeService, Employee } from '../../../core/employee.service';
import { DropdownComponent } from '../../../shared/components/dropdown/dropdown.component';
import { AuthService } from '../../../core/auth.service';// SOLID Architecture Services
import { AttendanceFilterService } from '../../../core/services/attendance-filter.service';
import { AttendanceStatsCalculator, AttendanceStats } from '../../../core/services/attendance-stats-calculator.service';
import { IAttendanceFilter } from '../../../core/interfaces/models/attendance/IAttendance';
import { getToday } from '../../../core/utils/date/date.utils';

@Component({
  selector: 'app-all-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownComponent],
  templateUrl: './all-attendance.component.html'
})
export class AllAttendanceComponent implements OnInit {
    // Services (following Dependency Inversion Principle)
    attendanceService = inject(AttendanceService);
    employeeService = inject(EmployeeService);
    errorHandler = inject(ErrorHandlerService);
    authService = inject(AuthService);    
    // NEW: SOLID Architecture Services
    private filterService = inject(AttendanceFilterService);
    private statsCalculator = inject(AttendanceStatsCalculator);
    
    isLoading = signal(false);
    attendanceList = signal<Attendance[]>([]);
    filteredList = signal<Attendance[]>([]);
    employees = signal<Employee[]>([]); // List of all employees for manual punch
    
    // Computed Options
    employeeOptions = computed(() => 
        this.employees().map(e => ({
            label: `${e.first_name} ${e.last_name}`,
            value: e.id,
            description: e.employee_code,
            icon: 'fas fa-user-circle'
        }))
    );
    
    filterDate = getToday(); // Using utility function (SRP)
    searchQuery = '';
    
    stats = signal<AttendanceStats>({ present: 0, late: 0, absent: 0, onLeave: 0, halfDay: 0, total: 0 });

    selectedEmployeeId = signal<number | null>(null);
    selectedEmployeeName = signal<string>('');
    employeeHistory = signal<Attendance[]>([]);
    historyLoading = signal(false);

    // Edit Modal State
    showEditModal = signal(false);
    selectedRecord = signal<Attendance | null>(null);
    editForm = signal({ check_in: '', check_out: '' });

    // Punch In Modal State
    showPunchInModal = signal(false);
    punchInForm = signal<{employeeId: number | null, check_in: string}>({ employeeId: null, check_in: '' });

    ngOnInit() {
        this.loadAttendance();
        this.loadEmployees();
    }

    loadEmployees() {
        this.employeeService.getEmployees().subscribe({
            next: (data: any) => {
                const list = Array.isArray(data) ? data : (data.results || []);
                this.employees.set(list);
            }
        });
    }

    loadAttendance() {
        this.isLoading.set(true);
        this.attendanceService.getAttendances({ date: this.filterDate }).subscribe({
            next: (data: any) => {
                const records = Array.isArray(data) ? data : (data.results || []);
                this.attendanceList.set(records);
                this.filterData();
                this.calculateStats(records);
                this.isLoading.set(false);
            },
            error: (err: any) => {
                this.errorHandler.handleHttpError(err);
                this.isLoading.set(false);
            }
        });
    }

    /**
     * Filter attendance data using AttendanceFilterService (SRP)
     * Business logic delegated to dedicated service
     */
    filterData() {
        const allRecords = this.attendanceList();
        
        // Use filter service for date filtering
        const filters: IAttendanceFilter = {
            date: this.filterDate || undefined
        };
        // Type assertion - Attendance is compatible with IAttendance runtime structure
        let filtered = this.filterService.filter(allRecords as any, filters);
        
        // Search filtering (could also be moved to service in future)
        if (this.searchQuery) {
            filtered = this.filterService.filterByEmployeeName(filtered, this.searchQuery);
        }
        
        this.filteredList.set(filtered);
        this.calculateStats(filtered);
    }
    
    /**
     * Calculate statistics using AttendanceStatsCalculator (SRP)
     * Business logic delegated to dedicated service
     */
    calculateStats(data: Attendance[]) {
        // Delegate to stats calculator service
        const stats = this.statsCalculator.calculateStats(data as any);
        this.stats.set(stats);
    }

    openHistory(employeeId: number, employeeName: string) {
        this.selectedEmployeeId.set(employeeId);
        this.selectedEmployeeName.set(employeeName);
        this.loadEmployeeHistory(employeeId);
    }

    closeHistory() {
        this.selectedEmployeeId.set(null);
        this.employeeHistory.set([]);
    }

    loadEmployeeHistory(employeeId: number) {
        this.historyLoading.set(true);
        // Use filterService to get current month records
        const month = new Date().toISOString().slice(0, 7); // YYYY-MM
        this.attendanceService.getMonthlyAttendance(employeeId, month).subscribe({
            next: (data: any) => {
                 const records = Array.isArray(data) ? data : (data.results || []);
                 this.employeeHistory.set(records);
                 this.historyLoading.set(false);
            },
            error: (err) => {
                this.errorHandler.handleHttpError(err);
                this.historyLoading.set(false);
            } 
        });
    }

    // --- Edit Actions ---

    openEditModal(record: Attendance, event: Event) {
        event.stopPropagation(); // Prevent opening history
        this.selectedRecord.set(record);
        this.editForm.set({
            check_in: record.check_in ? record.check_in.slice(0, 5) : '',
            check_out: record.check_out ? record.check_out.slice(0, 5) : ''
        });
        this.showEditModal.set(true);
    }

    closeEditModal() {
        this.showEditModal.set(false);
        this.selectedRecord.set(null);
    }

    saveEdit() {
        const record = this.selectedRecord();
        const form = this.editForm();
        
        if (!record || !record.id) return;

        // Prepare payload
        // We need to send full time string 'HH:MM:SS' usually, or backend parses.
        // Backend attendance expects TimeField? Serializer handles string.
        
        const payload: any = {};
        if (form.check_in) payload.check_in = form.check_in; // "HH:MM"
        if (form.check_out) payload.check_out = form.check_out;
        
        // If changing time, maybe clear status if it was absent? 
        // Backend calculate_working_hours will handle hours.
        // But status might need manual update if it was ABSENT.
        // For now, let's just update times.

        this.isLoading.set(true);
        this.attendanceService.updateAttendance(record.id, payload).subscribe({
            next: (updated) => {
                // Update local list
                const list = this.attendanceList().map(r => r.id === updated.id ? updated : r);
                this.attendanceList.set(list);
                this.filterData();
                this.closeEditModal();
                this.isLoading.set(false);
            },
            error: (err) => {
                this.errorHandler.handleHttpError(err);
                this.isLoading.set(false);
            }
        });
    }

    // --- Admin Punch Actions ---
    
    adminPunchOut(record: Attendance, event: Event) {
        event.stopPropagation();
        if (!confirm(`Punch Out for ${record.employee_name}?`)) return;

        this.isLoading.set(true);
        // Pass the date to ensure we find the correct attendance record
        this.attendanceService.checkOut(record.employee, undefined, record.date).subscribe({
             next: (updated) => {
                // Update local list
                // The returned object is the updated attendance
                const list = this.attendanceList().map(r => r.id === updated.id ? updated : r);
                this.attendanceList.set(list);
                this.filterData();
                this.isLoading.set(false);
            },
            error: (err) => {
                this.errorHandler.handleHttpError(err);
                this.isLoading.set(false);
            }
        });
    }

    // --- Manual Punch In ---

    openPunchInModal() {
        this.punchInForm.set({ employeeId: null, check_in: '' });
        this.showPunchInModal.set(true);
        if (this.employees().length === 0) {
            this.loadEmployees();
        }
    }

    closePunchInModal() {
        this.showPunchInModal.set(false);
    }

    savePunchIn() {
        const form = this.punchInForm();
        if (!form.employeeId) return;

        let customTime = undefined;
        if (form.check_in) {
            // Combine today (filterDate or real today) + check_in time
            const dateStr = this.filterDate || new Date().toISOString().split('T')[0];
            customTime = `${dateStr} ${form.check_in}:00`; 
            // Better: use ISO if backend supports it, or simple string 'YYYY-MM-DD HH:MM:SS'
            // The service sends whatever customTime is. 
            // Admin punch usually implies "Today" or "Selected Date". 
            // Since we view 'filterDate', assumption is we want to punch for that date.
        }

        this.isLoading.set(true);
        this.attendanceService.checkIn(form.employeeId, customTime).subscribe({
            next: (data) => {
                // If the punched record matches current filter, add it
                if (data.date === this.filterDate) {
                    const list = [...this.attendanceList(), data]; 
                    // Or replace if exists? API get_or_create.
                    // Ideally reload to be safe or dedup. 
                    this.loadAttendance(); 
                } else {
                     this.loadAttendance(); // Just reload everything
                }
                this.closePunchInModal();
                this.isLoading.set(false);
            },
            error: (err) => {
                this.errorHandler.handleHttpError(err);
                this.isLoading.set(false);
            }
        });
    }
}
