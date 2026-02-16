import { Injectable } from '@angular/core';
import { ILeaveRequest } from '../interfaces/models/leave/ILeave';

/**
 * Leave Statistics Calculator
 * 
 * Follows Single Responsibility Principle (SRP):
 * - Only responsible for calculating leave statistics
 * - Pure calculation logic with no side effects
 * - Easily testable
 */
@Injectable({
  providedIn: 'root'
})
export class LeaveStatsCalculator {

  /**
   * Calculate leave request statistics
   * @param requests - Array of leave requests
   * @returns Statistics object with counts
   */
  calculateStats(requests: ILeaveRequest[]): LeaveStats {
    const stats: LeaveStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
      total: requests.length,
      totalDays: 0
    };

    requests.forEach(request => {
      // Count by status
      switch (request.status) {
        case 'PENDING':
          stats.pending++;
          break;
        case 'APPROVED':
          stats.approved++;
          break;
        case 'REJECTED':
          stats.rejected++;
          break;
        case 'CANCELLED':
          stats.cancelled++;
          break;
      }

      // Sum total days
      stats.totalDays += request.days_requested || 0;
    });

    return stats;
  }

  /**
   * Calculate approval rate
   * @param stats - Leave statistics
   * @returns Approval rate percentage
   */
  calculateApprovalRate(stats: LeaveStats): number {
    const processed = stats.approved + stats.rejected;
    if (processed === 0) return 0;
    return (stats.approved / processed) * 100;
  }

  /**
   * Get statistics by leave type
   * @param requests - Array of leave requests
   * @returns Map of leave type ID to stats
   */
  getStatsByLeaveType(requests: ILeaveRequest[]): Map<number, LeaveTypeStats> {
    const statsMap = new Map<number, LeaveTypeStats>();

    requests.forEach(request => {
      const typeId = request.leave_type;
      
      if (!statsMap.has(typeId)) {
        statsMap.set(typeId, {
          leaveTypeId: typeId,
          leaveTypeName: request.leave_type_name || 'Unknown',
          count: 0,
          totalDays: 0
        });
      }

      const typeStats = statsMap.get(typeId)!;
      typeStats.count++;
      typeStats.totalDays += request.days_requested || 0;
    });

    return statsMap;
  }
}

/**
 * Leave statistics interface
 */
export interface LeaveStats {
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  total: number;
  totalDays: number;
}

/**
 * Leave type statistics interface
 */
export interface LeaveTypeStats {
  leaveTypeId: number;
  leaveTypeName: string;
  count: number;
  totalDays: number;
}
