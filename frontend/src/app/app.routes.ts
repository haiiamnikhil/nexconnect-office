import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { DashboardHomeComponent } from './dashboard/dashboard-home/dashboard-home.component';
import { EmployeeListComponent } from './dashboard/hrms/employee-list/employee-list.component';
import { EmployeeFormComponent } from './dashboard/hrms/employee-list/employee-form/employee-form.component';
import { EmployeeDetailComponent } from './dashboard/hrms/employee-list/employee-detail/employee-detail.component';
import { LeadKanbanComponent } from './dashboard/crm/lead-kanban/lead-kanban.component';
import { ClientListComponent } from './dashboard/crm/client-list/client-list.component';
import { ProjectListComponent } from './dashboard/erp/project-list/project-list.component';
import { InventoryDashboardComponent } from './dashboard/erp/inventory-dashboard/inventory-dashboard.component';
import { RoleListComponent } from './dashboard/hrms/role-list/role-list.component';
import { PermissionMatrixComponent } from './dashboard/hrms/permission-matrix/permission-matrix.component';
import { LeaveRequestComponent } from './dashboard/hrms/leave-request/leave-request.component';
import { AttendanceDashboardComponent } from './dashboard/hrms/attendance-dashboard/attendance-dashboard.component';
import { OrgOverviewComponent } from './dashboard/hrms/org-overview/org-overview.component';
import { OrgChartComponent } from './dashboard/hrms/org-chart/org-chart.component';
import { ProfileComponent } from './dashboard/hrms/profile/profile.component';

// Payroll Components
import { PayrollDashboardComponent } from './dashboard/hrms/payroll/payroll-dashboard/payroll-dashboard.component';
import { SalaryStructureConfigComponent } from './dashboard/hrms/payroll/salary-structure-config/salary-structure-config.component';
import { RunPayrollComponent } from './dashboard/hrms/payroll/run-payroll/run-payroll.component';
import { PayslipViewComponent } from './dashboard/hrms/payroll/payslip-view/payslip-view.component';
import { TaxDeclarationComponent } from './dashboard/hrms/payroll/tax-declaration/tax-declaration.component';

// Performance Components
import { PerformanceDashboardComponent } from './dashboard/hrms/performance/performance-dashboard/performance-dashboard.component';
import { MyGoalsComponent } from './dashboard/hrms/performance/my-goals/my-goals.component';
import { TeamReviewsComponent } from './dashboard/hrms/performance/team-reviews/team-reviews.component';
import { AppraisalFormComponent } from './dashboard/hrms/performance/appraisal-form/appraisal-form.component';

// Asset Components
import { AssetDashboardComponent } from './dashboard/hrms/assets/asset-dashboard/asset-dashboard.component';
import { AssetInventoryComponent } from './dashboard/hrms/assets/asset-inventory/asset-inventory.component';
import { MyAssetsComponent } from './dashboard/hrms/assets/my-assets/my-assets.component';

// Recruitment Components
import { JobBoardComponent } from './dashboard/hrms/recruitment/job-board/job-board.component';
import { CandidatePipelineComponent } from './dashboard/hrms/recruitment/candidate-pipeline/candidate-pipeline.component';
import { InterviewSchedulerComponent } from './dashboard/hrms/recruitment/interview-scheduler/interview-scheduler.component';
import { JobApplicationListComponent } from './dashboard/hrms/recruitment/job-application-list/job-application-list.component';
import { JobDetailComponent } from './dashboard/hrms/recruitment/job-detail/job-detail.component';
import { JobFormComponent } from './dashboard/hrms/recruitment/job-form/job-form.component';
import { PublicJobListComponent } from './public/careers/job-list/public-job-list.component';
import { PublicJobDetailComponent } from './public/careers/job-detail/job-detail.component';

// Lifecycle Components
import { OnboardingChecklistComponent } from './dashboard/hrms/lifecycle/onboarding-checklist/onboarding-checklist.component';
import { ResignationFormComponent } from './dashboard/hrms/lifecycle/resignation-form/resignation-form.component';
import { ClearanceDashboardComponent } from './dashboard/hrms/lifecycle/clearance-dashboard/clearance-dashboard.component';

// Helpdesk Components
import { TicketListComponent } from './dashboard/hrms/helpdesk/ticket-list/ticket-list.component';
import { TicketDetailComponent } from './dashboard/hrms/helpdesk/ticket-detail/ticket-detail.component';

// Analytics Components
import { AnalyticsDashboardComponent } from './dashboard/hrms/analytics/analytics-dashboard/analytics-dashboard.component';
import { CustomReportsComponent } from './dashboard/hrms/analytics/custom-reports/custom-reports.component';

// Notification Components
import { NotificationListComponent } from './dashboard/hrms/notifications/notification-list/notification-list.component';

// DMS Components
import { DocumentLibraryComponent } from './dashboard/hrms/dms/document-library/document-library.component';

// Asset Components
import { AssetDetailComponent } from './dashboard/hrms/assets/asset-detail/asset-detail.component';

// Learning Components
import { CourseCatalogComponent } from './dashboard/hrms/learning/course-catalog/course-catalog.component';
import { MyLearningComponent } from './dashboard/hrms/learning/my-learning/my-learning.component';
import { CoursePlayerComponent } from './dashboard/hrms/learning/course-player/course-player.component';

