import { 
  getToday, 
  formatTime, 
  getFirstDayOfMonth, 
  getLastDayOfMonth,
  getCurrentMonth,
  isToday,
  getLastNDaysRange
} from './date.utils';

describe('Date Utils', () => {
  
  describe('getToday', () => {
    it('should return today\'s date in YYYY-MM-DD format', () => {
      const result = getToday();
      const today = new Date().toISOString().split('T')[0];
      expect(result).toBe(today);
    });

    it('should return a string of length 10', () => {
      const result = getToday();
      expect(result.length).toBe(10);
    });

    it('should match YYYY-MM-DD pattern', () => {
      const result = getToday();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('formatTime', () => {
    it('should format time with milliseconds', () => {
      const result = formatTime('14:30:45.123456');
      expect(result).toBe('14:30:45');
    });

    it('should handle time without milliseconds', () => {
      const result = formatTime('09:15:30');
      expect(result).toBe('09:15:30');
    });

    it('should return undefined for undefined input', () => {
      const result = formatTime(undefined);
      expect(result).toBeUndefined();
    });

    it('should handle edge case times', () => {
      expect(formatTime('00:00:00')).toBe('00:00:00');
      expect(formatTime('23:59:59')).toBe('23:59:59');
    });
  });

  describe('getFirstDayOfMonth', () => {
    it('should return first day of current month', () => {
      const result = getFirstDayOfMonth();
      const expected = new Date();
      expected.setDate(1);
      const expectedStr = expected.toISOString().split('T')[0];
      expect(result).toBe(expectedStr);
    });

    it('should return date ending in -01', () => {
      const result = getFirstDayOfMonth();
      expect(result).toMatch(/-01$/);
    });
  });

  describe('getLastDayOfMonth', () => {
    it('should return last day of current month', () => {
      const result = getLastDayOfMonth();
      const lastDay = new Date();
      lastDay.setMonth(lastDay.getMonth() + 1, 0);
      const expectedStr = lastDay.toISOString().split('T')[0];
      expect(result).toBe(expectedStr);
    });

    it('should return valid date', () => {
      const result = getLastDayOfMonth();
      const day = parseInt(result.split('-')[2]);
      expect(day).toBeGreaterThanOrEqual(28);
      expect(day).toBeLessThanOrEqual(31);
    });
  });

  describe('getCurrentMonth', () => {
    it('should return current month in YYYY-MM format', () => {
      const result = getCurrentMonth();
      const expected = new Date().toISOString().slice(0, 7);
      expect(result).toBe(expected);
    });

    it('should match YYYY-MM pattern', () => {
      const result = getCurrentMonth();
      expect(result).toMatch(/^\d{4}-\d{2}$/);
    });

    it('should have length 7', () => {
      const result = getCurrentMonth();
      expect(result.length).toBe(7);
    });
  });

  describe('isToday', () => {
    it('should return true for today\'s date', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(isToday(today)).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      expect(isToday(yesterdayStr)).toBe(false);
    });

    it('should return false for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      expect(isToday(tomorrowStr)).toBe(false);
    });
  });

  describe('getLastNDaysRange', () => {
    it('should return correct range for last 7 days', () => {
      const result = getLastNDaysRange(7);
      
      expect(result.start_date).toBeDefined();
      expect(result.end_date).toBeDefined();
      expect(result.end_date).toBe(getToday());
    });

    it('should return correct range for last 30 days', () => {
      const result = getLastNDaysRange(30);
      const start = new Date(result.start_date);
      const end = new Date(result.end_date);
      
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      expect(diffDays).toBe(29); // 30 days inclusive, so 29 days difference
    });

    it('should handle 1 day range', () => {
      const result = getLastNDaysRange(1);
      expect(result.start_date).toBe(result.end_date);
      expect(result.end_date).toBe(getToday());
    });
  });
});
