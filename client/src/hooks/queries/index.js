// ---------------------------------------------------------------------------
// AssetFlow — Query Hooks Barrel Export
// ---------------------------------------------------------------------------
// Import all query hooks from this single entry point:
//
//   import { useAssets, useDashboardKPIs, useDepartments } from '@/hooks/queries';
//
// ---------------------------------------------------------------------------

// Departments
export { useDepartments, useDepartment } from './useDepartments';

// Asset Categories
export { useCategories, useCategory } from './useCategories';

// Employees (Users)
export { useEmployees, useEmployee } from './useEmployees';

// Assets
export { useAssets, useAsset } from './useAssets';

// Allocations
export {
  useAllocations,
  useAllocation,
  useMyAllocations,
} from './useAllocations';

// Transfer Requests
export { useTransferRequests } from './useTransferRequests';

// Bookings
export {
  useBookings,
  useBooking,
  useResourceCalendar,
  useMyBookings,
} from './useBookings';

// Maintenance Requests
export {
  useMaintenanceRequests,
  useMaintenanceRequest,
} from './useMaintenanceRequests';

// Audit Cycles & Items
export { useAuditCycles, useAuditCycle, useAuditItems } from './useAudits';

// Dashboard
export {
  useDashboardKPIs,
  useOverdueReturns,
  usePendingApprovals,
} from './useDashboard';

// Notifications
export {
  useNotifications,
  useUnreadNotificationCount,
} from './useNotifications';
