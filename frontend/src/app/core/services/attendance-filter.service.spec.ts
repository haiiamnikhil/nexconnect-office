import { TestBed } from '@angular/core/testing';
import { AttendanceFilterService } from './attendance-filter.service';
import { IAttendance } from '../interfaces/models/attendance/IAttendance';

describe('AttendanceFilterService', () => {
  let service: AttendanceFilterService;
  
  // Mock data
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
      date: '2026-02-10',
      check_in: '',
      check_out: '',
      working_hours: 0,
      status: 'ABSENT'
    },
    {
      id: 4,
      employee: 1,
      employee_name: 'John Doe',
      date: '2026-02-10',
      check_in: '09:00:00',
      check_out: '17:00:00',
      working_hours: 8,
      status: 'PRESENT'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AttendanceFilterService]
    });
    service = TestBed.inject(AttendanceFilterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('filter', () => {
    it('should return all records when no filter is provided', () => {
      const result = service.filter(mockAttendances, {});
      expect(result).toEqual(mockAttendances);
      expect(result.length).toBe(4);
    });

    it('should filter by date', () => {
      const result = service.filter(mockAttendances, { date: '2026-02-11' });
      expect(result.length).toBe(2);
      expect(result.every(r => r.date === '2026-02-11')).toBe(true);
    });

    it('should filter by status', () => {
      const result = service.filter(mockAttendances, { status: 'PRESENT' });
      expect(result.length).toBe(2);
      expect(result.every(r => r.status === 'PRESENT')).toBe(true);
    });

    it('should filter by employee', () => {
      const result = service.filter(mockAttendances, { employee: 1 });
      expect(result.length).toBe(2);
      expect(result.every(r => r.employee === 1)).toBe(true);
    });

    it('should handle multiple filters', () => {
      const result = service.filter(mockAttendances, {
        date: '2026-02-11',
        status: 'PRESENT'
      });
      expect(result.length).toBe(1);
      expect(result[0].employee_name).toBe('John Doe');
    });

    it('should return empty array when no matches found', () => {
      const result = service.filter(mockAttendances, { date: '2026-02-15' });
      expect(result).toEqual([]);
    });
  });

  describe('filterByEmployeeName', () => {
    it('should filter by employee name (case insensitive)', () => {
      const result = service.filterByEmployeeName(mockAttendances, 'john');
      expect(result.length).toBe(2);
      expect(result.every(r => r.employee_name === 'John Doe')).toBe(true);
    });

    it('should filter by partial name match', () => {
      const result = service.filterByEmployeeName(mockAttendances, 'doe');
      expect(result.length).toBe(2);
    });

    it('should return all records when search is empty', () => {
      const result = service.filterByEmployeeName(mockAttendances, '');
      expect(result.length).toBe(4);
    });

    it('should return empty array when no match', () => {
      const result = service.filterByEmployeeName(mockAttendances, 'xyz');
      expect(result).toEqual([]);
    });
  });

  describe('filterByDateRange', () => {
    it('should filter records within date range', () => {
      const result = service.filterByDateRange(
        mockAttendances,
        '2026-02-10',
        '2026-02-11'
      );
      expect(result.length).toBe(4);
    });

    it('should exclude records outside date range', () => {
      const result = service.filterByDateRange(
        mockAttendances,
        '2026-02-11',
        '2026-02-11'
      );
      expect(result.length).toBe(2);
    });
  });
});
