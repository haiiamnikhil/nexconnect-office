import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AuthService } from '../../../../core/auth.service';
import { EmployeeService, Employee } from '../../../../core/employee.service';
import { OrgStructureService, Department, Designation } from '../../../../core/org-structure.service';
import { ErrorHandlerService } from '../../../../core/error-handler.service';
import { DropdownComponent, DropdownOption } from '../../../../shared/components/dropdown/dropdown.component';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownComponent],
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('expandCollapse', [
      transition(':enter', [
        style({ height: '0', opacity: 0, overflow: 'hidden' }),
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ height: '*', opacity: 1, overflow: 'hidden' }),
        animate('250ms cubic-bezier(0.4, 0.0, 0.2, 1)', style({ height: '0', opacity: 0 }))
      ])
    ])
  ]
})
export class EmployeeFormComponent implements OnInit {
  // ... (previous code)

  // Getters for Dropdown Options
  // Computed Dropdown Options
  departmentOptions = computed(() => {
    return this.departments().map(d => ({
      label: d.name,
      value: d.id,
      description: d.managed_by_name ? `Managed by ${d.managed_by_name}` : '',
      icon: 'fas fa-building'
    }));
  });

  designationOptions = computed(() => {
    return this.designations().map(d => ({
      label: d.title,
      value: d.title,
      icon: 'fas fa-id-badge'
    }));
  });

  managerOptions = computed(() => {
    return this.potentialManagers().map(m => ({
      label: `${m.first_name} ${m.last_name}`,
      value: m.id,
      description: m.designation,
      icon: 'fas fa-user-tie'
    }));
  });

  roleOptions = computed(() => {
    return this.roles().map((r: any) => ({
      label: r.name ? r.name.replace('_', ' ') : r,
      value: r.id || r,
      icon: 'fas fa-user-shield'
    }));
  });

  genderOptions: DropdownOption[] = [
      { label: 'Male', value: 'M', icon: 'fas fa-mars' },
      { label: 'Female', value: 'F', icon: 'fas fa-venus' },
      { label: 'Other', value: 'O', icon: 'fas fa-transgender' }
  ];

  get employmentTypeOptions(): DropdownOption[] {
      return this.employmentTypes.map(t => ({
          label: t.replace('_', ' '),
          value: t,
          icon: 'fas fa-briefcase'
      }));
  }

  get employeeStatusOptions(): DropdownOption[] {
      return this.employeeStatuses.map(s => ({
          label: s.replace('_', ' '),
          value: s,
          badge: s,
          badgeClass: this.getStatusClass(s)
      }));
  }

  get bgvStatusOptions(): DropdownOption[] {
      return [
          { label: 'Pending', value: 'PENDING', badge: 'PENDING', badgeClass: 'bg-yellow-100 text-yellow-800' },
          { label: 'In Progress', value: 'IN_PROGRESS', badge: 'IN_PROGRESS', badgeClass: 'bg-blue-100 text-blue-800' },
          { label: 'Verified', value: 'VERIFIED', badge: 'VERIFIED', badgeClass: 'bg-green-100 text-green-800' },
          { label: 'Rejected', value: 'REJECTED', badge: 'REJECTED', badgeClass: 'bg-red-100 text-red-800' }
      ];
  }

  getStatusClass(status: string): string {
      switch(status) {
          case 'DRAFT': return 'bg-gray-100 text-gray-800 border-gray-200';
          case 'ACTIVE': return 'bg-green-100 text-green-800';
          case 'PROBATION': return 'bg-blue-100 text-blue-800';
          case 'NOTICE': return 'bg-orange-100 text-orange-800';
          case 'RESIGNED': return 'bg-gray-100 text-gray-800';
          case 'TERMINATED': return 'bg-red-100 text-red-800';
          case 'RETIRED': return 'bg-purple-100 text-purple-800';
          default: return 'bg-gray-100 text-gray-800';
      }
  }

  // ... (rest of component methods)

  private employeeService = inject(EmployeeService);
  private orgService = inject(OrgStructureService);
  private errorHandler = inject(ErrorHandlerService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Form State
  currentEmployee = signal<Partial<Employee>>({});
  departments = signal<Department[]>([]);
  designations = signal<Designation[]>([]);
  roles = signal<any[]>([]);
  potentialManagers = signal<Employee[]>([]); 
  

  // Constants
  employmentTypes = ['PERMANENT', 'CONTRACT', 'INTERN', 'CONSULTANT', 'PART_TIME'];
  employeeStatuses = ['DRAFT', 'ACTIVE', 'PROBATION', 'NOTICE', 'RESIGNED', 'TERMINATED', 'RETIRED'];

  // Sections: 'basic', 'employment', 'address', 'education', 'experience', 'bgv'
  activeSection = signal<string | null>('basic');

  toggleSection(section: string) {
    this.activeSection.update(current => current === section ? null : section);
  }
  
  isEdit = signal(false);
  isLoading = signal(false);
  isSubmitting = signal(false);

  ngOnInit() {
    this.loadDepartments();
    this.loadRoles();
    this.loadDesignations();
    this.loadPotentialManagers();
    
    // Check if edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.loadEmployee(Number(id));
    } else {
        // Auto-generate employee code for new employees
        this.generateEmployeeCode();
    }
  }
  
