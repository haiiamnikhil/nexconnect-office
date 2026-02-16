import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrgStructureService, Department, Designation, Location } from '../../../core/org-structure.service';
import { AuthService } from '../../../core/auth.service';
@Component({
  selector: 'app-org-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './org-overview.component.html'
})
export class OrgOverviewComponent implements OnInit {
  private orgService = inject(OrgStructureService);
  authService = inject(AuthService);
  
  departments: Department[] = [];
  designations: Designation[] = [];
  locations: Location[] = [];
  ngOnInit() {
    this.loadDepartments();
    this.loadDesignations();
    this.loadLocations();
  }
  
  loadDepartments() {
    this.orgService.getDepartments().subscribe({
      next: (data: any) => this.departments = Array.isArray(data) ? data : (data.results || []),
      error: (err) => console.error('Error:', err)
    });
  }
  
  loadDesignations() {
    this.orgService.getDesignations().subscribe({
      next: (data: any) => this.designations = Array.isArray(data) ? data : (data.results || []),
      error: (err) => console.error('Error:', err)
    });
  }
  
  loadLocations() {
    this.orgService.getLocations().subscribe({
      next: (data: any) => this.locations = Array.isArray(data) ? data : (data.results || []),
      error: (err) => console.error('Error:', err)
    });
  }
}
