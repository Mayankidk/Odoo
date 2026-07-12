# AssetFlow Workflow Division

This split is designed so different people can build modules independently while one person integrates the full app cleanly.

## 1. Core Foundation

Owner: Integration lead

Build first because every module depends on it.

- App routing and layout
- Authentication screens: login, signup, forgot password
- Session handling
- Role-based access control
- Shared database/schema setup
- Shared UI components: table, form, modal, tabs, status badge, toast/notification
- Common services/helpers:
  - `auth`
  - `permissions`
  - `assetStatus`
  - `notifications`
  - `activityLogs`

Important rule: signup only creates an Employee account. Admin role assignment happens later from Employee Directory.

## 2. Organization Setup Module

Roles: Admin only

Screens:

- Department Management
- Asset Category Management
- Employee Directory

Main workflows:

- Admin creates departments.
- Admin assigns department heads.
- Admin creates asset categories.
- Admin views employees.
- Admin promotes employees to Department Head or Asset Manager.
- Admin deactivates departments/employees.

Integration dependencies:

- Auth user table
- Department table
- Role/permission system

Outputs used by other modules:

- Departments for employee assignment, asset allocation, audit scope
- Categories for asset registration
- Roles for access control

## 3. Asset Directory Module

Roles: Admin, Asset Manager, Department Head read-only, Employee read-only for assigned assets

Screens:

- Asset Registration
- Asset Directory/Search
- Asset Detail

Main workflows:

- Asset Manager registers asset.
- System generates asset tag like `AF-0001`.
- Asset starts as `Available`.
- Asset can be marked as shared/bookable.
- User can search/filter by tag, serial number, category, status, department, location, or QR code.
- Asset detail shows allocation history and maintenance history.

Integration dependencies:

- Categories from Organization Setup
- Departments from Organization Setup
- Status transitions used by allocation, booking, maintenance, and audit

Shared asset statuses:

- `Available`
- `Allocated`
- `Reserved`
- `Under Maintenance`
- `Lost`
- `Retired`
- `Disposed`

## 4. Asset Allocation & Transfer Module

Roles: Asset Manager, Department Head, Employee for requests

Screens:

- Allocate Asset
- Transfer Requests
- Return Asset
- My Assets

Main workflows:

- Allocate asset to employee or department.
- Optional expected return date.
- Prevent double-allocation.
- If already allocated, show current holder and offer Transfer Request.
- Transfer flow: `Requested -> Approved -> Re-allocated`.
- Return flow captures condition notes and marks asset `Available`.
- Overdue allocations feed Dashboard and Notifications.

Integration dependencies:

- Asset Directory
- Employee Directory
- Notifications
- Activity Logs
- Dashboard KPIs

Conflict rule:

- An asset can have only one active allocation at a time.
- Allocation is allowed only when status is `Available`.

## 5. Resource Booking Module

Roles: Employee, Department Head, Asset Manager, Admin

Screens:

- Resource Calendar
- Create Booking
- My Bookings

Main workflows:

- Book shared resources by time slot.
- Reject overlapping bookings for the same resource.
- Allow adjacent bookings, for example `10:00-11:00` after `9:00-10:00`.
- Cancel or reschedule booking.
- Send reminder before slot starts.
- Booking statuses: `Upcoming`, `Ongoing`, `Completed`, `Cancelled`.

Integration dependencies:

- Asset Directory, only assets marked shared/bookable
- Notifications
- Dashboard KPIs

Overlap rule:

```text
newStart < existingEnd AND newEnd > existingStart
```

If true, the booking overlaps and must be rejected.

## 6. Maintenance Module

Roles: Employee, Asset Manager, Technician if implemented

Screens:

- Raise Maintenance Request
- Maintenance Approvals
- Maintenance Work Queue
- Maintenance History

Main workflows:

- Holder raises request with issue, priority, and optional photo.
- Asset Manager approves or rejects.
- On approval, asset status becomes `Under Maintenance`.
- Technician is assigned.
- Request moves through: `Pending -> Approved/Rejected -> Technician Assigned -> In Progress -> Resolved`.
- On resolution, asset returns to `Available`.
- Maintenance history appears on asset detail.

Integration dependencies:

- Asset Directory
- Allocation holder data
- Notifications
- Activity Logs
- Dashboard KPIs
- Reports

## 7. Audit Module

Roles: Admin, Asset Manager, assigned Auditors

Screens:

- Create Audit Cycle
- Assign Auditors
- Audit Verification
- Discrepancy Report
- Audit History

Main workflows:

