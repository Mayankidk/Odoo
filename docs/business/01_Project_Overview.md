# AssetFlow — Enterprise Asset & Resource Management System

## Executive Summary

AssetFlow is a centralized Enterprise Resource Planning (ERP) platform that digitizes how organizations track, allocate, and maintain their physical assets and shared resources. It replaces manual tracking methods (spreadsheets, paper logs) with structured asset lifecycles, centralized resource booking, role-based workflows, and real-time visibility into asset location, condition, and ownership.

The platform is industry-agnostic — any organization with equipment, furniture, vehicles, or shared spaces (offices, schools, hospitals, factories, agencies) can deploy AssetFlow to gain operational control over its physical assets.

---

## Vision & Mission

| Dimension | Statement |
|-----------|-----------|
| **Vision** | Simplify and digitize how organizations track, allocate, and maintain their physical assets and shared resources through a centralized, extensible ERP platform. |
| **Mission** | Build a user-centric, responsive application that provides staff with intuitive tools for department setup, asset registration and lifecycle tracking, conflict-free allocation, time-slot resource booking, maintenance approval workflows, structured audit cycles, and proactive notifications — all within a clean, modular architecture. |

---

## Objectives

1. **Digitize Asset Lifecycle Management** — Enable full tracking from acquisition through allocation, maintenance, audit, and disposal.
2. **Eliminate Double-Allocation Conflicts** — Enforce system-level rules preventing an asset from being assigned to two holders simultaneously.
3. **Provide Overlap-Free Resource Booking** — Validate time-slot bookings for shared resources (rooms, vehicles, equipment) in real time.
4. **Implement Approval-Driven Workflows** — Route maintenance requests and transfer requests through structured approval chains before action occurs.
5. **Enable Structured Audit Cycles** — Allow auditors to verify assets by department/location and auto-generate discrepancy reports.
6. **Deliver Role-Based Access Control** — Enforce Admin, Asset Manager, Department Head, and Employee roles with realistic, non-self-elevating account creation.
7. **Surface Actionable Insights** — Provide dashboards, KPI cards, reports, and notifications to drive proactive decision-making.

---

## Business Problem

Organizations of all sizes struggle with:

| Problem | Impact |
|---------|--------|
| Manual tracking via spreadsheets/paper | Data inconsistency, lost records, no audit trail |
| No conflict prevention | Assets double-allocated, rooms double-booked |
| Ad-hoc maintenance | Repairs delayed, no approval chain, no history |
| No structured audits | Ghost assets, undetected losses, compliance failures |
| Lack of visibility | Managers can't see who holds what, where, or in what condition |
| Role confusion | Self-assigned admin roles, no separation of duties |

---

## Proposed Solution

AssetFlow delivers 10 core screens within a modular ERP architecture:

1. **Login/Signup** — Realistic authentication; signup creates Employee accounts only; Admin promotes roles.
2. **Dashboard** — Real-time KPI cards, overdue alerts, quick actions.
3. **Organization Setup** (Admin) — Department, Asset Category, and Employee Directory management.
4. **Asset Registration & Directory** — Register, search, filter, and track full asset lifecycles.
5. **Asset Allocation & Transfer** — Conflict-aware allocation, transfer workflows, return flows, overdue flagging.
6. **Resource Booking** — Calendar-based time-slot booking with overlap validation.
7. **Maintenance Management** — Approval workflow: Pending → Approved → Assigned → In Progress → Resolved.
8. **Asset Audit** — Structured audit cycles with assigned auditors and auto-generated discrepancy reports.
9. **Reports & Analytics** — Utilization trends, maintenance frequency, booking heatmaps, exportable reports.
10. **Activity Logs & Notifications** — Full audit log and role-based notifications.

---

## Expected Benefits

| Stakeholder | Benefit |
|-------------|---------|
| **Organization** | Reduced asset loss, improved utilization, compliance-ready audit trails |
| **Managers** | Real-time visibility, data-driven decisions, automated workflow routing |
| **Employees** | Self-service booking, transparent allocation, clear maintenance process |
| **IT/Admin** | Centralized data, role-based security, modular extensibility |

---

## Assumptions

