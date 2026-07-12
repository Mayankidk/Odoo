# AssetFlow — Software Requirements Specification & Feature List

## 1. Introduction

### 1.1 Purpose
This document specifies the functional and non-functional requirements for AssetFlow, an Enterprise Asset & Resource Management System. It serves as the contractual requirements baseline for design, development, testing, and acceptance.

### 1.2 Scope
AssetFlow provides organizations with a centralized web platform to manage physical assets and shared resources. The system covers asset lifecycle management, conflict-free allocation, time-slot resource booking, maintenance approval workflows, structured audit cycles, and role-based access control. It explicitly excludes purchasing, invoicing, and accounting modules.

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|------|-----------|
| **Asset** | A physical item owned by the organization (laptop, desk, vehicle, projector, etc.) |
| **Shared Resource** | An asset flagged as bookable by time slot (meeting room, pool vehicle, shared equipment) |
| **Asset Tag** | Auto-generated unique identifier (e.g., AF-0001) |
| **Allocation** | Assigning a non-shared asset to a specific employee or department |
| **Booking** | Reserving a shared resource for a specific time slot |
| **Audit Cycle** | A structured verification period where auditors physically verify assets |
| **Discrepancy Report** | Auto-generated report of assets marked Missing or Damaged during an audit |
| **Transfer Request** | Workflow to move an already-allocated asset from one holder to another |
| **KPI** | Key Performance Indicator |
| **RBAC** | Role-Based Access Control |

### 1.4 Stakeholders

| Stakeholder | Interest |
|-------------|----------|
| Organization Leadership | ROI, asset visibility, compliance |
| IT Department | Deployment, security, maintenance |
| Department Heads | Departmental asset oversight |
| Asset Managers | Day-to-day asset operations |
| Employees | Self-service asset/resource access |
| Auditors | Verification workflow efficiency |
| Hackathon Judges | Architecture quality, UX, functionality |

---

## 2. User Types & Roles

| Role | Permissions | How Assigned |
|------|------------|-------------|
| **Admin** | Full system access: org setup, role promotion, audit management, analytics | Pre-seeded or first-user setup |
| **Asset Manager** | Register/allocate assets, approve transfers, approve maintenance, manage audits | Admin promotes from Employee Directory |
| **Department Head** | View department assets, approve department transfers, book resources for department | Admin promotes from Employee Directory |
| **Employee** | View own assets, book resources, raise maintenance requests, initiate returns/transfers | Default role on signup |
| **Auditor** | Verify assets during assigned audit cycles, mark status | Assigned per audit cycle |

---

## 3. Functional Requirements

### FR-01: Authentication & Authorization
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01.1 | System shall allow user registration with email and password, creating an Employee account | Must |
| FR-01.2 | Signup shall NOT allow role selection — all new accounts are Employee role | Must |
| FR-01.3 | System shall authenticate users via email/password with session validation | Must |
| FR-01.4 | System shall provide "Forgot Password" functionality via email reset link | Must |
| FR-01.5 | Only Admin can promote employees to Department Head or Asset Manager from the Employee Directory | Must |
| FR-01.6 | System shall enforce role-based access on every API endpoint | Must |
| FR-01.7 | System shall invalidate sessions on logout and support token refresh | Should |

### FR-02: Dashboard
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-02.1 | Dashboard shall display KPI cards: Assets Available, Assets Allocated, Maintenance Today, Active Bookings, Pending Transfers, Upcoming Returns | Must |
| FR-02.2 | Overdue returns (past Expected Return Date) shall be highlighted separately | Must |
| FR-02.3 | Dashboard shall provide quick-action buttons: Register Asset, Book Resource, Raise Maintenance Request | Must |
| FR-02.4 | KPI data shall be role-scoped (Admin sees org-wide, Dept Head sees department, Employee sees personal) | Should |

### FR-03: Organization Setup (Admin Only)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-03.1 | Admin shall create, edit, and deactivate departments | Must |
| FR-03.2 | Admin shall assign a Department Head and optional Parent Department per department | Must |
| FR-03.3 | Admin shall create and edit asset categories (Electronics, Furniture, Vehicles, etc.) | Must |
| FR-03.4 | Categories shall support optional category-specific fields (e.g., warranty period for Electronics) | Should |
| FR-03.5 | Admin shall manage the Employee Directory: view name, email, department, role, status | Must |
| FR-03.6 | Admin shall promote employees to Department Head or Asset Manager from the Employee Directory | Must |
| FR-03.7 | Admin shall deactivate employee accounts (soft delete) | Must |

### FR-04: Asset Registration & Directory
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-04.1 | Asset Manager shall register assets with: Name, Category, auto-generated Asset Tag, Serial Number, Acquisition Date, Acquisition Cost, Condition, Location, photo/documents, shared/bookable flag | Must |
| FR-04.2 | System shall auto-generate Asset Tags in format AF-XXXX | Must |
| FR-04.3 | Users shall search/filter assets by Asset Tag, Serial Number, category, status, department, location | Must |
| FR-04.4 | Each asset shall display its lifecycle status: Available, Allocated, Reserved, Under Maintenance, Lost, Retired, Disposed | Must |
| FR-04.5 | Each asset shall maintain allocation history and maintenance history | Must |
| FR-04.6 | System shall support QR code search for assets | Could |

