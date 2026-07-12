# Member 1 Backend Contract

This contract follows the Markdown docs from the `shabbir` branch, especially `docs/database/05_Database_Design.md`, `docs/api/06_API_Design.md`, and `docs/security_performance/09_Security_and_Performance.md`.

## Tables

- `users`
- `departments`
- `asset_categories`
- `assets`
- `asset_documents`
- `allocations`
- `transfer_requests`
- `bookings`
- `maintenance_requests`
- `audit_cycles`
- `audit_cycle_auditors`
- `audit_items`
- `notifications`
- `audit_logs`

## Role Rules

Roles use the `user_role` enum:

- `admin`
- `asset_manager`
- `department_head`
- `employee`

Supabase Auth signup creates `auth.users`; the migration trigger inserts a matching `public.users` row with role `employee`. Admin-only promotion happens by updating `users.role`.

## RPCs

### `allocate_asset`

Arguments:

- `p_asset_id uuid`
- `p_user_id uuid default null`
- `p_department_id uuid default null`
- `p_expected_return_date date default null`

Returns one `allocations` row. Exactly one of `p_user_id` or `p_department_id` must be present.

Common errors:

- `FORBIDDEN: Only admins and asset managers can allocate assets`
- `INVALID_HOLDER: Provide exactly one user or department holder`
- `ASSET_NOT_FOUND: Asset does not exist`
- `ASSET_ALREADY_ALLOCATED: Currently held by ...`
- `INACTIVE_DEPARTMENT: Deactivated departments cannot receive allocations`

### `book_resource`

Arguments:

- `p_resource_id uuid`
- `p_start_time timestamptz`
- `p_end_time timestamptz`
- `p_purpose varchar default null`

Returns one `bookings` row. Adjacent bookings are allowed because booking ranges use `[)`.

Common errors:

- `INVALID_BOOKING_TIME: End time must be after start time`
- `RESOURCE_NOT_FOUND: Resource does not exist`
- `RESOURCE_NOT_BOOKABLE: Asset is not marked as a shared resource`
- `RESOURCE_UNAVAILABLE: Resource status is ...`
- `BOOKING_OVERLAP: Booking overlaps with an existing reservation`

### `get_dashboard_kpis`

Arguments: none.

Returns JSON:

```json
{
  "assets_available": 0,
  "assets_allocated": 0,
  "maintenance_today": 0,
  "active_bookings": 0,
  "pending_transfers": 0,
  "upcoming_returns": 0,
  "overdue_returns": 0
}
```

## Storage

Bucket: `asset-documents`

Allowed MIME types:

- `image/png`
- `image/jpeg`
- `image/webp`
- `application/pdf`

Max file size: 10 MB.

## Demo Users

All demo users use password `AssetFlow123!`.

| Email | Role |
|---|---|
| `admin@assetflow.test` | `admin` |
| `manager@assetflow.test` | `asset_manager` |
| `head@assetflow.test` | `department_head` |
| `employee@assetflow.test` | `employee` |
| `auditor@assetflow.test` | `employee`, assigned as audit auditor |

## Local Application Order

1. Apply `supabase/migrations/202607120001_init_assetflow_schema.sql`.
2. Apply `supabase/migrations/202607120002_rls_rpc_storage.sql`.
3. Apply `supabase/seed.sql` for demo data.