- Admin or Asset Manager creates audit cycle.
- Scope can be department or location.
- Assign one or more auditors.
- Auditor marks assets as `Verified`, `Missing`, or `Damaged`.
- System generates discrepancy report.
- Closing an audit locks the cycle.
- Confirmed missing assets can update status to `Lost`.

Integration dependencies:

- Asset Directory
- Departments
- Employee Directory
- Notifications
- Activity Logs
- Reports

## 8. Dashboard Module

Roles: All roles, with role-specific visibility

Screens:

- Home Dashboard

KPI cards:

- Assets Available
- Assets Allocated
- Maintenance Today
- Active Bookings
- Pending Transfers
- Upcoming Returns

Special sections:

- Overdue returns
- Upcoming returns
- Pending approvals
- Recent notifications
- Quick actions

Integration dependencies:

- Asset Directory
- Allocation
- Booking
- Maintenance
- Transfer requests
- Notifications

Build after the main transactional modules exist, then connect real counts gradually.

## 9. Reports & Analytics Module

Roles: Admin, Asset Manager, Department Head with scoped access

Screens:

- Reports Dashboard
- Export Reports

Reports:

- Asset utilization trends
- Most-used vs idle assets
- Maintenance frequency by asset/category
- Assets due for maintenance or nearing retirement
- Department-wise allocation summary
- Resource booking heatmap

Integration dependencies:

- Asset history
- Allocation history
- Booking history
- Maintenance history
- Audit data

This can be built late because it mostly reads data from completed modules.

## 10. Notifications & Activity Logs Module

Roles: All roles for notifications, Admin/Manager for logs

Screens:

- Notifications
- Activity Logs

Notification events:

- Asset Assigned
- Maintenance Approved/Rejected
- Booking Confirmed/Cancelled/Reminder
- Transfer Approved
- Overdue Return Alert
- Audit Discrepancy Flagged

Activity log events:

- Login
- Role promotion
- Department/category changes
- Asset registration/update
- Allocation/return/transfer
- Booking changes
- Maintenance workflow actions
- Audit actions

Integration note:

Every module should call a shared `createNotification()` and `logActivity()` helper instead of implementing its own notification logic.

## Recommended Build Order

1. Core foundation: auth, layout, roles, schema, shared components
2. Organization Setup
3. Asset Directory
4. Allocation and Return
5. Resource Booking
6. Maintenance
7. Audit
8. Notifications and Activity Logs
9. Dashboard
10. Reports and Analytics

## Team Division

If there are 4 people:

- Person 1: Core foundation, auth, role-based access, integration
- Person 2: Organization Setup and Asset Directory
- Person 3: Allocation, Transfer, Booking
- Person 4: Maintenance, Audit, Notifications, Reports

If there are 5 people:

- Person 1: Core foundation and final integration
- Person 2: Organization Setup
- Person 3: Asset Directory and Allocation
- Person 4: Booking and Maintenance
- Person 5: Audit, Dashboard, Reports, Notifications

## Integration Contracts

Keep these shared models stable so modules can connect easily.

```text
User
- id
- name
- email
- passwordHash
- role
- departmentId
- status

Department
- id
- name
- parentDepartmentId
- headUserId
- status

AssetCategory
- id
- name
- customFields
- status

Asset
- id
- assetTag
- name
- categoryId
- serialNumber
- acquisitionDate
- acquisitionCost
- condition
- location
- status
- departmentId
- isBookable
- photoUrl

Allocation
- id
- assetId
- assignedToUserId
- assignedToDepartmentId
- allocatedByUserId
- allocatedAt
- expectedReturnAt
- returnedAt
- returnCondition
- notes
- status

Booking
- id
- resourceAssetId
- bookedByUserId
- startAt
- endAt
- status
- purpose

MaintenanceRequest
- id
- assetId
- raisedByUserId
- approvedByUserId
- priority
- issueDescription
- status
- technicianId
- createdAt
- resolvedAt

AuditCycle
- id
- name
- scopeType
- scopeId
- startDate
- endDate
- status

AuditItem
- id
- auditCycleId
- assetId
- auditorId
- result
- notes

Notification
- id
- userId
- type
- title
- message
- relatedEntityType
- relatedEntityId
- isRead
- createdAt

ActivityLog
- id
- actorUserId
- action
- entityType
- entityId
- metadata
- createdAt
```

## Integration Checklist

- Use one shared role enum across frontend and backend.
- Use one shared asset status enum across all modules.
- Do not allow modules to directly overwrite asset status without validation.
- Put conflict checks on the backend, not only in UI.
- Dashboard and reports should read from real module data, not duplicate data.
- Every create/update/approve/reject action should write an activity log.
- Every user-facing workflow result should create a notification where useful.
- Seed demo data early so all teammates can test against the same departments, employees, assets, and bookings.