// Guards
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { 
        path: 'change-password', 
        loadComponent: () => import('./auth/change-password/change-password.component').then(m => m.ChangePasswordComponent)
    },
    { 
        path: 'onboarding', 
        loadComponent: () => import('./auth/onboarding/onboarding.component').then(m => m.OnboardingComponent),
        canActivate: [authGuard]
    },
    { 
        path: 'dashboard', 
        component: AdminLayoutComponent,
        canActivate: [authGuard], // Protected by authentication guard
        children: [
            { path: '', component: DashboardHomeComponent },
            { path: 'employees', component: EmployeeListComponent },
            { path: 'employees/create', component: EmployeeFormComponent },
            { path: 'employees/:id', component: EmployeeDetailComponent },
            { path: 'employees/edit/:id', component: EmployeeFormComponent },
            { path: 'roles', component: RoleListComponent },
            { path: 'permissions', component: PermissionMatrixComponent },
            { path: 'leaves', component: LeaveRequestComponent },
            { path: 'attendance', component: AttendanceDashboardComponent },
            { 
                path: 'attendance/all', 
                loadComponent: () => import('./dashboard/hrms/attendance-dashboard/all-attendance.component').then(m => m.AllAttendanceComponent)
            },
            { path: 'org-structure', component: OrgOverviewComponent },
            { path: 'org-chart', component: OrgChartComponent },
            { path: 'leads', component: LeadKanbanComponent },
            { path: 'clients', component: ClientListComponent },
            { path: 'projects', component: ProjectListComponent },
            { path: 'inventory', component: InventoryDashboardComponent },
            
            // Payroll Module
            { path: 'payroll', component: PayrollDashboardComponent },
            { path: 'payroll/structures', component: SalaryStructureConfigComponent },
            { path: 'payroll/run', component: RunPayrollComponent },
            { path: 'payroll/payslips', component: PayslipViewComponent },
            { path: 'payroll/tax', component: TaxDeclarationComponent },

            // Performance Management (Module 7)
            { path: 'performance', component: PerformanceDashboardComponent },
            { path: 'performance/goals', component: MyGoalsComponent },
            { path: 'performance/team-reviews', component: TeamReviewsComponent },
            { path: 'performance/appraisals/:id', component: AppraisalFormComponent },

            // Asset Management (Module 8)
            { path: 'assets', component: AssetDashboardComponent },
            { path: 'assets/inventory', component: AssetInventoryComponent },
            { path: 'assets/inventory/:id', component: AssetDetailComponent },
            { path: 'assets/my-assets', component: MyAssetsComponent },


// Recruitment (Module 9)
            { path: 'recruitment', component: JobBoardComponent },
            { path: 'recruitment/jobs', component: JobBoardComponent },
            { path: 'recruitment/jobs/create', component: JobFormComponent }, // New Create Route
            { path: 'recruitment/jobs/:id', component: JobDetailComponent },
            { path: 'recruitment/applications', component: JobApplicationListComponent }, // New ATS Admin Route
            { path: 'recruitment/pipeline', component: CandidatePipelineComponent },
            { path: 'recruitment/interviews', component: InterviewSchedulerComponent },

            // Lifecycle (Module 10)
            { path: 'lifecycle/onboarding', component: OnboardingChecklistComponent },
            { path: 'lifecycle/resignation', component: ResignationFormComponent },
            { path: 'lifecycle/offboarding', component: ClearanceDashboardComponent },

            // Helpdesk (Module 11)
            { path: 'helpdesk', component: TicketListComponent },
            { path: 'helpdesk/tickets', component: TicketListComponent },
            { path: 'helpdesk/tickets/:id', component: TicketDetailComponent },

            // Analytics (Module 12)
            { path: 'analytics', component: AnalyticsDashboardComponent },
            { path: 'analytics/dashboard', component: AnalyticsDashboardComponent },
            { path: 'analytics/reports', component: CustomReportsComponent },

            // Notifications (Module 13)
            { path: 'notifications', component: NotificationListComponent },

            // DMS (Module 14)
            { path: 'documents', component: DocumentLibraryComponent },

            // Learning Management (Module 16)
            { path: 'learning/catalog', component: CourseCatalogComponent },
            { path: 'learning/my-courses', component: MyLearningComponent },
            { path: 'learning/courses/:id', component: CoursePlayerComponent },

            // System & Policies
            { 
              path: 'policies', 
              loadComponent: () => import('./dashboard/hrms/policies/policy-list/policy-list.component').then(m => m.PolicyListComponent),
              data: { title: 'Global Policies' }
            },
            
            // User Profile
            { path: 'profile', component: ProfileComponent },
            { path: 'profile/edit', component: EmployeeFormComponent },
        ]
    },
    { 
        path: '', 
        loadComponent: () => import('./landing/landing.component').then(m => m.LandingComponent) 
    },
    { 
        path: 'contact', 
        loadComponent: () => import('./landing/contact/contact.component').then(m => m.ContactComponent) 
    },
    { 
        path: 'about', 
        loadComponent: () => import('./landing/about/about.component').then(m => m.AboutComponent) 
    },
    { 
        path: 'products', 
        loadComponent: () => import('./landing/products/products.component').then(m => m.ProductsComponent) 
    },
    { path: 'careers', component: PublicJobListComponent },
    { path: 'careers/jobs/:id', component: PublicJobDetailComponent }
];
