import { IAttendance } from '../../interfaces/models/attendance/IAttendance';

/**
 * Attendance View Model
 * 
 * Separates presentation logic from business logic (SRP)
 * - Contains only UI-specific data
 * - Derived from business models but adds display logic
 */
export interface AttendanceViewModel {
  // Core data
  id: number;
  date: string;
  employeeId: number;
  employeeName: string;
  
  // Display formatting
  displayDate: string;
  checkInTime: string;
  checkOutTime: string;
  workingHours: string;
  
  // UI state
  statusBadge: {
    text: string;
    class: string;
  };
  
  // Permissions
  canEdit: boolean;
  canDelete: boolean;
  canPunchOut: boolean;
  
  // Visual flags
  isToday: boolean;
  isIncomplete: boolean;
}

/**
 * Badge configuration for different statuses
 */
export interface BadgeConfig {
  text: string;
  class: string;
}
