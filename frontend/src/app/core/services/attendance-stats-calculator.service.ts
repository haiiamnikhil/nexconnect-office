import { Injectable } from '@angular/core';
import { IAttendance } from '../interfaces/models/attendance/IAttendance';

/**
 * Attendance Statistics Calculator
 * 
 * Follows Single Responsibility Principle (SRP):
 * - Only responsible for calculating statistics from attendance data
 * - Pure calculation logic with no side effects
 * - Easily testable
 */
@Injectable({
  providedIn: 'root'
})
export class AttendanceStatsCalculator {

  /**
   * Calculate attendance statistics from records
   * @param records - Array of attendance records
   * @returns Statistics object with counts
   */
  calculateStats(records: IAttendance[]): AttendanceStats {
    const stats: AttendanceStats = {
      present: 0,
      late: 0,
      absent: 0,
      onLeave: 0,
      halfDay: 0,
      total: records.length
    };

    records.forEach(record => {
      switch (record.status) {
        case 'PRESENT':
          stats.present++;
          break;
        case 'LATE':
        case 'HALF_DAY':
          stats.late++;
          if (record.status === 'HALF_DAY') {
            stats.halfDay++;
          }
          break;
        case 'ABSENT':
          stats.absent++;
          break;
        case 'ON_LEAVE':
        case 'HOLIDAY':
        case 'WEEK_OFF':
          stats.onLeave++;
          break;
      }
    });

    return stats;
  }

  /**
   * Calculate attendance percentage
   * @param stats - Attendance statistics
   * @returns Percentage of days present
   */
  calculateAttendancePercentage(stats: AttendanceStats): number {
    if (stats.total === 0) return 0;
    return (stats.present / stats.total) * 100;
  }

  /**
   * Calculate working days (excludes weekends and holidays)
   * @param stats - Attendance statistics
   * @returns Number of working days
   */
  calculateWorkingDays(stats: AttendanceStats): number {
    return stats.total - stats.onLeave;
  }
}

/**
 * Attendance statistics interface
 */
export interface AttendanceStats {
  present: number;
  late: number;
  absent: number;
  onLeave: number;
  halfDay: number;
  total: number;
}
