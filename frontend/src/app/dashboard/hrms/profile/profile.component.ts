import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EmployeeService, Employee, UserActivity } from '../../../core/employee.service';
import { AuthService } from '../../../core/auth.service';
import { ErrorHandlerService } from '../../../core/error-handler.service';
import { environment } from '../../../../environments/environment';

interface UserStats {
  leave_balance: number;
  attendance_this_month: number;
  assets_assigned: number;
  working_days_this_month: number;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private authService = inject(AuthService);
  private errorHandler = inject(ErrorHandlerService);

  // State management
  employee = signal<Employee | null>(null);
  stats = signal<UserStats | null>(null);
  isLoading = signal(false);
  avatarUrl = signal<string | null>(null);

  // Activities Logic
  activities = signal<UserActivity[]>([]);
  showActivities = signal(false);

  // Tabs configuration
  tabs: ('overview' | 'documents' | 'activities' | 'settings')[] = ['overview', 'documents', 'activities', 'settings'];

  // Computed properties
  fullName = computed(() => {
    const emp = this.employee();
    if (!emp) return '';
    return `${emp.first_name} ${emp.last_name}`.trim();
  });

  initials = computed(() => {
    const emp = this.employee();
    if (!emp) return '??';
    const first = emp.first_name?.charAt(0) || '';
    const last = emp.last_name?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  });

  attendancePercentage = computed(() => {
    const s = this.stats();
    if (!s || s.working_days_this_month === 0) return 0;
    return Math.round((s.attendance_this_month / s.working_days_this_month) * 100);
  });

  constructor() {
      // Reactively check permissions whenever user state changes
      effect(() => {
          const user = this.authService.currentUser();
          console.log('ProfileComponent: Current User:', user);
          
          if (user) {
              const isAdmin = this.authService.hasRole('SUPER_ADMIN') || this.authService.hasRole('Admin');
              console.log('ProfileComponent: Is Admin?', isAdmin);
              this.showActivities.set(isAdmin);
              
              // If we have a user and activities are allowed, load them
              // We check if activities are empty to avoid redundant calls
              if (isAdmin && user.id && this.activities().length === 0) {
                  this.loadActivities(user.id);
              }
          }
      }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.isLoading.set(true);

    // Try fetching current employee profile directly from backend
    this.employeeService.getCurrentEmployee().subscribe({
      next: (data) => {
        this.employee.set(data);
        if (data.id) {
          this.loadStats(data.id);
          // Load activities if allowed
          if (this.showActivities() && data.user) {
              this.loadActivities(data.user);
          }
        }
        this.loadAvatar();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.warn('Failed to load current employee profile. Falling back to User data.', err);
        
        // Mock data removed. Show error if profile load fails.
        this.errorHandler.handleHttpError(err, 'Failed to load profile');
        this.isLoading.set(false);
      }

    });
  }

  loadStats(empId: number) {
    this.employeeService.getUserStats(empId).subscribe({
      next: (data) => {
        this.stats.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Failed to load stats');
        this.isLoading.set(false);
      }
    });
  }

  loadActivities(userId: number) {
      this.employeeService.getActivities(userId).subscribe({
          next: (data) => this.activities.set(data),
          error: (err) => console.error('Failed to load activities', err)
      });
  }

  loadAvatar() {
    // Avatar will be loaded from documents endpoint
    // For now, we'll use initials
  }

  // Tab management
  activeTab = signal<'overview' | 'documents' | 'settings' | 'activities'>('overview');
  documents = signal<any[]>([]);

  setActiveTab(tab: 'overview' | 'documents' | 'settings' | 'activities') {
    this.activeTab.set(tab);
    if (tab === 'documents' && this.documents().length === 0) {
      this.loadDocuments();
    }
  }

  loadDocuments() {
    const emp = this.employee();
    if (!emp?.id) return;
    
    // Using the service to fetch documents
    this.employeeService.getDocuments(emp.id).subscribe({
      next: (docs) => this.documents.set(docs),
      error: (err) => console.error('Failed to load documents', err)
    });
  }

  triggerUpload() {
    const fileInput = document.getElementById('docUpload') as HTMLInputElement;
    if (fileInput) fileInput.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const emp = this.employee();
    if (!emp?.id) return;

    const formData = new FormData();
    formData.append('employee', emp.id.toString());
    formData.append('document_type', 'Other'); 
    formData.append('document_name', file.name);
    formData.append('document_file', file);

    this.employeeService.uploadDocument(formData).subscribe({
      next: () => {
        this.loadDocuments();
        // ideally show success message
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'Upload failed');
      }
    });
  }

  downloadDocument(doc: any) {
    let url = doc.document_file;
    if (typeof url !== 'string') {
        console.warn('Invalid document URL');
        return;
    }
    


    // Handle relative paths by prepending backend URL
    if (url.startsWith('/')) {
        const baseUrl = environment.apiUrl.replace(/\/api$/, '');
        url = baseUrl + url;
    }
    
    window.open(url, '_blank');
  }

  signOutAll() {
    if(confirm('Are you sure you want to sign out from all sessions?')) {
        this.authService.logout();
    }
  }

  toggleTheme() {
    document.documentElement.classList.toggle('dark');
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }
}
