import { Injectable } from '@angular/core';
import { IEmployee, IEmployeeBasic, IEmployeeFilter } from '../interfaces/models/employee/IEmployee';

/**
 * Employee Filtering Service
 * 
 * Follows Single Responsibility Principle (SRP):
 * - Only responsible for filtering employee data
 * - No HTTP calls, no UI logic, no business rules
 * - Pure filtering logic that can be easily tested
 */
@Injectable({
  providedIn: 'root'
})
export class EmployeeFilterService {

  /**
   * Filter employees based on provided criteria
   * @param employees - Array of employees to filter
   * @param filter - Filter criteria
   * @returns Filtered array of employees
   */
  filter(employees: IEmployee[], filter: IEmployeeFilter): IEmployee[] {
    if (!filter || Object.keys(filter).length === 0) {
      return employees;
    }

    return employees.filter(employee => {
      // Filter by search query (name, email, code)
      if (filter.search) {
        const query = filter.search.toLowerCase();
        const matchesName = `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(query);
        const matchesEmail = employee.email.toLowerCase().includes(query);
        const matchesCode = employee.employee_code?.toLowerCase().includes(query);
        
        if (!matchesName && !matchesEmail && !matchesCode) {
          return false;
        }
      }

      // Filter by department
      if (filter.department && employee.department?.id !== filter.department) {
        return false;
      }

      // Filter by designation
      if (filter.designation && employee.designation !== filter.designation) {
        return false;
      }

      // Filter by active status
      if (filter.is_active !== undefined && employee.is_active !== filter.is_active) {
        return false;
      }

      // Filter by employment type
      if (filter.employment_type && employee.employment_type !== filter.employment_type) {
        return false;
      }

      return true;
    });
  }

  /**
   * Get active employees only
   * @param employees - Array of employees
   * @returns Active employees
   */
  getActiveEmployees(employees: IEmployee[]): IEmployee[] {
    return this.filter(employees, { is_active: true });
  }

  /**
   * Get inactive employees only
   * @param employees - Array of employees
   * @returns Inactive employees
   */
  getInactiveEmployees(employees: IEmployee[]): IEmployee[] {
    return this.filter(employees, { is_active: false });
  }

  /**
   * Search employees by name, email, or code
   * @param employees - Array of employees
   * @param searchQuery - Search string
   * @returns Filtered employees
   */
  search(employees: IEmployee[], searchQuery: string): IEmployee[] {
    return this.filter(employees, { search: searchQuery });
  }

  /**
   * Get employees by department
   * @param employees - Array of employees
   * @param departmentId - Department ID
   * @returns Employees in department
   */
  getByDepartment(employees: IEmployee[], departmentId: number): IEmployee[] {
    return this.filter(employees, { department: departmentId });
  }

  /**
   * Convert full employee list to basic info list
   * @param employees - Array of full employee data
   * @returns Array of basic employee info
   */
  toBasicList(employees: IEmployee[]): IEmployeeBasic[] {
    return employees.map(emp => ({
      id: emp.id,
      employee_code: emp.employee_code,
      first_name: emp.first_name,
      last_name: emp.last_name,
      email: emp.email
    }));
  }
}
