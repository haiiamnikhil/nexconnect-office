import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AssetService, Asset, AssetCategory } from '../../../../core/asset.service';
import { EmployeeService } from '../../../../core/employee.service';
import { ErrorHandlerService } from '../../../../core/error-handler.service';
import { DropdownComponent, DropdownOption } from '../../../../shared/components/dropdown/dropdown.component';

@Component({
  selector: 'app-asset-inventory',
  standalone: true,

  templateUrl: './asset-inventory.component.html',
  styleUrl: './asset-inventory.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DropdownComponent]
})
export class AssetInventoryComponent implements OnInit {
  private fb = inject(FormBuilder);
  private assetService = inject(AssetService);
  private employeeService = inject(EmployeeService);
  private errorHandler = inject(ErrorHandlerService);

  // State management
  assets = signal<Asset[]>([]);
  categories = signal<AssetCategory[]>([]);
  employees = signal<any[]>([]);
  isLoading = signal(false);
  
  showCreateModal = signal(false);
  showAssignModal = signal(false);
  showReturnModal = signal(false);
  selectedAsset = signal<Asset | null>(null);

  assetForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    serial_number: ['', Validators.required],
    category: [null, Validators.required],
    status: ['ACTIVE']
  });

  assignForm: FormGroup = this.fb.group({
    employee_id: ['', Validators.required],
    remarks: ['']
  });
  
  returnForm: FormGroup = this.fb.group({
    return_condition: ['Good', Validators.required],
    status: ['ACTIVE', Validators.required],
    remarks: ['']
  });

  get categoryOptions(): DropdownOption[] {
    return this.categories().map(c => ({
      label: c.name,
      value: c.id
    }));
  }

  get statusOptions(): DropdownOption[] {
    return [
      { label: 'Available', value: 'AVAILABLE', badge: 'AVAILABLE', badgeClass: 'bg-green-100 text-green-800' },
      { label: 'In Repair', value: 'IN_REPAIR', badge: 'IN_REPAIR', badgeClass: 'bg-yellow-100 text-yellow-800' },
      { label: 'Scrapped', value: 'SCRAPPED', badge: 'SCRAPPED', badgeClass: 'bg-red-100 text-red-800' }
    ];
  }

  get employeeOptions(): DropdownOption[] {
    return this.employees().map(e => ({
      label: `${e.first_name} ${e.last_name} (${e.employee_code})`,
      value: e.id,
      description: e.designation,
      icon: 'fas fa-user'
    }));
  }

  ngOnInit() {
    this.loadAssets();
    this.loadCategories();
    this.loadEmployees();
  }

  loadAssets() {
    this.isLoading.set(true);
    this.assetService.getAssets().subscribe({
      next: (data) => {
        this.assets.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to load assets');
        this.isLoading.set(false);
      }
    });
  }

  loadCategories() {
    this.assetService.getCategories().subscribe({
      next: (data) => this.categories.set(data),
      error: (err) => this.errorHandler.handleHttpError(err, 'Failed to load categories')
    });
  }

  loadEmployees() {
    this.employeeService.getEmployees({}).subscribe({
      next: (data) => this.employees.set(data.results || data),
      error: (err) => this.errorHandler.handleHttpError(err, 'Failed to load employees')
    });
  }

  // Create Asset
  openCreateModal() {
    this.assetForm.reset({ status: 'ACTIVE' });
    this.showCreateModal.set(true);
  }

  onSubmitCreate() {
    if (this.assetForm.invalid) {
      this.errorHandler.showError('Please fill in all required fields');
      return;
    }

    this.assetService.createAsset(this.assetForm.value).subscribe({
      next: () => {
        this.errorHandler.showSuccess('Asset created successfully');
        this.loadAssets();
        this.showCreateModal.set(false);
      },
      error: (err) => this.errorHandler.handleHttpError(err, 'Failed to create asset')
    });
  }

  // Assign Asset
  openAssignModal(asset: Asset) {
    this.selectedAsset.set(asset);
    this.assignForm.reset();
    this.showAssignModal.set(true);
  }

  onSubmitAssign() {
    if (this.assignForm.invalid) {
      this.errorHandler.showError('Please select an employee');
      return;
    }

    const asset = this.selectedAsset();
    if (!asset) return;

    this.assetService.assignAsset(asset.id, this.assignForm.value).subscribe({
      next: () => {
        this.errorHandler.showSuccess('Asset assigned successfully');
        this.loadAssets();
        this.showAssignModal.set(false);
      },
      error: (err) => this.errorHandler.handleHttpError(err, 'Failed to assign asset')
    });
  }

  // Return Asset
  openReturnModal(asset: Asset) {
    this.selectedAsset.set(asset);
    this.returnForm.reset({ return_condition: 'Good', status: 'ACTIVE' });
    this.showReturnModal.set(true);
  }

  onSubmitReturn() {
    if (this.returnForm.invalid) {
      this.errorHandler.showError('Please fill in all required fields');
      return;
    }

    const asset = this.selectedAsset();
    if (!asset) return;

    this.assetService.returnAsset(asset.id, this.returnForm.value).subscribe({
      next: () => {
        this.errorHandler.showSuccess('Asset returned successfully');
        this.loadAssets();
        this.showReturnModal.set(false);
      },
      error: (err) => this.errorHandler.handleHttpError(err, 'Failed to return asset')
    });
  }

  closeModals() {
    this.showCreateModal.set(false);
    this.showAssignModal.set(false);
    this.showReturnModal.set(false);
    this.selectedAsset.set(null);
  }

  getStatusBadge(status: string): string {
    const map: Record<string, string> = {
      'ACTIVE': 'badge-success',
      'MAINTENANCE': 'badge-warning',
      'RETIRED': 'badge-error'
    };
    return map[status] || 'badge-pending';
  }
}