  generateEmployeeCode() {
    // 1. Get Tenant Name Prefix
    const user = this.authService.currentUser();
    // Use tenant name if available, otherwise default to 'EMP'
    const tenantName = user?.tenant?.name || 'EMP';
    
    // Take first 3 characters, uppercase, remove spaces/special chars just in case
    const prefix = tenantName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();

    // 2. Get Employee Count for Sequence
    this.employeeService.getEmployees({ limit: 1 }).subscribe({
      next: (response: any) => {
        // Assuming DRF pagination returns 'count'
        const totalCount = response.count || 0;
        const nextSequence = totalCount + 1;
        
        // Pad with zeros to 6 digits (e.g., 000001)
        const paddedCount = nextSequence.toString().padStart(6, '0');
        const code = `${prefix}${paddedCount}`;
        
        this.updateCurrentEmployee('employee_code', code);
      },
      error: (err) => {
        console.error('Failed to fetch employee count for ID generation', err);
        // Fallback to timestamp if count fetch fails
        const timestamp = new Date().getTime().toString().slice(-6);
        this.updateCurrentEmployee('employee_code', `${prefix}${timestamp}`);
      }
    });
  }

  loadDesignations() {
    this.orgService.getDesignations().subscribe({
      next: (data: any) => {
        // Handle pagination if present
        const designations = Array.isArray(data) ? data : (data.results || []);
        this.designations.set(designations);
      },
      error: (err) => {
        console.error('Failed to load designations', err);
        this.designations.set([]); // Ensure array on error
      }
    });
  }

  loadPotentialManagers() {
    this.employeeService.getEmployees().subscribe({
      next: (data: any) => {
        // Handle pagination if present
        const employees = Array.isArray(data) ? data : data.results || [];
        // Filter out self if editing
        const currentId = this.isEdit() ? this.currentEmployee().id : null;
        const validManagers = currentId 
            ? employees.filter((e: Employee) => e.id !== currentId)
            : employees;
            
        this.potentialManagers.set(validManagers);
      },
      error: (err) => console.error('Failed to load managers', err)
    });
  }

  loadRoles() {
    this.employeeService.getRoles().subscribe({
        next: (data: any) => {
          const roles = Array.isArray(data) ? data : (data.results || []);
          this.roles.set(roles);
        },
        error: (err) => {
          console.error('Failed to load roles', err);
          this.roles.set([]);
        }  
    });
  }

  loadDepartments() {
    this.orgService.getDepartments().subscribe({
      next: (data: any) => {
        const departments = Array.isArray(data) ? data : (data.results || []);
        this.departments.set(departments);
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to load departments');
        this.departments.set([]);
      }
    });
  }

  loadEmployee(id: number) {
    this.isLoading.set(true);
    
    this.employeeService.getEmployee(id).subscribe({
      next: (emp) => {
         if (emp) {
            this.currentEmployee.set(emp);
         } else {
            this.errorHandler.showError('Employee not found');
            this.router.navigate(['/dashboard/employees']);
         }
         this.isLoading.set(false);
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to load employee');
        this.isLoading.set(false);
        this.router.navigate(['/dashboard/employees']);
      }
    });
  }

  updateCurrentEmployee(field: string, value: any) {
    this.currentEmployee.update(emp => ({ ...emp, [field]: value }));
  }

  // Helper to init arrays if undefined
  private ensureArray(field: 'education' | 'experience' | 'bgv_checks') {
    this.currentEmployee.update(emp => {
      if (!emp[field]) {
        return { ...emp, [field]: [] };
      }
      return emp;
    });
  }

  addEducation() {
    this.ensureArray('education');
    this.currentEmployee.update(emp => ({
      ...emp,
      education: [...(emp.education || []), {
        institution: '',
        degree: '',
        field_of_study: '',
        start_date: ''
      }]
    }));
  }

  removeEducation(index: number) {
    this.currentEmployee.update(emp => ({
      ...emp,
      education: emp.education?.filter((_, i) => i !== index)
    }));
  }

  addExperience() {
    this.ensureArray('experience');
    this.currentEmployee.update(emp => ({
      ...emp,
      experience: [...(emp.experience || []), {
        company_name: '',
        designation: '',
        start_date: '',
        is_current: false
      }]
    }));
  }

  removeExperience(index: number) {
    this.currentEmployee.update(emp => ({
      ...emp,
      experience: emp.experience?.filter((_, i) => i !== index)
    }));
  }

