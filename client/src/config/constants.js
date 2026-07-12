// ---------------------------------------------------------------------------
// AssetFlow — Shared Constants
// ---------------------------------------------------------------------------
// These enums mirror the Postgres types defined in
// 202607120001_init_assetflow_schema.sql. Keep them in sync.
// ---------------------------------------------------------------------------

/** @enum {string} */
export const UserRole = Object.freeze({
  ADMIN: 'admin',
  ASSET_MANAGER: 'asset_manager',
  DEPARTMENT_HEAD: 'department_head',
  EMPLOYEE: 'employee',
});

/** @enum {string} */
export const RecordStatus = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
});

/** @enum {string} */
export const AssetCondition = Object.freeze({
  NEW: 'new',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
  DAMAGED: 'damaged',
});

/** @enum {string} */
export const AssetStatus = Object.freeze({
  AVAILABLE: 'available',
  ALLOCATED: 'allocated',
  RESERVED: 'reserved',
  UNDER_MAINTENANCE: 'under_maintenance',
  LOST: 'lost',
  RETIRED: 'retired',
  DISPOSED: 'disposed',
});

/** @enum {string} */
export const AllocationStatus = Object.freeze({
  ACTIVE: 'active',
  RETURNED: 'returned',
  TRANSFERRED: 'transferred',
  OVERDUE: 'overdue',
});

/** @enum {string} */
export const TransferStatus = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
});

/** @enum {string} */
export const BookingStatus = Object.freeze({
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

/** @enum {string} */
export const MaintenancePriority = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
});

/** @enum {string} */
export const MaintenanceStatus = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
});

/** @enum {string} */
export const AuditScopeType = Object.freeze({
  DEPARTMENT: 'department',
  LOCATION: 'location',
});

/** @enum {string} */
export const AuditCycleStatus = Object.freeze({
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
});

/** @enum {string} */
export const AuditVerificationStatus = Object.freeze({
  PENDING: 'pending',
  VERIFIED: 'verified',
  MISSING: 'missing',
  DAMAGED: 'damaged',
});

// ---------------------------------------------------------------------------
// Pagination defaults
// ---------------------------------------------------------------------------
export const DEFAULT_PAGE_SIZE = 25;
