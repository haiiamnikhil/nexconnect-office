from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DepartmentViewSet, EmployeeViewSet, LeaveViewSet, AttendanceViewSet
# RBAC routes moved to entitlements app
from .views.employee_views import (
    EmployeeViewSet as EmployeeV2ViewSet,
    EmployeeDocumentViewSet,
    EmployeeSkillViewSet,
    DepartmentViewSet as DepartmentV2ViewSet
)
from .views.org_views import (
    DepartmentViewSet as OrgDepartmentViewSet,
    DesignationViewSet,
    LocationViewSet,
    OrgHierarchyViewSet
)
from .views.attendance_views import (
    AttendancePolicyViewSet,
    ShiftViewSet,
    AttendanceViewSet as AttendanceV2ViewSet
)
from .views.leave_views import (
    LeaveTypeViewSet,
    LeaveBalanceViewSet,
    LeaveViewSet as LeaveV2ViewSet
)
from .views.payroll_views import (
    SalaryComponentViewSet, SalaryStructureViewSet, EmployeeSalaryViewSet,
    PayrollRunViewSet, PayslipViewSet
)
from .views.tax_declaration_views import TaxDeclarationViewSet

router = DefaultRouter()

# Employee Management V2 (Module 2)
router.register(r'employees-v2', EmployeeV2ViewSet, basename='employee-v2')
router.register(r'employee-documents', EmployeeDocumentViewSet, basename='employee-document')
router.register(r'employee-skills', EmployeeSkillViewSet, basename='employee-skill')
router.register(r'departments-v2', DepartmentV2ViewSet, basename='department-v2')

# Organization Structure (Module 3)
router.register(r'org-departments', OrgDepartmentViewSet, basename='org-department')
router.register(r'designations', DesignationViewSet, basename='designation')
router.register(r'locations', LocationViewSet, basename='location')
router.register(r'org-hierarchy', OrgHierarchyViewSet, basename='org-hierarchy')

# Attendance Management (Module 4)
router.register(r'attendance-policies', AttendancePolicyViewSet, basename='attendance-policy')
router.register(r'shifts', ShiftViewSet, basename='shift')
router.register(r'attendance-v2', AttendanceV2ViewSet, basename='attendance-v2')

# Leave Management (Module 5)
router.register(r'leave-types', LeaveTypeViewSet, basename='leave-type')
router.register(r'leave-balances', LeaveBalanceViewSet, basename='leave-balance')
router.register(r'leave-applications', LeaveV2ViewSet, basename='leave-application')

# Legacy routes (keep for backward compatibility)
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'employees', EmployeeViewSet, basename='employee')
router.register(r'leaves', LeaveViewSet, basename='leave')
router.register(r'attendance', AttendanceViewSet, basename='attendance')


# Payroll Management (Module 6)
router.register(r'salary-components', SalaryComponentViewSet, basename='salary-component')
router.register(r'salary-structures', SalaryStructureViewSet, basename='salary-structure')
router.register(r'employee-salary', EmployeeSalaryViewSet, basename='employee-salary')
router.register(r'payroll-runs', PayrollRunViewSet, basename='payroll-run')
router.register(r'payslips', PayslipViewSet, basename='payslip')
router.register(r'tax-declarations', TaxDeclarationViewSet, basename='tax-declaration')

# Performance Management (Module 7)
from .views.performance_views import AppraisalCycleViewSet, GoalViewSet, ReviewViewSet
router.register(r'performance/cycles', AppraisalCycleViewSet, basename='appraisal-cycle')
router.register(r'performance/goals', GoalViewSet, basename='performance-goal')

router.register(r'performance/reviews', ReviewViewSet, basename='performance-review')

# Asset Management (Module 8)
from .views.asset_views import AssetCategoryViewSet, AssetViewSet, MyAssetsViewSet
router.register(r'assets/categories', AssetCategoryViewSet, basename='asset-category')
router.register(r'assets/inventory', AssetViewSet, basename='asset-inventory')

router.register(r'assets/my-assets', MyAssetsViewSet, basename='my-assets')

# Recruitment (Module 9)
from .views.recruitment_views import JobPostingViewSet, CandidateViewSet, JobApplicationViewSet, InterviewViewSet
router.register(r'recruitment/jobs', JobPostingViewSet, basename='jobs')
router.register(r'recruitment/candidates', CandidateViewSet, basename='candidates')
router.register(r'recruitment/applications', JobApplicationViewSet, basename='job-applications')
router.register(r'recruitment/interviews', InterviewViewSet, basename='interviews')

# Lifecycle (Module 10)
from .views.lifecycle_views import OnboardingTaskViewSet, OffboardingRequestViewSet, ExitClearanceViewSet
router.register(r'lifecycle/onboarding', OnboardingTaskViewSet, basename='onboarding')
router.register(r'lifecycle/offboarding', OffboardingRequestViewSet, basename='offboarding')

router.register(r'lifecycle/clearances', ExitClearanceViewSet, basename='clearances')

# Helpdesk (Module 11)
from .views.helpdesk_views import TicketViewSet
router.register(r'helpdesk/tickets', TicketViewSet, basename='tickets')

# Analytics (Module 12)
from .views.analytics_views import AnalyticsViewSet
router.register(r'analytics', AnalyticsViewSet, basename='analytics')

# Dashboard (New)
from .views.dashboard_views import DashboardViewSet
router.register(r'dashboard', DashboardViewSet, basename='dashboard')

# Notifications (Module 13)
from .views.notification_views import NotificationViewSet
router.register(r'notifications', NotificationViewSet, basename='notifications')

# DMS (Module 14)
from .views.dms_views import DocumentCategoryViewSet, CompanyDocumentViewSet
router.register(r'documents/categories', DocumentCategoryViewSet, basename='document-categories')
router.register(r'documents/files', CompanyDocumentViewSet, basename='company-documents')




# Learning Management (Module 16)
from .views.learning_views import CourseViewSet, EnrollmentViewSet, CourseCategoryViewSet
router.register(r'learning/courses', CourseViewSet, basename='courses')
router.register(r'learning/categories', CourseCategoryViewSet, basename='course-categories')
router.register(r'learning/enrollments', EnrollmentViewSet, basename='enrollments')

# AI Assistant (Module 15)
from .views.ai_views import AskHRView
from django.urls import path

urlpatterns = [
    path('', include(router.urls)),
    path('ai/ask/', AskHRView.as_view(), name='ai-ask'),
]
