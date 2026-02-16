import { Injectable } from '@angular/core';
import { ILeaveRequest, ILeaveFilter } from '../interfaces/models/leave/ILeave';

/**
 * Leave Request Filtering Service
 * 
 * Follows Single Responsibility Principle (SRP):
 * - Only responsible for filtering leave request data
 * - No HTTP calls, no UI logic, no business rules
 * - Pure filtering logic that can be easily tested
 */
@Injectable({
  providedIn: 'root'
})
export class LeaveFilterService {

  /**
   * Filter leave requests based on provided criteria
   * @param requests - Array of leave requests to filter
   * @param filter - Filter criteria
   * @returns Filtered array of leave requests
   */
  filter(requests: ILeaveRequest[], filter: ILeaveFilter): ILeaveRequest[] {
    if (!filter || Object.keys(filter).length === 0) {
      return requests;
    }

    return requests.filter(request => {
      // Filter by employee
      if (filter.employee && request.employee !== filter.employee) {
        return false;
      }

      // Filter by leave type
      if (filter.leave_type && request.leave_type !== filter.leave_type) {
        return false;
      }

      // Filter by status
      if (filter.status && request.status !== filter.status) {
        return false;
      }

      // Filter by date range
      if (filter.start_date && request.start_date < filter.start_date) {
        return false;
      }

      if (filter.end_date && request.end_date > filter.end_date) {
        return false;
      }

      return true;
    });
  }

  /**
   * Filter by status (convenience method)
   * @param requests - Array of leave requests
   * @param status - Status to filter by
   * @returns Requests matching status
   */
  filterByStatus(requests: ILeaveRequest[], status: string): ILeaveRequest[] {
    return this.filter(requests, { status });
  }

  /**
   * Get pending requests only
   * @param requests - Array of leave requests
   * @returns Pending leave requests
   */
  getPendingRequests(requests: ILeaveRequest[]): ILeaveRequest[] {
    return this.filterByStatus(requests, 'PENDING');
  }

  /**
   * Get approved requests only
   * @param requests - Array of leave requests
   * @returns Approved leave requests
   */
  getApprovedRequests(requests: ILeaveRequest[]): ILeaveRequest[] {
    return this.filterByStatus(requests, 'APPROVED');
  }

  /**
   * Get requests for current month
   * @param requests - Array of leave requests
   * @returns Current month's leave requests
   */
  getCurrentMonthRequests(requests: ILeaveRequest[]): ILeaveRequest[] {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    return this.filter(requests, {
      start_date: startOfMonth,
      end_date: endOfMonth
    });
  }

  /**
   * Search by employee name
   * @param requests - Array of leave requests
   * @param searchQuery - Search string
   * @returns Filtered requests matching search query
   */
  searchByEmployeeName(requests: ILeaveRequest[], searchQuery: string): ILeaveRequest[] {
    if (!searchQuery || searchQuery.trim() === '') {
      return requests;
    }

    const query = searchQuery.toLowerCase().trim();
    return requests.filter(request =>
      request.employee_name?.toLowerCase().includes(query)
    );
  }
}
