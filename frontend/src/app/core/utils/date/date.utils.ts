/**
 * Date Utility Functions
 * 
 * Pure functions for date manipulation and formatting
 * Follows Single Responsibility Principle
 */

/**
 * Format date to YYYY-MM-DD
 * @param date - Date object or string
 * @returns Formatted date string
 */
export function formatToISODate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Format time to HH:MM:SS
 * @param time - Time string (can include microseconds)
 * @returns Formatted time string
 */
export function formatTime(time: string | undefined): string {
  if (!time) return '--:--:--';
  return time.split('.')[0]; // Remove microseconds
}

/**
 * Get first day of month
 * @param date - Reference date
 * @returns First day of month as YYYY-MM-DD
 */
export function getFirstDayOfMonth(date: Date = new Date()): string {
  return formatToISODate(new Date(date.getFullYear(), date.getMonth(), 1));
}

/**
 * Get last day of month
 * @param date - Reference date
 * @returns Last day of month as YYYY-MM-DD
 */
export function getLastDayOfMonth(date: Date = new Date()): string {
  return formatToISODate(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

/**
 * Get current month as YYYY-MM
 * @returns Current month string
 */
export function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

/**
 * Get today's date as YYYY-MM-DD
 * @returns Today's date string
 */
export function getToday(): string {
  return formatToISODate(new Date());
}

/**
 * Check if date is today
 * @param date - Date to check
 * @returns True if date is today
 */
export function isToday(date: string): boolean {
  return date === getToday();
}

/**
 * Get date range for last N days
 * @param days - Number of days
 * @returns Object with start_date and end_date
 */
export function getLastNDaysRange(days: number): { start_date: string; end_date: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  
  return {
    start_date: formatToISODate(start),
    end_date: formatToISODate(end)
  };
}
