import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface Department {
  id?: number;
  name: string;
  description?: string;
  employee_count?: number;
  designation_count?: number;
  managed_by_name?: string;
}

export interface Designation {
  id?: number;
  title: string;
  level: number;
  description?: string;
  department?: number;
  department_name?: string;
  employee_count?: number;
  is_active?: boolean;
}

export interface Location {
  id?: number;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  country?: string;
  pincode: string;
  phone?: string;
  email?: string;
  is_headquarters?: boolean;
  is_active?: boolean;
}

export interface OrgHierarchy {
  departments: Department[];
  designations: Designation[];
  locations: Location[];
  total_employees: number;
  total_active_employees: number;
}

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrgStructureService {
  private deptApiUrl = `${environment.apiUrl}/hrms/org-departments`;
  private designationApiUrl = `${environment.apiUrl}/hrms/designations`;
  private locationApiUrl = `${environment.apiUrl}/hrms/locations`;
  private hierarchyApiUrl = `${environment.apiUrl}/hrms/org-hierarchy`;

  constructor(private http: HttpClient) {}

  // Departments
  getDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(this.deptApiUrl + '/');
  }

  getDepartment(id: number): Observable<Department> {
    return this.http.get<Department>(`${this.deptApiUrl}/${id}/`);
  }

  createDepartment(dept: Department): Observable<Department> {
    return this.http.post<Department>(this.deptApiUrl + '/', dept);
  }

  updateDepartment(id: number, dept: Partial<Department>): Observable<Department> {
    return this.http.patch<Department>(`${this.deptApiUrl}/${id}/`, dept);
  }

  deleteDepartment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.deptApiUrl}/${id}/`);
  }

  // Designations
  getDesignations(): Observable<Designation[]> {
    return this.http.get<Designation[]>(this.designationApiUrl + '/');
  }

  getDesignation(id: number): Observable<Designation> {
    return this.http.get<Designation>(`${this.designationApiUrl}/${id}/`);
  }

  createDesignation(designation: Designation): Observable<Designation> {
    return this.http.post<Designation>(this.designationApiUrl + '/', designation);
  }

  updateDesignation(id: number, designation: Partial<Designation>): Observable<Designation> {
    return this.http.patch<Designation>(`${this.designationApiUrl}/${id}/`, designation);
  }

  deleteDesignation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.designationApiUrl}/${id}/`);
  }

  getDesignationsByLevel(): Observable<any> {
    return this.http.get(`${this.designationApiUrl}/by_level/`);
  }

  // Locations
  getLocations(): Observable<Location[]> {
    return this.http.get<Location[]>(this.locationApiUrl + '/');
  }

  getLocation(id: number): Observable<Location> {
    return this.http.get<Location>(`${this.locationApiUrl}/${id}/`);
  }

  createLocation(location: Location): Observable<Location> {
    return this.http.post<Location>(this.locationApiUrl + '/', location);
  }

  updateLocation(id: number, location: Partial<Location>): Observable<Location> {
    return this.http.patch<Location>(`${this.locationApiUrl}/${id}/`, location);
  }

  deleteLocation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.locationApiUrl}/${id}/`);
  }

  getHeadquarters(): Observable<Location> {
    return this.http.get<Location>(`${this.locationApiUrl}/headquarters/`);
  }

  // Org Hierarchy
  getOrgHierarchy(): Observable<OrgHierarchy> {
    return this.http.get<OrgHierarchy>(this.hierarchyApiUrl + '/');
  }
}
