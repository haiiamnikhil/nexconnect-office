// Core attendance record interface (ISP - focused interface)
export interface IAttendanceRecord {
  id?: number;
  date: string;
  check_in: string;
  check_out?: string;
}

// Attendance metadata interface
export interface IAttendanceMetadata {
  employee: number;
  employee_name?: string;
  shift?: number;
  shift_name?: string;
}

// Attendance calculations interface
export interface IAttendanceCalculations {
  working_hours: number;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE' | 'LATE' | 'HOLIDAY' | 'WEEK_OFF';
}

// Full attendance model (composition of focused interfaces)
export interface IAttendance extends IAttendanceRecord, IAttendanceMetadata, IAttendanceCalculations {}

// Attendance filter interface
export interface IAttendanceFilter {
  employee?: number;
  date?: string;
  date_from?: string;
  date_to?: string;
  status?: string;
  shift?: number;
}

// Attendance statistics interface
export interface IAttendanceStats {
  total_days: number;
  present_days: number;
  absent_days: number;
  half_days: number;
  total_hours: number;
  average_hours: number;
}
