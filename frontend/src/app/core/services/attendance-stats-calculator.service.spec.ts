import { TestBed } from '@angular/core/testing';
import { AttendanceStatsCalculator } from './attendance-stats-calculator.service';
import { IAttendance } from '../interfaces/models/attendance/IAttendance';

describe('AttendanceStatsCalculator', () => {
  let service: AttendanceStatsCalculator;
  
  const mockAttendances: IAttendance[] = [
    {
      id: 1,
      employee: 1,
      employee_name: 'John Doe',
      date: '2026-02-11',
      check_in: '09:00:00',
      check_out: '17:00:00',
      working_hours: 8,
      status: 'PRESENT'
    },
    {
      id: 2,
      employee: 2,
      employee_name: 'Jane Smith',
      date: '2026-02-11',
      check_in: '09:30:00',
      check_out: '17:00:00',
      working_hours: 7.5,
      status: 'LATE'
    },
    {
      id: 3,
      employee: 3,
      employee_name: 'Bob Johnson',
      date: '2026-02-11',
      check_in: '',
      check_out: '',
      working_hours: 0,
      status: 'ABSENT'
    },
    {
      id: 4,
      employee: 4,
      employee_name: 'Alice Wilson',
      date: '2026-02-11',
      check_in: '09:00:00',
      check_out: '13:00:00',
      working_hours: 4,
      status: 'HALF_DAY'
    },
    {
      id: 5,
      employee: 5,
      employee_name: 'Charlie Brown',
      date: '2026-02-11',
      check_in: '',
      check_out: '',
      working_hours: 0,
      status: 'ON_LEAVE'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AttendanceStatsCalculator]
    });
    service = TestBed.inject(AttendanceStatsCalculator);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('calculateStats', () => {
    it('should calculate correct statistics', () => {
      const stats = service.calculateStats(mockAttendances);
      
      expect(stats.present).toBe(1);
      expect(stats.late).toBe(2); // LATE + HALF_DAY
      expect(stats.absent).toBe(1);
      expect(stats.onLeave).toBe(1);
      expect(stats.halfDay).toBe(1);
      expect(stats.total).toBe(5);
    });

    it('should handle empty array', () => {
      const stats = service.calculateStats([]);
      
      expect(stats.present).toBe(0);
      expect(stats.late).toBe(0);
      expect(stats.absent).toBe(0);
      expect(stats.onLeave).toBe(0);
      expect(stats.halfDay).toBe(0);
      expect(stats.total).toBe(0);
    });

    it('should count only PRESENT status', () => {
      const presentOnly: IAttendance[] = [
        { ...mockAttendances[0], status: 'PRESENT' },
        { ...mockAttendances[0], id: 2, status: 'PRESENT' }
      ];
      
      const stats = service.calculateStats(presentOnly);
      expect(stats.present).toBe(2);
      expect(stats.late).toBe(0);
    });

    it('should count LATE and HALF_DAY in late counter', () => {
      const lateRecords: IAttendance[] = [
        { ...mockAttendances[1], status: 'LATE' },
        { ...mockAttendances[3], status: 'HALF_DAY' }
      ];
      
      const stats = service.calculateStats(lateRecords);
      expect(stats.late).toBe(2);
      expect(stats.halfDay).toBe(1);
    });

    it('should count all leave types in onLeave', () => {
      const leaveRecords: IAttendance[] = [
        { ...mockAttendances[4], status: 'ON_LEAVE' },
        { ...mockAttendances[4], id: 6, status: 'HOLIDAY' },
        { ...mockAttendances[4], id: 7, status: 'WEEK_OFF' }
      ];
      
      const stats = service.calculateStats(leaveRecords);
      expect(stats.onLeave).toBe(3);
    });
  });

  describe('calculateAttendancePercentage', () => {
    it('should calculate correct percentage', () => {
      const stats = {
        present: 80,
        late: 10,
        absent: 5,
        onLeave: 5,
        halfDay: 0,
        total: 100
      };
      
      const percentage = service.calculateAttendancePercentage(stats);
      expect(percentage).toBe(80);
    });

    it('should return 0 when total is 0', () => {
      const stats = {
        present: 0,
        late: 0,
        absent: 0,
        onLeave: 0,
        halfDay: 0,
        total: 0
      };
      
      const percentage = service.calculateAttendancePercentage(stats);
      expect(percentage).toBe(0);
    });

    it('should handle decimal percentages', () => {
      const stats = {
        present: 7,
        late: 0,
        absent: 3,
        onLeave: 0,
        halfDay: 0,
        total: 10
      };
      
      const percentage = service.calculateAttendancePercentage(stats);
      expect(percentage).toBe(70);
    });
  });

  describe('calculateWorkingDays', () => {
    it('should exclude leave days from total', () => {
      const stats = {
        present: 15,
        late: 3,
        absent: 2,
        onLeave: 5,
        halfDay: 0,
        total: 25
      };
      
      const workingDays = service.calculateWorkingDays(stats);
      expect(workingDays).toBe(20); // 25 - 5 leave days
    });

    it('should return total when onLeave is 0', () => {
      const stats = {
        present: 20,
        late: 0,
        absent: 0,
        onLeave: 0,
        halfDay: 0,
        total: 20
      };
      
      const workingDays = service.calculateWorkingDays(stats);
      expect(workingDays).toBe(20);
    });
  });
});
