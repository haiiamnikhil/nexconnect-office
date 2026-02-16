import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RecruitmentService } from '../../../../core/recruitment.service';
import { OrgStructureService } from '../../../../core/org-structure.service';
import { ErrorHandlerService } from '../../../../core/error-handler.service';
import { QuillModule } from 'ngx-quill';
import { DropdownComponent, DropdownOption } from '../../../../shared/components/dropdown/dropdown.component';

@Component({
  selector: 'app-job-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, QuillModule, DropdownComponent],
  templateUrl: './job-form.component.html'
})
export class JobFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private recruitmentService = inject(RecruitmentService);
  private orgService = inject(OrgStructureService);
  private errorHandler = inject(ErrorHandlerService);
  private router = inject(Router);

  departments = signal<any[]>([]);
  locations = signal<any[]>([]);
  isSubmitting = signal(false);

  jobForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    department: [null, Validators.required],
    location: [null, Validators.required],
    description: ['', Validators.required],
    requirements: ['', Validators.required],
    type: ['Full Time', Validators.required],
    salary_range: [''],
    status: ['DRAFT']
  });

  get departmentOptions(): DropdownOption[] {
    return this.departments().map(d => ({
      label: d.name,
      value: d.id,
      icon: 'fas fa-building'
    }));
  }

  get locationOptions(): DropdownOption[] {
    return this.locations().map(l => ({
      label: l.name,
      value: l.id,
      icon: 'fas fa-map-marker-alt'
    }));
  }

  get jobTypeOptions(): DropdownOption[] {
    return [
      { label: 'Full Time', value: 'Full Time', icon: 'fas fa-clock' },
      { label: 'Part Time', value: 'Part Time', icon: 'fas fa-hourglass-half' },
      { label: 'Contract', value: 'Contract', icon: 'fas fa-file-contract' },
      { label: 'Internship', value: 'Internship', icon: 'fas fa-user-graduate' }
    ];
  }

  get statusOptions(): DropdownOption[] {
    return [
      { label: 'Draft', value: 'DRAFT', badge: 'DRAFT', badgeClass: 'bg-gray-100 text-gray-800' },
      { label: 'Open', value: 'OPEN', badge: 'OPEN', badgeClass: 'bg-green-100 text-green-800' },
      { label: 'On Hold', value: 'HOLD', badge: 'HOLD', badgeClass: 'bg-orange-100 text-orange-800' },
      { label: 'Closed', value: 'CLOSED', badge: 'CLOSED', badgeClass: 'bg-red-100 text-red-800' }
    ];
  }

  ngOnInit() {
    this.loadDepartments();
    this.loadLocations();
  }

  loadDepartments() {
    this.orgService.getDepartments().subscribe({
      next: (data: any) => {
        const results = Array.isArray(data) ? data : (data.results || []);
        this.departments.set(results);
      },
      error: (err) => this.errorHandler.handleHttpError(err, 'Failed to load departments')
    });
  }

  loadLocations() {
    this.orgService.getLocations().subscribe({
      next: (data: any) => {
        const results = Array.isArray(data) ? data : (data.results || []);
        this.locations.set(results);
      },
      error: (err) => this.errorHandler.handleHttpError(err, 'Failed to load locations')
    });
  }

  onSubmit() {
    if (this.jobForm.invalid) {
      this.errorHandler.showError('Please fill in all required fields');
      return;
    }

    this.isSubmitting.set(true);
    this.recruitmentService.createJob(this.jobForm.value).subscribe({
      next: () => {
        this.errorHandler.showSuccess('Job posting created successfully');
        this.router.navigate(['/dashboard/recruitment/jobs']);
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to create job posting');
        this.isSubmitting.set(false);
      }
    });
  }
}
