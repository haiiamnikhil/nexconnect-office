import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PayrollService, SalaryComponent, SalaryStructure } from '../../../../core/payroll.service';
import { ErrorHandlerService } from '../../../../core/error-handler.service';

@Component({
  selector: 'app-salary-structure-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './salary-structure-config.component.html',
  styleUrl: './salary-structure-config.component.scss'
})
export class SalaryStructureConfigComponent implements OnInit {
  private payrollService = inject(PayrollService);
  private errorHandler = inject(ErrorHandlerService);
  
  components = signal<SalaryComponent[]>([]);
  structures = signal<SalaryStructure[]>([]);
  isLoading = signal(false);
  isCreating = signal(false);
  
  newStructureName = '';
  selectedComponentIds = new Set<number>();

  ngOnInit() {
    this.loadComponents();
    this.loadStructures();
  }
  
  loadComponents() {
    this.isLoading.set(true);
    this.payrollService.getComponents().subscribe({
      next: (data: any) => {
        const results = Array.isArray(data) ? data : (data.results || []);
        this.components.set(results);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to load components');
        this.isLoading.set(false);
      }
    });
  }
  
  loadStructures() {
    this.payrollService.getStructures().subscribe({
      next: (data: any) => {
        const results = Array.isArray(data) ? data : (data.results || []);
        this.structures.set(results);
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to load structures');
      }
    });
  }

  toggleCreation() {
    this.isCreating.set(!this.isCreating());
  }

  toggleComponent(id: number) {
    if (this.selectedComponentIds.has(id)) {
      this.selectedComponentIds.delete(id);
    } else {
      this.selectedComponentIds.add(id);
    }
  }

  createStructure() {
    if (!this.newStructureName || this.selectedComponentIds.size === 0) {
      this.errorHandler.showError('Please provide structure name and select at least one component');
      return;
    }
    
    this.isLoading.set(true);
    const payload = {
      name: this.newStructureName,
      component_ids: Array.from(this.selectedComponentIds)
    };

    this.payrollService.createStructure(payload).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.isCreating.set(false);
        this.newStructureName = '';
        this.selectedComponentIds.clear();
        
        // Refresh structures list with new data
        this.loadStructures();
        this.errorHandler.showSuccess('Salary structure created successfully');
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorHandler.handleHttpError(err, 'Failed to create structure');
      }
    });
  }
}