1. Users have access to modern web browsers (Chrome, Firefox, Edge, Safari — latest 2 versions).
2. The organization has pre-existing department and employee structures to import or manually enter.
3. Internet connectivity is available for all users (no offline-first requirement for MVP).
4. A single-tenant deployment per organization is acceptable for the hackathon MVP.
5. Email service for password reset and notifications is available (or mockable).
6. Asset photos and documents are small files (< 10 MB each).
7. The system will use English as the primary language for the MVP.

---

## Limitations

1. **No Purchasing/Invoicing/Accounting** — AssetFlow focuses on asset lifecycle management, not financial workflows.
2. **No Offline Mode** — The MVP requires internet connectivity.
3. **Single Tenant** — Multi-tenancy (one deployment serving many organizations) is deferred to future scope.
4. **No IoT/RFID Integration** — Asset tracking is manual (QR code, serial number); hardware integration is future scope.
5. **No Mobile Native App** — The MVP is a responsive web application, not a native iOS/Android app.
6. **Limited Internationalization** — English only for the MVP.

---

## Future Scope

| Phase | Feature |
|-------|---------|
| **Phase 2** | Multi-tenancy, SSO/SAML, advanced RBAC with custom permission sets |
| **Phase 3** | IoT/RFID/BLE asset tracking, barcode scanning via camera |
| **Phase 4** | Procurement & vendor management module |
| **Phase 5** | Predictive maintenance using ML (failure prediction from maintenance history) |
| **Phase 6** | Mobile native apps (React Native / Flutter) |
| **Phase 7** | Multi-language support, white-label deployments |
| **Phase 8** | Integration hub (Slack, MS Teams, ERP connectors) |

---

## Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| Asset registration completion rate | > 95% of org assets entered | Count of registered vs. known assets |
| Double-allocation incidents | 0 post-deployment | System-blocked conflict count |
| Booking overlap incidents | 0 post-deployment | System-rejected overlap count |
| Maintenance request turnaround | < 48 hours average | Time from request to resolution |
| Audit cycle completion rate | 100% of scheduled cycles | Completed vs. created audit cycles |
| Dashboard load time | < 2 seconds (P95) | Application performance monitoring |
| User adoption rate | > 80% of org employees active within 30 days | Active user count / total employees |
| System uptime | > 99.5% | Infrastructure monitoring |

---

## Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Complex state machine for asset lifecycle leads to bugs | High | High | Formal state machine definition with exhaustive transition tests; use a state machine library |
| Real-time overlap validation race conditions in booking | Medium | High | Database-level constraints (unique index on resource + time range), pessimistic locking for booking operations |
| File upload handling (photos, documents) causes storage issues | Medium | Medium | Enforce file size limits (10 MB), use cloud object storage (S3/GCS), virus scanning |
| Session/token management vulnerabilities | Medium | High | Use battle-tested JWT library, short-lived access tokens (15 min), refresh tokens, server-side token revocation |

### Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Low user adoption due to poor UX | Medium | High | User persona-driven design, iterative usability testing, intuitive navigation |
| Scope creep during hackathon | High | Medium | Strict MoSCoW prioritization; Must-Have features only for demo; time-boxed development |
| Data migration complexity from legacy systems | Medium | Medium | Provide CSV import templates; document data format requirements |

### Performance Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Dashboard KPI queries slow under large datasets | Medium | High | Materialized views / cached aggregations for KPIs; database indexing on status, department, date fields |
| Report generation blocks the main thread | Medium | Medium | Async report generation with background jobs; paginated results |
| Concurrent booking requests cause database contention | Low | High | Connection pooling, optimistic locking with retry, database-level overlap constraints |

### Security Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Role escalation (user self-promotes to Admin) | Medium | Critical | Server-side role enforcement; signup creates Employee only; role changes require Admin action through Employee Directory |
| Unauthorized access to other departments' data | Medium | High | Row-level security policies; API-level authorization checks on every request |
| SQL injection / XSS attacks | Low | Critical | Parameterized queries (ORM), input sanitization, CSP headers, output encoding |
| Credential theft via session hijacking | Low | High | Secure, HttpOnly, SameSite cookies; HTTPS enforcement; short token lifetimes |

---

*Cross-references: [02_SRS_and_Features.md](../business/02_SRS_and_Features.md) | [04_System_Design.md](../architecture/04_System_Design.md) | [09_Security_and_Performance.md](../security_performance/09_Security_and_Performance.md)*
