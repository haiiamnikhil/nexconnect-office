# PLAN-enterprise-erp-suite.md

> **State:** COMPLETED
> **Mode:** VERIFICATION
> **Agent:** Project Planner / Orchestrator

## 1. Overview

Building a comprehensive **B2B SaaS Enterprise Platform** designed for corporate clients (IT, Banking, Finance, Manufacturing). The system integrates **HRMS**, **CRM**, and **ERP** functionalities into a unified suite, built with a **Domain-Driven Design (DDD)** architecture.

### core Value Proposition

- Unified data ecosystem for corporate management.
- Multi-tenancy support for SaaS delivery.
- Modular architecture allowing distinct HR, CRM, and ERP operations.

### Constraints & Preferences

- **Stack:** Angular 19 (Frontend) + Django 4.0 (Backend).
- **Architecture:** Domain-Driven Design (DDD).
- **Exclusions:** No Payment Gateway integration for MVP.
- **Target:** Corporate/Enterprise grade (High reliability, RBAC).

---

## 2. Technical Architecture

### Tech Stack

| Layer        | Technology  | Reason                                                           |
| ------------ | ----------- | ---------------------------------------------------------------- |
| **Frontend** | Angular 19  | Enterprise-grade, Signals, Standalone Components, Strict Typing. |
| **Backend**  | Django 4.0+ | Robust ORM, Security, Rapid Development.                         |
| **Database** | PostgreSQL  | Relational integrity, JSONB support for flexible schemas.        |
| **Infra**    | Docker      | Containerization for consistent dev/prod environments.           |
| **Caching**  | Redis       | Session storage, caching, async tasks (Celery).                  |

### DDD Strategy

Standard Django is MVT. To enforce DDD:

- **Project Structure:** Organized by _Domains_ (not just roughly "apps").
- **Layers:**
  - `Presentation`: Django Views / DRF Serializers.
  - `Application`: Service Layer (Use Cases).
  - `Domain`: Business Logic, Entities, Value Objects (Pure Python).
  - `Infrastructure`: Repositories, External APIs.

---

## 3. Domain Decomposition

### A. Core / Shared Kernel

- **Multi-tenancy:** Tenant separation (Schema-based or ID-based).
- **IAM:** User Authentication, Role-Based Access Control (RBAC), Permissions.
- **Audit:** Logging of critical actions.

### B. HRMS Context (Human Resources)

- **Employee Mgmt:** Onboarding, Profiles, Documents.
- **Attendance:** Shift management, Biometric logs integration points, Timesheets.
- **Payroll:** Salary structures, Payslip generation (Calculation logic).
- **Leave:** Policies, Requests, Approval workflows.

### C. CRM Context (Customer Relations)

- **Lead Mgmt:** Lead capture, Pipelines, Conversion tracking.
- **Client Mgmt:** Corporate Entity profiles, Contacts, SLAs.
- **Sales:** Opportunity tracking, Quotations.

### D. ERP Context (Resource Planning)

- **Inventory:** (Manufacturing focus) Stock levels, Warehouses, SKUs.
- **Projects:** (IT focus) Project tracking, Resource Allocation, Milestones.
- **Assets:** Company asset tracking (Laptops, Machinery).

---

## 4. Implementation Plan

### Phase 1: Foundation & Architecture Setup

- [x] **Repo Setup:** Initialize Git, `.gitignore`, README.
- [x] **Docker:** Configure `docker-compose.yml` (Django, Postgres, Redis).
- [x] **Backend Core:**
  - Initialize Django project.
  - Implement abstract DDD classes (BaseEntity, Repository interfaces).
  - Setup Multi-tenancy middleware.
  - Apps created: `users`, `hrms`, `crm`, `erp`.
  - venv created.
- [x] **Frontend Core:**
  - Initialize Angular 19 workspace.
  - Setup Design System (Tailwind).
  - Configure Core Modules (Auth, HTTP Interceptors).

### Phase 2: IAM & Multi-tenancy (The "Key")

- [x] **Backend:**
  - Implement `Tenant` model in `users` app.
  - Implement `User` model with Multi-tenancy support.
  - Configured SimpleJWT Authentication.
  - Auth APIs (Login, Register/RegisterTenant).
- [x] **Frontend:**
  - Login Page (SaaS branding, Glassmorphism).
  - Register Page (Tenant Creation).
  - Admin Dashboard Shell (Sidebar, Header).
  - Auth Service with Signals.

### Phase 3: HRMS Implementation

- [x] **Employee Module:**
  - CRUD Employees.
  - Department/Designation master data.
  - Backend Models & API implemented with Tenant Isolation.
  - Frontend Listing added.
- [x] **Attendance & Leave:**
  - Leave Policy configuration.
  - Leave Request/Approval UI & API.
  - Daily attendance marking.
  - Backend Models: Attendance, Leave.
  - Frontend Service: `HrmsService`.

### Phase 4: CRM Implementation

- [x] **Leads & Clients:**
  - Lead Pipeline (Kanban view in Angular).
  - Client Directory.
  - Backend Models: `Client`, `Lead`, `Interaction`.
  - Backend API: ViewSets with Tenant Isolation.
  - Frontend: `LeadKanbanComponent` with Drag & Drop.
- [x] **Interaction History:**
  - Commenting/Logging calls and emails against clients.
  - Implemented `Interaction` model & API.

### Phase 5: ERP Core Implementation

- [x] **Project Management:**
  - Project creation linked to Clients.
  - Resource assignment (Employees).
  - Backend Models: `Project`, `Task`.
  - Frontend: `ProjectListComponent`.
- [x] **Inventory (Basic):**
  - Item Master.
  - Stock In/Out transactions.
  - Backend Models: `InventoryItem`, `StockTransaction`.
  - Frontend: `InventoryDashboardComponent` with realtime stock status.

### Phase 6: Polish & Verification

- [ ] **Unit Tests:** Backend Services and Domain logic.
- [ ] **UI Polish:** Responsive check, Loading states, Error handling.
- [ ] **Security:** Check Headers, CORS, CSRF, Password policies.

---

## 5. Verification Plan (Phase X)

### Automated Checks

- [ ] `python manage.py test` (Backend Domain Logic)
- [ ] `ng test` (Frontend Components)
- [ ] `flake8` / `black` (Python Linting)
- [ ] `eslint` (Angular Linting)

### Manual Verification

- **Multi-tenancy:** Verify User A cannot see User B's data.
- **Auth:** Verify Token expiry and Refresh flow.
- **Roles:** Verify "Employee" role cannot access "Admin" settings.
- **Flow:** Onboard Employee -> Assign to Project -> Log Time.

---

## 6. Next Steps

1. Perform final manual verification.
2. Deploy to staging (future).
