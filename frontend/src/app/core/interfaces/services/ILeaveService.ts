import { Observable } from 'rxjs';
import { ILeaveRequest, ILeaveBalance, ILeaveFilter } from '../models/leave/ILeave';

// Service interface following DIP
export interface ILeaveService {
  // Read operations
  getLeaveRequests(filter?: ILeaveFilter): Observable<ILeaveRequest[]>;
  getLeaveRequestById(id: number): Observable<ILeaveRequest>;
  getLeaveBalances(employeeId: number): Observable<ILeaveBalance[]>;
  
  // Write operations
  createLeaveRequest(data: Partial<ILeaveRequest>): Observable<ILeaveRequest>;
  updateLeaveRequest(id: number, data: Partial<ILeaveRequest>): Observable<ILeaveRequest>;
  deleteLeaveRequest(id: number): Observable<void>;
  
  // Approval operations
  approveLeaveRequest(id: number): Observable<ILeaveRequest>;
  rejectLeaveRequest(id: number, reason: string): Observable<ILeaveRequest>;
}
