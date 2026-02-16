import { Injectable } from '@angular/core';
import { IAttendance } from '../interfaces/models/attendance/IAttendance';
import { AttendanceViewModel, BadgeConfig } from '../models/view-models/attendance.viewmodel';
import { formatTime, isToday } from '../utils/date/date.utils';

/**
 * Attendance View Model Mapper
 * 
 * Follows Single Responsibility Principle (SRP):
 * - Only responsible for mapping domain models to view models
 * - Contains all presentation formatting logic
 * - Keeps components clean and focused on rendering
 */
@Injectable({
  providedIn: 'root'
})
export class AttendanceViewModelMapper {

  /**
   * Map domain model to view model
   * @param attendance - Domain model from API
   * @param currentUserRole - Current user's role for permissions
   * @returns View model ready for display
   */
  toViewModel(attendance: IAttendance, currentUserRole?: string): AttendanceViewModel {
    const isTodayDate = isToday(attendance.date);
    const isIncomplete = !attendance.check_out;
    
    return {
      // Core data
      id: attendance.id!,
      date: attendance.date,
      employeeId: attendance.employee,
      employeeName: attendance.employee_name || 'Unknown',
      
      // Display formatting
      displayDate: this.formatDisplayDate(attendance.date),
      checkInTime: formatTime(attendance.check_in),
      checkOutTime: formatTime(attendance.check_out),
      workingHours: this.formatWorkingHours(attendance.working_hours),
      
      // UI state
      statusBadge: this.getStatusBadge(attendance.status),
      
      // Permissions (simplified - should come from permission service in real app)
      canEdit: this.canEdit(attendance, currentUserRole),
      canDelete: this.canDelete(attendance, currentUserRole),
      canPunchOut: isTodayDate && isIncomplete && this.isAdmin(currentUserRole),
      
      // Visual flags
      isToday: isTodayDate,
      isIncomplete
    };
  }

  /**
   * Map array of domain models to view models
   * @param attendances - Array of domain models
   * @param currentUserRole - Current user's role
   * @returns Array of view models
   */
  toViewModelList(attendances: IAttendance[], currentUserRole?: string): AttendanceViewModel[] {
    return attendances.map(attendance => this.toViewModel(attendance, currentUserRole));
  }

  /**
   * Format date for display
   * @param date - ISO date string
   * @returns Human-readable date
   */
  private formatDisplayDate(date: string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Format working hours for display
   * @param hours - Number of hours
   * @returns Formatted hours string
   */
  private formatWorkingHours(hours: number): string {
    if (!hours || hours === 0) return '0 hrs';
    return `${hours.toFixed(2)} hrs`;
  }

  /**
   * Get badge configuration for status
   * @param status - Attendance status
   * @returns Badge configuration
   */
  private getStatusBadge(status: string): BadgeConfig {
    const badges: Record<string, BadgeConfig> = {
      'PRESENT': {
        text: 'Present',
        class: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400'
      },
      'ABSENT': {
        text: 'Absent',
        class: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400'
      },
      'HALF_DAY': {
        text: 'Half Day',
        class: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400'
      },
      'ON_LEAVE': {
        text: 'On Leave',
        class: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400'
      }
    };

    return badges[status] || {
      text: status,
      class: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400'
    };
  }

  /**
   * Check if user can edit attendance record
   * @param attendance - Attendance record
   * @param role - User role
   * @returns True if can edit
   */
  private canEdit(attendance: IAttendance, role?: string): boolean {
    return this.isAdmin(role);
  }

  /**
   * Check if user can delete attendance record
   * @param attendance - Attendance record
   * @param role - User role
   * @returns True if can delete
   */
  private canDelete(attendance: IAttendance, role?: string): boolean {
    return this.isAdmin(role);
  }

  /**
   * Check if user is admin
   * @param role - User role
   * @returns True if admin
   */
  private isAdmin(role?: string): boolean {
    return role === 'SUPER_ADMIN' || role === 'ADMIN';
  }
}
