import { Injectable } from '@angular/core';
import { IAttendance, IAttendanceFilter } from '../interfaces/models/attendance/IAttendance';

/**
 * Attendance Filtering Service
 * 
 * Follows Single Responsibility Principle (SRP):
 * - Only responsible for filtering attendance data
 * - No HTTP calls, no UI logic, no business rules
 * - Pure filtering logic that can be easily tested
 */
@Injectable({
  providedIn: 'root'
})
export class AttendanceFilterService {

  /**
   * Filter attendance records based on provided criteria
   * @param records - Array of attendance records to filter
   * @param filter - Filter criteria
   * @returns Filtered array of attendance records
   */
  filter(records: IAttendance[], filter: IAttendanceFilter): IAttendance[] {
    if (!filter|| Object.keys(filter).length === 0) {
      return records;
    }

    return records.filter(record => {
      // Filter by employee
      if (filter.employee && record.employee !== filter.employee) {
        return false;
      }

      // Filter by specific date
      if (filter.date && record.date !== filter.date) {
        return false;
      }

      // Filter by date range
      if (filter.date_from && record.date < filter.date_from) {
        return false;
      }

      if (filter.date_to && record.date > filter.date_to) {
        return false;
      }

      // Filter by status
      if (filter.status && record.status !== filter.status) {
        return false;
      }

      // Filter by shift
      if (filter.shift && record.shift !== filter.shift) {
        return false;
      }

      return true;
    });
  }

  /**
   * Filter by employee name (search)
   * @param records - Array of attendance records
   * @param searchQuery - Search string
   * @returns Filtered records matching search query
   */
  filterByEmployeeName(records: IAttendance[], searchQuery: string): IAttendance[] {
    if (!searchQuery || searchQuery.trim() === '') {
      return records;
    }

    const query = searchQuery.toLowerCase().trim();
    return records.filter(record =>
      record.employee_name?.toLowerCase().includes(query)
    );
  }

  /**
   * Filter by date range (convenience method)
   * @param records - Array of attendance records
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @returns Records within date range
   */
  filterByDateRange(records: IAttendance[], startDate: string, endDate: string): IAttendance[] {
    return this.filter(records, {
      date_from: startDate,
      date_to: endDate
    });
  }

  /**
   * Filter by status (convenience method)
   * @param records - Array of attendance records
   * @param status - Status to filter by
   * @returns Records matching status
   */
  filterByStatus(records: IAttendance[], status: string): IAttendance[] {
    return this.filter(records, { status });
  }

  /**
   * Get records for today
   * @param records - Array of attendance records
   * @returns Today's attendance records
   */
  getTodayRecords(records: IAttendance[]): IAttendance[] {
    const today = new Date().toISOString().split('T')[0];
    return this.filter(records, { date: today });
  }

  /**
   * Get records for current month
   * @param records - Array of attendance records
   * @returns Current month's attendance records
   */
  getCurrentMonthRecords(records: IAttendance[]): IAttendance[] {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    return this.filterByDateRange(records, startOfMonth, endOfMonth);
  }
}
