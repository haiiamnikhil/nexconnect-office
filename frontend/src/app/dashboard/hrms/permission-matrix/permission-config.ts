// Permission Grouping Schema and Role Templates

export interface PermissionGroup {
  label: string;
  icon: string;
  description: string;
  permissions: string[];
}

export interface RoleTemplate {
  name: string;
  description: string;
  permissions: string[];
}

export const PERMISSION_GROUPS: Record<string, PermissionGroup> = {
  employee: {
    label: 'Employee Management',
    icon: 'fas fa-users',
    description: 'Manage employee records, profiles, and career progression',
    permissions: ['employee:CREATE', 'employee:EDIT', 'employee:DELETE', 'employee:VIEW']
  },
  leave: {
    label: 'Leave Management',
    icon: 'fas fa-calendar-alt',
    description: 'Handle leave requests, approvals, and balance tracking',
    permissions: ['leave:CREATE', 'leave:EDIT', 'leave:VIEW', 'leave:APPROVE']
  },
  attendance: {
    label: 'Attendance',
    icon: 'fas fa-clock',
    description: 'Track and manage employee attendance and timesheets',
    permissions: ['attendance:CREATE', 'attendance:EDIT', 'attendance:VIEW']
  },
  payroll: {
    label: 'Payroll',
    icon: 'fas fa-money-bill-wave',
    description: 'Process payroll, manage salary structures and tax declarations',
    permissions: ['payroll:CREATE', 'payroll:EDIT', 'payroll:VIEW']
  },
  performance: {
    label: 'Performance',
    icon: 'fas fa-chart-line',
    description: 'Manage goals, appraisals, and performance reviews',
    permissions: ['performance:CREATE', 'performance:EDIT', 'performance:VIEW']
  },
  recruitment: {
    label: 'Recruitment',
    icon: 'fas fa-user-plus',
    description: 'Post jobs, manage applications, and hiring pipeline',
    permissions: ['recruitment:CREATE', 'recruitment:EDIT', 'recruitment:VIEW']
  },
  assets: {
    label: 'Asset Management',
    icon: 'fas fa-laptop',
    description: 'Track and allocate company assets to employees',
    permissions: ['asset:CREATE', 'asset:EDIT', 'asset:VIEW']
  },
  helpdesk: {
    label: 'Helpdesk',
    icon: 'fas fa-ticket-alt',
    description: 'Manage support tickets and employee requests',
    permissions: ['helpdesk:CREATE', 'helpdesk:EDIT', 'helpdesk:VIEW']
  },
  document: {
    label: 'Documents',
    icon: 'fas fa-file-alt',
    description: 'Manage company documents, policies, and templates',
    permissions: ['document:CREATE', 'document:EDIT', 'document:DELETE', 'document:VIEW']
  },
  learning: {
    label: 'Learning & Development',
    icon: 'fas fa-graduation-cap',
    description: 'Manage training courses and employee learning paths',
    permissions: ['learning:CREATE', 'learning:EDIT', 'learning:VIEW']
  },
  organization: {
    label: 'Organization Structure',
    icon: 'fas fa-sitemap',
    description: 'Manage departments, locations, and designations',
    permissions: ['organization:EDIT', 'organization:VIEW']
  },
  analytics: {
    label: 'Analytics & Reports',
    icon: 'fas fa-chart-bar',
    description: 'View reports, analytics, and export data',
    permissions: ['analytics:VIEW', 'analytics:EXPORT']
  }
};

export const ROLE_TEMPLATES: Record<string, RoleTemplate> = {
  hr_specialist: {
    name: 'HR Specialist',
    description: 'Full access to employee, leave, attendance, and payroll management',
    permissions: [
      'employee:CREATE', 'employee:EDIT', 'employee:DELETE', 'employee:VIEW',
      'leave:CREATE', 'leave:EDIT', 'leave:VIEW', 'leave:APPROVE',
      'attendance:CREATE', 'attendance:EDIT', 'attendance:VIEW',
      'payroll:CREATE', 'payroll:EDIT', 'payroll:VIEW',
      'document:VIEW', 'document:CREATE',
      'recruitment:CREATE', 'recruitment:EDIT', 'recruitment:VIEW'
    ]
  },
  department_manager: {
    name: 'Department Manager',
    description: 'View team data, approve leave/attendance, manage performance',
    permissions: [
      'employee:VIEW',
      'leave:EDIT', 'leave:APPROVE',
      'attendance:VIEW', 'attendance:EDIT',
      'performance:CREATE', 'performance:EDIT', 'performance:VIEW',
      'helpdesk:VIEW',
      'analytics:VIEW'
    ]
  },
  recruiter: {
    name: 'Recruiter',
    description: 'Full recruitment access with limited employee view',
    permissions: [
      'recruitment:CREATE', 'recruitment:EDIT', 'recruitment:VIEW',
      'employee:VIEW'
    ]
  },
  accountant: {
    name: 'Accountant',
    description: 'Payroll and financial reporting access',
    permissions: [
      'payroll:CREATE', 'payroll:EDIT', 'payroll:VIEW',
      'employee:VIEW',
      'analytics:VIEW', 'analytics:EXPORT'
    ]
  },
  read_only_viewer: {
    name: 'Read-Only Viewer',
    description: 'View-only access to all modules (no modifications)',
    permissions: [
      'employee:VIEW',
      'leave:VIEW',
      'attendance:VIEW',
      'payroll:VIEW',
      'performance:VIEW',
      'recruitment:VIEW',
      'asset:VIEW',
      'helpdesk:VIEW',
      'document:VIEW',
      'learning:VIEW',
      'organization:VIEW',
      'analytics:VIEW'
    ]
  }
};
