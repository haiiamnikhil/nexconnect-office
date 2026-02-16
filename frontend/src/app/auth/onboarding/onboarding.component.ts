import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OnboardingService } from './onboarding.service';
import { OrgStructureService, Department, Designation } from '../../core/org-structure.service';
import { DropdownComponent } from '../../shared/components/dropdown/dropdown.component';

interface EmploymentType {
  name: string;
  code: string;
}

interface EmployeeStatus {
  name: string;
  code: string;
  system_actions: {
    login_enabled?: boolean;
    process_payroll?: boolean;
    track_attendance?: boolean;
  };
}

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownComponent],
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss']
})
export class OnboardingComponent implements OnInit {
  onboardingService = inject(OnboardingService);
  router = inject(Router);

  steps = ['Designations', 'Departments', 'Employment Types', 'Statuses', 'System Roles', 'Regional Settings'];
  currentStep = this.onboardingService.currentStep;
  isSubmitting = signal(false);

  // Data Models
  currency = 'USD';
  currencyOptions = [
    { label: 'USD - US Dollar', value: 'USD' },
    { label: 'EUR - Euro', value: 'EUR' },
    { label: 'INR - Indian Rupee', value: 'INR' },
    { label: 'GBP - British Pound', value: 'GBP' }
  ];

  departments = signal<Partial<Department>[]>([]);
  designations = signal<Partial<Designation>[]>([]);

  employmentTypes = signal<EmploymentType[]>([]);
  employeeStatuses = signal<EmployeeStatus[]>([]);

  ngOnInit() {
    this.onboardingService.getStatus().subscribe(status => {
        if (status.step > this.steps.length) { // Now length is 6
             this.router.navigate(['/dashboard']);
        }
        if (status.currency) this.currency = status.currency;
    });
    
    // Initial Data
    this.departments.set([{ name: 'Engineering' }, { name: 'Human Resources' }, { name: 'Sales' }]);
    this.designations.set([{ title: 'Manager' }, { title: 'Senior Developer' }, { title: 'HR Executive' }]);
    
    this.employmentTypes.set([
        { name: 'Permanent', code: 'PERM' },
        { name: 'Contract', code: 'CONT' },
        { name: 'Intern', code: 'INT' }
    ]);
    
    this.employeeStatuses.set([
        { name: 'Active', code: 'ACTIVE', system_actions: { login_enabled: true, process_payroll: true, track_attendance: true } },
        { name: 'On Notice', code: 'NOTICE', system_actions: { login_enabled: true, process_payroll: true, track_attendance: true } },
        { name: 'Terminated', code: 'TERM', system_actions: { login_enabled: false, process_payroll: false, track_attendance: false } }
    ]);
  }

  // --- Actions ---
  addDepartment() { this.departments.update(d => [...d, { name: '' }]); }
  removeDepartment(i: number) { this.departments.update(d => d.filter((_, idx) => idx !== i)); }

  addDesignation() { this.designations.update(d => [...d, { title: '' }]); }
  removeDesignation(i: number) { this.designations.update(d => d.filter((_, idx) => idx !== i)); }

  addEmploymentType() { this.employmentTypes.update(t => [...t, { name: '', code: '' }]); }
  removeEmploymentType(i: number) { this.employmentTypes.update(t => t.filter((_, idx) => idx !== i)); }

  addEmployeeStatus() { this.employeeStatuses.update(s => [...s, { name: '', code: '', system_actions: {} }]); }
  removeEmployeeStatus(i: number) { this.employeeStatuses.update(s => s.filter((_, idx) => idx !== i)); }

  prev() {
    const current = this.currentStep();
    if (current > 1) {
        const prevStep = current - 1;
        this.onboardingService.currentStep.set(prevStep);
        this.onboardingService.updateStep(current, { target_step: prevStep }).subscribe();
    }
  }

  next() {
    const step = this.currentStep();
    this.isSubmitting.set(true);

    let completion: any;

    // Map UI steps to Backend logic (New Flow)
    if (step === 1) { // Designations
        completion = this.onboardingService.updateStep(1, { designations: this.designations() });
    } else if (step === 2) { // Departments
        completion = this.onboardingService.updateStep(2, { departments: this.departments() });
    } else if (step === 3) { // Employment Types
        completion = this.onboardingService.updateStep(3, { employment_types: this.employmentTypes() });
    } else if (step === 4) { // Statuses
        completion = this.onboardingService.updateStep(4, { employee_statuses: this.employeeStatuses() });
    } else if (step === 5) { // System Roles
        completion = this.onboardingService.updateStep(5, { roles_reviewed: true });
    } else if (step === 6) { // Currency & Complete
        this.onboardingService.updateStep(6, { currency: this.currency }).subscribe({
             next: () => {
                 this.onboardingService.completeOnboarding().subscribe({
                     next: () => {
                         this.isSubmitting.set(false);
                         this.router.navigate(['/dashboard']);
                     },
                     error: (err) => {
                         this.isSubmitting.set(false);
                         console.error(err);
                     }
                 });
             },
             error: (err) => {
                 this.isSubmitting.set(false);
                 console.error(err);
             }
        });
        return; // Early return for nested subscribe
    }

    if (completion) {
        completion.subscribe({
            next: () => {
                this.isSubmitting.set(false);
            },
            error: (err: any) => {
                this.isSubmitting.set(false);
                console.error(err);
            }
        });
    } else {
         this.isSubmitting.set(false);
    }
  }
}