  addBGV() {
    this.ensureArray('bgv_checks');
    this.currentEmployee.update(emp => ({
      ...emp,
      bgv_checks: [...(emp.bgv_checks || []), {
        check_type: '',
        status: 'PENDING'
      }]
    }));
  }

  removeBGV(index: number) {
    this.currentEmployee.update(emp => ({
      ...emp,
      bgv_checks: emp.bgv_checks?.filter((_, i) => i !== index)
    }));
  }

  copyAddress() {
    if (this.currentEmployee().current_address) {
      this.updateCurrentEmployee('permanent_address', this.currentEmployee().current_address);
    }
  }

  onFileSelected(event: any, type: 'education' | 'experience', index: number) {
    const file: File = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('document_file', file); // Field name must match backend serializer/view expectation
      // Backend expects 'file' field based on model, but let's check serializer.
      // EmployeeDocumentSerializer uses 'file'.
      // EmployeeService.uploadDocument sends 'document' FormData.
      // Let's correct this: Service takes FormData, so I construct it here.
      // Serializer field is 'file'.
      // Wait, let me check EmployeeService.uploadDocument... it just posts.
      // I should rename 'document_file' to 'file' to match backend model/serializer.
    }
  }
  
  uploadFile(event: any, type: 'education' | 'experience', index: number) {
    const file: File = event.target.files[0];
    if (file) {
        // Create FormData
        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_type', type === 'education' ? 'DEGREE' : 'EXPERIENCE');
        formData.append('document_name', file.name);
        
        // We might not have employee ID if it's a new employee...
        // If new, we can't link it yet? 
        // Logic constraint: Documents usually need an employee ID.
        // If creating new employee, we might need to upload *after* creation or allowed null employee?
        // EmployeeDocument model: employee = ForeignKey(..., on_delete=CASCADE). REMOVING null=True?
        // Let's check model... `employee` is NOT NULL in `EmployeeDocument`.
        // So we CANNOT upload documents before creating the employee.
        
        if (!this.currentEmployee().id) {
            this.errorHandler.showError('Please save the employee draft first before uploading documents.');
            // Reset file input
            event.target.value = '';
            return;
        }

        formData.append('employee', this.currentEmployee().id!.toString());

        this.isSubmitting.set(true);
        this.employeeService.uploadDocument(formData).subscribe({
            next: (doc: any) => {
                this.isSubmitting.set(false);
                if (type === 'education') {
                    const edu = this.currentEmployee().education || [];
                    if (edu[index]) {
                        edu[index] = { ...edu[index], document: doc.id, document_details: doc };
                        this.updateCurrentEmployee('education', edu);
                    }
                } else {
                    const exp = this.currentEmployee().experience || [];
                    if (exp[index]) {
                        exp[index] = { ...exp[index], document: doc.id, document_details: doc };
                        this.updateCurrentEmployee('experience', exp);
                    }
                }
                this.errorHandler.showSuccess('Document uploaded successfully');
            },
            error: (err) => {
                this.isSubmitting.set(false);
                this.errorHandler.handleHttpError(err, 'Failed to upload document');
            }
        });
    }
  }

  saveAsDraft() {
    this.updateCurrentEmployee('employee_status', 'DRAFT');
    this.save(true);
  }

  save(isDraft: boolean = false) {
    if (this.isSubmitting()) return;
    
    const employee = this.currentEmployee();
    
    // Validation
    const requiredFields = [
      { field: 'employee_code', label: 'Employee Code' },
      { field: 'first_name', label: 'First Name' },
      { field: 'last_name', label: 'Last Name' }
    ];

    // Only require these for non-drafts
    if (!isDraft) {
      requiredFields.push(
        { field: 'personal_email', label: 'Email' },
        { field: 'joining_date', label: 'Joining Date' },
        { field: 'salary', label: 'Salary' },
        { field: 'designation', label: 'Designation' },
        { field: 'department', label: 'Department' }
      );
    }

    for (const req of requiredFields) {
      if (!employee[req.field as keyof Employee]) {
        this.errorHandler.showError(`${req.label} is required`);
        return;
      }
    }
    
    this.isSubmitting.set(true);
    
    if (this.isEdit() && employee.id) {
      this.employeeService.updateEmployee(employee.id, employee).subscribe({
        next: () => {
          this.errorHandler.showSuccess('Employee updated successfully');
          this.router.navigate(['/dashboard/employees']);
        },
        error: (err) => {
          this.errorHandler.handleHttpError(err, 'Failed to update employee');
          this.isSubmitting.set(false);
        }
      });
    } else {
      this.employeeService.createEmployee(employee as Employee).subscribe({
        next: () => {
          this.errorHandler.showSuccess('Employee created successfully');
          this.router.navigate(['/dashboard/employees']);
        },
        error: (err) => {
          this.errorHandler.handleHttpError(err, 'Failed to create employee');
          this.isSubmitting.set(false);
        }
      });
    }
  }

  cancel() {
    this.router.navigate(['/dashboard/employees']);
  }
}
