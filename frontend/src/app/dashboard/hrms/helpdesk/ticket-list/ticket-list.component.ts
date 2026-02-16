import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HelpdeskService, Ticket } from '../../../../core/helpdesk.service';
import { ErrorHandlerService } from '../../../../core/error-handler.service';
import { DropdownComponent, DropdownOption } from '../../../../shared/components/dropdown/dropdown.component';
import { AuthService } from '../../../../core/auth.service';
@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, DropdownComponent],
  templateUrl: './ticket-list.component.html',
  styleUrl: './ticket-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TicketListComponent implements OnInit {
  // ... (previous properties)
  private fb = inject(FormBuilder).nonNullable;
  private helpdeskService = inject(HelpdeskService);
  private errorHandler = inject(ErrorHandlerService);
  authService = inject(AuthService);
  // State management
  tickets = signal<Ticket[]>([]);
  showModal = signal(false);
  isLoading = signal(false);
  selectedStatus = signal<string>('');

  ticketForm = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    priority: ['MEDIUM', Validators.required],
    category: ['IT', Validators.required]
  });

  get priorityOptions(): DropdownOption[] {
    return [
      { label: 'Low', value: 'LOW', badge: 'LOW', badgeClass: 'bg-green-100 text-green-800' },
      { label: 'Medium', value: 'MEDIUM', badge: 'MEDIUM', badgeClass: 'bg-blue-100 text-blue-800' },
      { label: 'High', value: 'HIGH', badge: 'HIGH', badgeClass: 'bg-orange-100 text-orange-800' },
      { label: 'Urgent', value: 'URGENT', badge: 'URGENT', badgeClass: 'bg-red-100 text-red-800' }
    ];
  }

  get categoryOptions(): DropdownOption[] {
    return [
      { label: 'IT Support', value: 'IT', icon: 'fas fa-desktop' },
      { label: 'HR', value: 'HR', icon: 'fas fa-users' },
      { label: 'Facilities', value: 'FACILITIES', icon: 'fas fa-building' },
      { label: 'Finance', value: 'FINANCE', icon: 'fas fa-coins' },
      { label: 'Other', value: 'OTHER', icon: 'fas fa-question-circle' }
    ];
  }

  ngOnInit() {
    this.loadTickets();
  }

  loadTickets() {
    this.isLoading.set(true);
    this.helpdeskService.getTickets().subscribe({
      next: (data) => {
        const tickets = Array.isArray(data) ? data : ((data as any).results || []);
        this.tickets.set(tickets);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to load tickets');
        this.isLoading.set(false);
      }
    });
  }

  get filteredTickets() {
    const status = this.selectedStatus();
    if (!status) return this.tickets();
    return this.tickets().filter(t => t.status === status);
  }

  openModal() {
    this.ticketForm.reset({ priority: 'MEDIUM', category: 'IT', title: '', description: '' });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  onSubmit() {
    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      return;
    }

    this.helpdeskService.createTicket(this.ticketForm.getRawValue()).subscribe({
      next: () => {
        this.errorHandler.showSuccess('Ticket created successfully');
        this.loadTickets();
        this.closeModal();
      },
      error: (err) => this.errorHandler.handleHttpError(err, 'Failed to create ticket')
    });
  }

  getPriorityClass(priority: string): string {
    const map: Record<string, string> = {
      'LOW': 'bg-green-100 text-green-800',
      'MEDIUM': 'bg-blue-100 text-blue-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'URGENT': 'bg-red-100 text-red-800'
    };
    return map[priority] || 'bg-gray-100 text-gray-800';
  }

  getStatusClass(status: string): string {
      const map: Record<string, string> = {
        'OPEN': 'bg-blue-100 text-blue-800',
        'IN_PROGRESS': 'bg-purple-100 text-purple-800',
        'RESOLVED': 'bg-green-100 text-green-800',
        'CLOSED': 'bg-gray-100 text-gray-800'
      };
      return map[status] || 'bg-gray-100 text-gray-800';
  }
}
