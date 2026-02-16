import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { HelpdeskService, Ticket, Comment } from '../../../../core/helpdesk.service';
import { AuthService } from '../../../../core/auth.service';
import { ErrorHandlerService } from '../../../../core/error-handler.service';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './ticket-detail.component.html',
  styleUrl: './ticket-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TicketDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private helpdeskService = inject(HelpdeskService);
  private authService = inject(AuthService);
  private errorHandler = inject(ErrorHandlerService);
  private fb = inject(FormBuilder);

  // State management
  ticket = signal<Ticket | null>(null);
  comments = signal<Comment[]>([]);
  isLoading = signal(false);
  isSubmitting = signal(false);
  newComment = signal('');

  commentForm: FormGroup = this.fb.group({
    content: ['', Validators.required]
  });

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadTicket(+params['id']);
      }
    });
  }

  loadTicket(id: number) {
    this.isLoading.set(true);
    this.helpdeskService.getTicket(id).subscribe({
      next: (data) => {
        this.ticket.set(data);
        this.loadComments(id);
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to load ticket');
        this.isLoading.set(false);
      }
    });
  }

  loadComments(ticketId: number) {
    // Assuming comments are part of ticket or separate endpoint
    // For now we'll assume they're in ticket.comments array
    this.isLoading.set(false);
  }

  submitComment() {
    if (this.commentForm.invalid) {
      this.errorHandler.showError('Please enter a comment');
      return;
    }

    const ticket = this.ticket();
    if (!ticket) return;

    this.isSubmitting.set(true);
    this.helpdeskService.addComment(ticket.id, this.commentForm.value.content).subscribe({
      next: () => {
        this.errorHandler.showSuccess('Comment added successfully');
        this.commentForm.reset();
        this.loadTicket(ticket.id);
        this.isSubmitting.set(false);
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to add comment');
        this.isSubmitting.set(false);
      }
    });
  }

  updateStatus(status: string) {
    const ticket = this.ticket();
    if (!ticket) return;

    this.helpdeskService.updateTicketStatus(ticket.id, status).subscribe({
      next: () => {
        this.errorHandler.showSuccess(`Ticket marked as ${status.toLowerCase()}`);
        this.loadTicket(ticket.id);
      },
      error: (err) => this.errorHandler.handleHttpError(err, 'Failed to update status')
    });
  }

  getStatusBadge(status: string): string {
    const map: Record<string, string> = {
      'OPEN': 'badge-open',
      'IN_PROGRESS': 'badge-progress',
      'RESOLVED': 'badge-resolved',
      'CLOSED': 'badge-closed'
    };
    return map[status] || 'badge-open';
  }

  getPriorityBadge(priority: string): string {
    const map: Record<string, string> = {
      'LOW': 'badge-low',
      'MEDIUM': 'badge-medium',
      'HIGH': 'badge-high',
      'URGENT': 'badge-urgent'
    };
    return map[priority] || 'badge-medium';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }
}