### FR-05: Asset Allocation & Transfer
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-05.1 | Asset Manager shall allocate assets to employee/department with optional Expected Return Date | Must |
| FR-05.2 | System shall block allocation of already-allocated assets and show current holder info | Must |
| FR-05.3 | System shall offer a Transfer Request button when allocation is blocked | Must |
| FR-05.4 | Transfer workflow: Requested → Approved (by Asset Manager/Dept Head) → Re-allocated (history updated) | Must |
| FR-05.5 | Return flow: mark returned, capture condition check-in notes, asset status reverts to Available | Must |
| FR-05.6 | Overdue allocations (past Expected Return Date) shall be auto-flagged | Must |
| FR-05.7 | Overdue items shall feed Dashboard KPIs and Notifications | Must |

### FR-06: Resource Booking
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-06.1 | System shall display a calendar view of a resource's existing bookings | Must |
| FR-06.2 | System shall validate and reject overlapping time-slot bookings | Must |
| FR-06.3 | Adjacent bookings (end time = start time of next) shall be allowed | Must |
| FR-06.4 | Booking statuses: Upcoming, Ongoing, Completed, Cancelled | Must |
| FR-06.5 | Users shall cancel or reschedule bookings | Must |
| FR-06.6 | System shall send reminder notifications before booking start time | Should |

### FR-07: Maintenance Management
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-07.1 | Any user shall raise a maintenance request: select asset, describe issue, set priority, attach photo | Must |
| FR-07.2 | Workflow: Pending → Approved/Rejected (by Asset Manager) → Technician Assigned → In Progress → Resolved | Must |
| FR-07.3 | Asset status shall auto-update to "Under Maintenance" on approval | Must |
| FR-07.4 | Asset status shall revert to "Available" on resolution | Must |
| FR-07.5 | Maintenance history shall be retained per asset | Must |

### FR-08: Asset Audit
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-08.1 | Admin/Asset Manager shall create audit cycles with scope (department/location) and date range | Must |
| FR-08.2 | One or more auditors shall be assigned per cycle | Must |
| FR-08.3 | Auditors shall mark each asset: Verified, Missing, or Damaged | Must |
| FR-08.4 | System shall auto-generate discrepancy reports for flagged items | Must |
| FR-08.5 | Closing an audit cycle shall lock it and update affected asset statuses (e.g., Lost for confirmed-missing) | Must |
| FR-08.6 | Audit history shall be retained per cycle | Must |

### FR-09: Reports & Analytics
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-09.1 | System shall show asset utilization trends (most-used vs. idle assets) | Should |
| FR-09.2 | System shall show maintenance frequency by asset/category | Should |
| FR-09.3 | System shall show assets due for maintenance or nearing retirement | Should |
| FR-09.4 | System shall show department-wise allocation summary | Should |
| FR-09.5 | System shall show resource booking heatmap (peak usage windows) | Could |
| FR-09.6 | Reports shall be exportable (CSV/PDF) | Should |

### FR-10: Activity Logs & Notifications
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-10.1 | System shall send notifications for: Asset Assigned, Maintenance Approved/Rejected, Booking Confirmed/Cancelled/Reminder, Transfer Approved, Overdue Return Alert, Audit Discrepancy Flagged | Must |
| FR-10.2 | System shall maintain a full audit log of admin/manager/employee actions (who, what, when) | Must |
| FR-10.3 | Users shall view their notifications in-app | Must |
| FR-10.4 | System shall support email notifications for critical events | Could |

---

## 4. Non-Functional Requirements

| ID | Category | Requirement | Target |
|----|----------|-------------|--------|
| NFR-01 | Performance | Dashboard load time | < 2s (P95) |
| NFR-02 | Performance | API response time for CRUD operations | < 500ms (P95) |
| NFR-03 | Performance | Concurrent users supported | 1,000+ without degradation |
| NFR-04 | Scalability | Horizontal scaling of API servers | Stateless backend, load-balanced |
| NFR-05 | Scalability | Database handles 100K+ assets, 1M+ bookings | Indexed queries, pagination |
| NFR-06 | Availability | System uptime | > 99.5% |
| NFR-07 | Security | Authentication | JWT with refresh tokens, bcrypt password hashing |
| NFR-08 | Security | Authorization | RBAC enforced on every endpoint |
| NFR-09 | Security | Data protection | HTTPS (TLS 1.2+), encrypted secrets, parameterized queries |
| NFR-10 | Usability | Responsive design | Mobile-first, works on 320px – 2560px screens |
| NFR-11 | Usability | Accessibility | WCAG 2.1 AA compliance |
| NFR-12 | Maintainability | Code coverage | > 70% for backend |
| NFR-13 | Maintainability | Modular architecture | Feature-based modules, clean separation of concerns |
| NFR-14 | Reliability | Data integrity | Database constraints, transactional operations |
| NFR-15 | Compatibility | Browser support | Chrome, Firefox, Edge, Safari (latest 2 versions) |

---

