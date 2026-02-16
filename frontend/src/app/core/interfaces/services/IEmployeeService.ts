import { Observable } from 'rxjs';
import { IEmployee, IEmployeeBasic, IEmployeeFilter } from '../models/employee/IEmployee';

// Service interface following DIP
export interface IEmployeeService {
  // Read operations
  getEmployees(filter?: IEmployeeFilter): Observable<IEmployee[]>;
  getEmployeeById(id: number): Observable<IEmployee>;
  getCurrentEmployee(): Observable<IEmployee>;
  
  // Lightweight operations (ISP - only return what's needed)
  getEmployeeList(): Observable<IEmployeeBasic[]>;
  searchEmployees(query: string): Observable<IEmployeeBasic[]>;
  
  // Write operations
  createEmployee(data: Partial<IEmployee>): Observable<IEmployee>;
  updateEmployee(id: number, data: Partial<IEmployee>): Observable<IEmployee>;
  deleteEmployee(id: number): Observable<void>;
}
