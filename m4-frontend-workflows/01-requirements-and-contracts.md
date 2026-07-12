# M4 Requirements and Integration Contracts

## Purpose

This document translates the AssetFlow project requirements into the frontend inputs, actions, and error states owned by Member 4. M4 consumes reusable hooks supplied by M2 and must not make direct Supabase calls.

## Screen ownership and required behavior

| M4 area | Allowed roles | Required behavior |
|---|---|---|
| Organization setup | Admin | Create, edit, and deactivate departments and categories. |
| Asset registration | Asset Manager | Register an asset as `available`; the system generates the immutable `AF-XXXX` tag. |
| Asset directory | All authenticated users, scope controlled by M2/M1 | Search and filter assets; show lifecycle status and relevant row actions. |
| Allocation and transfer | Asset Manager; Department Head approves permitted department transfers | Allocate only available assets, offer transfer when the asset already has a holder, and process returns. |
| Maintenance | Any authenticated user can raise; Asset Manager manages approval and progress | Follow Pending → Approved/Rejected → Assigned → In Progress → Resolved. |
| Audit | Admin/Asset Manager creates; assigned Auditor verifies | Create a scoped cycle, assign auditors, record results, display discrepancies, and prevent editing after close. |

## Form contracts

### Department

**Fields**

- `name`: required, string, maximum 100 characters.
- `parent_department_id`: optional department ID.
- `department_head_id`: optional active user ID.
- `status`: `active` or `inactive`; defaults to `active`.

**M2 interface**: `useDepartments`, `useCreateDepartment`, `useUpdateDepartment`.

**Rules**: Inactive departments cannot receive new allocations. An inactive employee cannot be selected as a department head.

### Asset category

**Fields**

- `name`: required, unique, maximum 100 characters.
- `description`: optional text.
- `custom_fields_schema`: optional JSON schema for future category-specific fields.
- `status`: `active` or `inactive`; defaults to `active`.

**M2 interface**: `useAssetCategories`, `useCreateAssetCategory`, `useUpdateAssetCategory`.

### Asset registration

**Fields**

- `name`: required, maximum 200 characters.
- `category_id`: required active category ID.
- `serial_number`, `acquisition_date`, `acquisition_cost`, `location`, `department_id`: optional.
- `condition`: required: `new`, `good`, `fair`, or `poor`.
- `is_bookable`: boolean, defaults to `false`.
- `custom_fields`: optional values that match the chosen category schema.
- `documents`: optional files; each file must be no larger than 10 MB.

**M2 interface**: `useCreateAsset`, `useUploadAssetDocument`, `useCreateAssetDocument`.

**Rules**: The UI does not send `asset_tag`, `status`, or `registered_by`; the backend supplies them. A duplicate serial number is a warning, not a blocking error.

### Asset directory

**Data required per row**

`id`, `asset_tag`, `name`, `serial_number`, `status`, `condition`, `location`, `is_bookable`, `category { id, name }`, `department { id, name }`, and active allocation holder when present.

**Filters**

Search by asset tag, serial number, or name; filter by category, status, department, and location. Pagination uses a page number and page size of 20 by default.

**M2 interface**: `useAssets({ search, categoryId, status, departmentId, location, page, pageSize })`, returning `{ items, totalCount }`.

### Allocation, transfer, and return

**Allocation fields**

- `asset_id`: required.
- Exactly one of `allocated_to_user_id` or `allocated_to_dept_id`: required.
- `expected_return_date`: optional date.

**M2 interface**: `useAllocateAsset`, `useCreateTransferRequest`, `useReturnAsset`, `useActiveAllocation`.

**Rules**

- Only an `available` asset may be allocated.
- For an already allocated asset, show the current holder and offer transfer request instead of allocation.
- Block assets in `under_maintenance`, `lost`, `retired`, or `disposed` state.
- Return requires `return_notes` and optional `condition_on_return` (`new`, `good`, `fair`, `poor`, `damaged`); successful return restores the asset to `available`.

**Expected RPC error**: `ASSET_ALREADY_ALLOCATED: Currently held by <name>`.

### Maintenance

**Raise-request fields**

- `asset_id`: required.
- `description`: required.
- `priority`: required: `low`, `medium`, `high`, or `critical`; defaults to `medium`.
- `attachment`: optional, maximum 10 MB.

**Manager actions**

- Approve or reject a pending request; rejection requires a reason.
- Assign a technician after approval.
- Move the request to `in_progress` and finally `resolved`.
- Resolution requires `resolution_notes`.

**M2 interface**: `useMaintenanceRequests`, `useCreateMaintenanceRequest`, `useUpdateMaintenanceRequestStatus`.

**Rules**: A disposed asset cannot receive a maintenance request. Approval moves the asset to `under_maintenance`; resolution returns it to `available`. An open request for the same asset is a warning rather than an automatic block.

### Audit cycle and verification

**Create-cycle fields**

- `name`: required, maximum 200 characters.
- `scope_type`: required: `department` or `location`.
- `scope_id`: required when scope is `department`.
- `scope_location`: required when scope is `location`.
- `start_date`, `end_date`: required; start date must not be after end date.
- `auditor_ids`: one or more active user IDs; no duplicates.

**Verification fields**

- `verification_status`: `verified`, `missing`, or `damaged`.
- `notes`: optional, but encouraged for `missing` and `damaged`.

**M2 interface**: `useAuditCycles`, `useCreateAuditCycle`, `useAuditItems`, `useUpdateAuditItem`, `useCloseAuditCycle`.

**Rules**: A completed audit cycle is read-only. Closing a cycle with missing items changes those assets to `lost`; display the discrepancy report before close. If the date range has expired, show a close-warning but allow the authorized user to proceed.

## Shared UI needed from M3

- Form controls: text input, select, multi-select, date input, checkbox/switch, textarea, file input.
- Layout controls: tabs, modal/dialog, responsive data table, pagination, status badge, empty and loading states.
- Feedback controls: toast notifications, inline field errors, confirm dialog.

## User-facing error mapping

| Failure | M4 response |
|---|---|
| Required or invalid form value | Inline error beside the field; do not submit. |
| File over 10 MB | Inline file error; do not upload. |
| `23505` unique value error | Toast: “This record already exists.” |
| `23503` invalid reference | Toast: “The selected related record is unavailable.” |
| `42501` permission error | Toast: “You do not have permission to perform this action.” |
| `PGRST116` record not found | Toast: “This item no longer exists. Refresh and try again.” |
| `ASSET_ALREADY_ALLOCATED` | Modal shows holder and a “Request transfer” action. |
| Booking overlap | Toast: “This time conflicts with an existing reservation.” |

## Sources

- `docs/business/02_SRS_and_Features.md` (FR-03 to FR-08 and business rules BR-02 to BR-10)
- `docs/design/03_UX_and_Use_Cases.md` (UC-03, UC-04, UC-06 to UC-09)
- `docs/database/05_Database_Design.md` (entities 3.2 to 3.12)
- `docs/api/06_API_Design.md` (queries, allocation RPC, storage upload, error handling)
