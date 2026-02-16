/**
 * Leave Calculation Utilities
 * 
 * Pure functions for leave-related calculations
 * Follows Single Responsibility Principle
 */

/**
 * Calculate number of days between two dates (inclusive)
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns Number of days
 */
export function calculateDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Include both start and end date
}

/**
 * Calculate working days between two dates (excludes weekends)
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns Number of working days
 */
export function calculateWorkingDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * Check if date range overlaps with another range
 * @param start1 - First range start date
 * @param end1 - First range end date
 * @param start2 - Second range start date
 * @param end2 - Second range end date
 * @returns True if ranges overlap
 */
export function dateRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);

  return s1 <= e2 && s2 <= e1;
}

/**
 * Format leave duration for display
 * @param days - Number of days
 * @returns Formatted string (e.g., "3 days", "1 day", "0.5 days")
 */
export function formatLeaveDuration(days: number): string {
  if (days === 1) return '1 day';
  if (days === 0.5) return '0.5 days (Half day)';
  return `${days} days`;
}

/**
 * Get leave status badge color class
 * @param status - Leave request status
 * @returns CSS class string for badge
 */
export function getLeaveStatusBadgeClass(status: string): string {
  const classes: Record<string, string> = {
    'PENDING': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
    'APPROVED': 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    'REJECTED': 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    'CANCELLED': 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
  };

  return classes[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
}
