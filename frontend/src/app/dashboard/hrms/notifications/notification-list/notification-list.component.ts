import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService, Notification } from '../../../../core/notification.service';
import { ErrorHandlerService } from '../../../../core/error-handler.service';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notification-list.component.html',
  styleUrl: './notification-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationListComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private errorHandler = inject(ErrorHandlerService);

  // State management
  notifications = signal<Notification[]>([]);
  isLoading = signal(false);
  filter = signal<'all' | 'unread'>('all');

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.isLoading.set(true);
    this.notificationService.getNotifications().subscribe({
      next: (data) => {
        this.notifications.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to load notifications');
        this.isLoading.set(false);
      }
    });
  }

  get filteredNotifications() {
    const all = this.notifications();
    if (this.filter() === 'unread') {
      return all.filter(n => !n.is_read);
    }
    return all;
  }

  get unreadCount() {
    return this.notifications().filter(n => !n.is_read).length;
  }

  markAsRead(id: number) {
    this.notificationService.markAsRead(id).subscribe({
      next: () => {
        // Update local state optimistically
        this.notifications.update(notifications =>
          notifications.map(n =>
            n.id === id ? { ...n, is_read: true } : n
          )
        );
      },
      error: (err) => this.errorHandler.handleHttpError(err, 'Failed to mark as read')
    });
  }

  markAllRead() {
    if (this.unreadCount === 0) {
      this.errorHandler.showInfo('No unread notifications');
      return;
    }

    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        // Update all notifications to read
        this.notifications.update(notifications =>
          notifications.map(n => ({ ...n, is_read: true }))
        );
        this.errorHandler.showSuccess('All notifications marked as read');
      },
      error: (err) => this.errorHandler.handleHttpError(err, 'Failed to mark all as read')
    });
  }

  deleteNotification(id: number) {
    if (confirm('Delete this notification?')) {
      this.notificationService.deleteNotification(id).subscribe({
        next: () => {
          // Remove from local state
          this.notifications.update(notifications =>
            notifications.filter(n => n.id !== id)
          );
          this.errorHandler.showSuccess('Notification deleted');
        },
        error: (err) => this.errorHandler.handleHttpError(err, 'Failed to delete notification')
      });
    }
  }

  getNotificationIcon(type: string): string {
    const map: Record<string, string> = {
      'SUCCESS': 'fas fa-check-circle text-green-500',
      'INFO': 'fas fa-info-circle text-blue-500',
      'WARNING': 'fas fa-exclamation-triangle text-yellow-500',
      'ERROR': 'fas fa-times-circle text-red-500'
    };
    return map[type] || 'fas fa-bell text-gray-500';
  }

  setFilter(filter: 'all' | 'unread') {
    this.filter.set(filter);
  }
}
