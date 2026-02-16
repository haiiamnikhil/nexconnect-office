
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ChatWidgetComponent } from '../../dashboard/hrms/ai/chat-widget/chat-widget.component';
import { ThemeService } from '../../core/theme.service';
import { RbacService } from '../../core/rbac.service';
import { NotificationService, Notification } from '../../core/notification.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ChatWidgetComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent implements OnInit {
    authService = inject(AuthService);
    themeService = inject(ThemeService);
    rbacService = inject(RbacService);
    notificationService = inject(NotificationService);
    router = inject(Router);

    showNotifications = signal(false);
    showUserMenu = signal(false);
    
    notifications = signal<Notification[]>([]);
    unreadCount = signal(0);

    ngOnInit() {
        this.loadNotifications();
        
        // Subscribe to real-time unread count updates
        this.notificationService.unreadCount$.subscribe(count => {
            this.unreadCount.set(count);
        });
        
        // Initial fetch to populate subject
        this.notificationService.getUnreadCount().subscribe({
            error: err => console.error('Failed to get initial unread count:', err)
        });

        // Start polling for notifications with 10s interval
        if (this.authService.isAuthenticated()) {
            this.notificationService.startPolling(10000);
        }
    }

    ngOnDestroy() {
        this.notificationService.stopPolling();
    }

    loadNotifications() {
        console.log('AdminLayout: Loading notifications...');
        this.notificationService.getNotifications().subscribe({
            next: (data) => {
                this.notifications.set(data);
            },
            error: (err) => {
                console.error('AdminLayout: Failed to load notifications:', err);
            }
        });
    }

    loadUnreadCount() {
        // Redundant method, logic moved to ngOnInit subscription
    }

    toggleNotifications() {
        this.showNotifications.update(v => !v);
        if (this.showNotifications()) {
            this.showUserMenu.set(false);
            this.loadNotifications(); // Reload when opening
            this.loadUnreadCount();
        }
    }

    toggleUserMenu() {
        this.showUserMenu.update(v => !v);
        if (this.showUserMenu()) this.showNotifications.set(false);
    }

    toggleTheme() {
      this.themeService.toggleTheme();
    }

    logout() {
        this.authService.logout();
    }

    markAllRead() {
        this.notificationService.markAllAsRead().subscribe(() => {
            this.notifications.update(list => list.map(n => ({...n, is_read: true})));
            this.unreadCount.set(0);
        });
    }

    viewAll() {
        this.showNotifications.set(false);
        this.router.navigate(['/dashboard/notifications']);
    }
}