## 5. Business Rules

| ID | Rule |
|----|------|
| BR-01 | A user who signs up can only be an Employee. Role promotion is Admin-only. |
| BR-02 | A non-shared asset can only be allocated to ONE holder at a time. |
| BR-03 | If an asset is already allocated, the system must block re-allocation and offer a Transfer Request. |
| BR-04 | Two bookings for the same shared resource CANNOT have overlapping time ranges. Adjacent (end = next start) is allowed. |
| BR-05 | A maintenance request must be Approved by an Asset Manager before work begins and before the asset status changes. |
| BR-06 | An audit cycle, once closed, is locked — no further modifications to verification results. |
| BR-07 | Overdue returns are auto-flagged when the current date exceeds the Expected Return Date. |
| BR-08 | Closing an audit with a "Missing" asset automatically sets the asset status to "Lost." |
| BR-09 | Asset Tags are system-generated and immutable after creation. |
| BR-10 | Deactivated departments cannot receive new asset allocations. |

---

## 6. Constraints

1. **Hackathon Timeline** — Full system must be demonstrable within the hackathon window (typically 24–48 hours).
2. **No Financial Modules** — No purchasing, invoicing, or accounting.
3. **Web Only** — No native mobile apps for the MVP.
4. **Single Tenant** — One organization per deployment.
5. **English Only** — No i18n for the MVP.

---

## 7. Acceptance Criteria

| Feature | Acceptance Criteria |
|---------|-------------------|
| Authentication | User can sign up (Employee only), log in, and reset password. Admin can promote roles. Self-promotion is impossible. |
| Dashboard | KPI cards load with correct counts. Overdue returns are highlighted. Quick actions navigate correctly. |
| Org Setup | Admin can CRUD departments, categories, employees. Non-admin cannot access. |
| Asset Registration | Asset Manager can register an asset. Asset Tag is auto-generated. Search/filter returns correct results. |
| Allocation | Allocation succeeds for available assets. System blocks double-allocation and shows current holder. Transfer workflow completes. |
| Booking | Calendar shows existing bookings. Overlapping bookings are rejected. Adjacent bookings succeed. |
| Maintenance | Request → Approval → Assignment → Resolution workflow completes. Asset status updates automatically. |
| Audit | Audit cycle created, auditors assigned, assets verified, discrepancy report generated, cycle closed, asset statuses updated. |
| Reports | Charts render with correct data. Export produces valid CSV/PDF. |
| Notifications | In-app notifications appear for specified events. Audit log records all actions. |

---

## 8. MoSCoW-Prioritized Feature List

### Must Have (MVP — Demo-Ready)
- [x] Email/password signup (Employee only) and login
- [x] Forgot password flow
- [x] Role-based access control (Admin, Asset Manager, Department Head, Employee)
- [x] Admin role promotion from Employee Directory
- [x] Dashboard with KPI cards and overdue alerts
- [x] Department CRUD (Admin)
- [x] Asset Category CRUD (Admin)
- [x] Employee Directory management (Admin)
- [x] Asset Registration with auto-generated Asset Tags
- [x] Asset search/filter by tag, serial, category, status, department, location
- [x] Asset lifecycle status display (7 states)
- [x] Asset Allocation with double-allocation blocking
- [x] Transfer Request workflow (Requested → Approved → Re-allocated)
- [x] Return flow with condition notes
- [x] Overdue return auto-flagging
- [x] Resource Booking with calendar view
- [x] Booking overlap validation
- [x] Maintenance Request workflow (Pending → Approved → Assigned → In Progress → Resolved)
- [x] Auto-update of asset status during maintenance
- [x] Audit Cycle creation, auditor assignment, verification, discrepancy report
- [x] Audit cycle close with status updates
- [x] In-app notifications for key events
- [x] Activity audit log

### Should Have (Polish — If Time Permits)
- [ ] Category-specific custom fields (e.g., warranty for Electronics)
- [ ] Role-scoped dashboard KPIs (Admin=org-wide, Dept Head=department, Employee=personal)
- [ ] Booking reminder notifications
- [ ] Asset utilization trend charts
- [ ] Maintenance frequency reports
- [ ] Department-wise allocation summary report
- [ ] Exportable reports (CSV)
- [ ] Per-asset allocation + maintenance history timeline
- [ ] Refresh token rotation

### Could Have (Nice-to-Have — Stretch Goals)
- [ ] QR code search for assets
- [ ] Resource booking heatmap (peak usage windows)
- [ ] Email notifications for critical events
- [ ] PDF report export
- [ ] Drag-and-drop calendar for booking
- [ ] Dark mode toggle

### Won't Have (Out of Scope for Hackathon)
- Multi-tenancy
- SSO/SAML integration
- IoT/RFID/BLE tracking
- Procurement & vendor management
- Predictive maintenance (ML)
- Native mobile apps
- Multi-language support
- Offline mode
- Financial/accounting modules

---

*Cross-references: [01_Project_Overview.md](./01_Project_Overview.md) | [03_UX_and_Use_Cases.md](../design/03_UX_and_Use_Cases.md) | [06_API_Design.md](../api/06_API_Design.md)*
