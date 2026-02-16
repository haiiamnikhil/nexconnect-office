import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../../core/auth.service';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { ColumnDef } from '../../../../shared/components/data-table/data-table.types';
import { DropdownComponent } from '../../../../shared/components/dropdown/dropdown.component';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-tax-declaration',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, DropdownComponent],
  templateUrl: './tax-declaration.component.html'
})
export class TaxDeclarationComponent implements OnInit {
  declarations = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  
  // Employee Form State
  showForm = false;
  newDecl = {
    financial_year: '2025-2026',
    regime: 'NEW',
    section: '80C',
    declared_amount: 0
  };

  // Dropdown Options
  sectionOptions = computed(() => [
    { label: '80C - Life Insurance, PPF, etc.', value: '80C', icon: 'fas fa-shield-alt' },
    { label: '80D - Medical Insurance', value: '80D', icon: 'fas fa-heartbeat' },
    { label: 'HRA - House Rent Allowance', value: 'HRA', icon: 'fas fa-home' },
    { label: 'LTA - Leave Travel Allowance', value: 'LTA', icon: 'fas fa-plane' },
    { label: '80G - Donations', value: '80G', icon: 'fas fa-hand-holding-heart' }
  ]);

  regimeOptions = computed(() => [
    { label: 'New Regime', value: 'NEW', icon: 'fas fa-file-invoice-dollar' },
    { label: 'Old Regime', value: 'OLD', icon: 'fas fa-file-invoice' }
  ]);
  proofFile: File | null = null;
  
  // Admin Review State
  showReview = false;
  selectedDecl: any = null;
  reviewAmount: number = 0;
  remarks = '';

  // DataTable for Admin
  columns: ColumnDef[] = [
    { field: 'employee_name', header: 'Employee', format: (row: any) => row.employee ? `${row.employee.first_name || ''} ${row.employee.last_name || ''}` : 'Self' },
    { field: 'section', header: 'Section' },
    { field: 'declared_amount', header: 'Declared', type: 'currency' },
    { field: 'verified_amount', header: 'Verified', type: 'currency' },
    { field: 'status', header: 'Status', type: 'badge', badgeColors: { 'PENDING': 'bg-yellow-100 text-yellow-800', 'APPROVED': 'bg-green-100 text-green-800', 'REJECTED': 'bg-red-100 text-red-800', 'SUBMITTED': 'bg-blue-100 text-blue-800' } },
    { field: 'created_at', header: 'Date', type: 'date' }
  ];
  
  actions: any[] = []; // Set in OnInit based on role

  constructor(private http: HttpClient, public authService: AuthService) {}

  ngOnInit() {
    this.setupActions();
    this.loadDeclarations();
  }

  setupActions() {
    if (this.authService.hasRole('Admin') || this.authService.hasRole('HR')) {
        this.actions = [
            { label: 'Review', action: 'review', class: 'text-primary-600' }
        ];
    } else {
         this.actions = [
            { label: 'Submit', action: 'submit', class: 'text-green-600', showCondition: (row: any) => row.status === 'PENDING' }
         ];
    }
  }

  loadDeclarations() {
    this.isLoading.set(true);
    this.http.get<any>(`${environment.apiUrl}/hrms/tax-declarations/`).subscribe({
        next: (data) => {
            const results = Array.isArray(data) ? data : (data.results || []);
            this.declarations.set(results);
            this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
    });
  }

  // Employee Actions
  startNew() {
    this.showForm = true;
  }

  onFileSelected(event: any) {
    this.proofFile = event.target.files[0];
  }

  saveDraft() {
    const formData = new FormData();
    formData.append('financial_year', this.newDecl.financial_year);
    formData.append('regime', this.newDecl.regime);
    formData.append('section', this.newDecl.section);
    formData.append('declared_amount', this.newDecl.declared_amount.toString());
    if (this.proofFile) {
        formData.append('proof_document', this.proofFile);
    }
    // Default status PENDING on creation
    
    this.http.post(`${environment.apiUrl}/hrms/tax-declarations/`, formData).subscribe({
        next: () => {
            this.showForm = false;
            this.loadDeclarations();
            alert('Declaration Saved (Draft)');
        },
        error: (err) => alert('Failed to save')
    });
  }

  handleAction(event: any) {
    const { action, row } = event;
    if (action === 'submit') {
        this.submitDeclaration(row.id);
    } else if (action === 'review') {
        this.selectedDecl = row;
        this.reviewAmount = row.declared_amount; // Default to declared
        this.showReview = true;
    }
  }

  submitDeclaration(id: number) {
    if(!confirm('Submit this declaration? You cannot edit it afterwards.')) return;
    
    this.http.post(`${environment.apiUrl}/hrms/tax-declarations/${id}/submit/`, {}).subscribe({
         next: () => {
            this.loadDeclarations();
            alert('Submitted successfully');
         }
    });
  }

  // Admin Actions
  submitReview(status: 'APPROVED' | 'REJECTED') {
    const endpoint = status === 'APPROVED' ? 'approve' : 'reject';
    const body = {
        remarks: this.remarks,
        verified_amount: status === 'APPROVED' ? this.reviewAmount : 0
    };
    
    this.http.post(`${environment.apiUrl}/hrms/tax-declarations/${this.selectedDecl.id}/${endpoint}/`, body).subscribe({
        next: () => {
            this.showReview = false;
            this.selectedDecl = null;
            this.loadDeclarations();
            alert(`Declaration ${status}`);
        }
    });
  }
}
