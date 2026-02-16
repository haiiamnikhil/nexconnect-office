import { Observable } from 'rxjs';
import { IAttendance, IAttendanceFilter, IAttendanceStats } from '../models/attendance/IAttendance';

// Service interface following Interface Segregation and Dependency Inversion
export interface IAttendanceService {
  // Read operations
  getAttendances(filter?: IAttendanceFilter): Observable<IAttendance[]>;
  getAttendanceById(id: number): Observable<IAttendance>;
  getMonthlyAttendance(employeeId: number, month: string): Observable<IAttendance[]>;
  getAttendanceStats(employeeId: number, period?: string): Observable<IAttendanceStats>;
  
  // Write operations
  checkIn(employeeId: number, customTime?: string): Observable<IAttendance>;
  checkOut(employeeId: number, customTime?: string): Observable<IAttendance>;
  updateAttendance(id: number, data: Partial<IAttendance>): Observable<IAttendance>;
  deleteAttendance(id: number): Observable<void>;
}
