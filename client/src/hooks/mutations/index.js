// ---------------------------------------------------------------------------
// AssetFlow — Mutation Hooks Barrel Export
// ---------------------------------------------------------------------------
// Import all mutations from this single entry point:
//
//   import { useRegisterAsset, useAllocateAsset } from '@/hooks/mutations';
//
// ---------------------------------------------------------------------------

// Admin Setup
export {
  useCreateDepartment,
  useUpdateDepartment,
  useCreateCategory,
  useUpdateCategory,
  useUpdateEmployee,
} from './useAdminSetupMutations';

// Asset Directory
export {
  useRegisterAsset,
  useUpdateAsset,
  useDeleteAsset,
  useAddAssetDocuments,
  useDeleteAssetDocument,
} from './useAssetMutations';

// Allocations & Transfers
export {
  useAllocateAsset,
  useReturnAsset,
  useCreateTransferRequest,
  useApproveTransferRequest,
  useRejectTransferRequest,
} from './useAllocationMutations';

// Resource Bookings
export { useBookResource, useCancelBooking } from './useBookingMutations';

// Maintenance Requests
export {
  useRaiseMaintenanceRequest,
  useApproveMaintenanceRequest,
  useRejectMaintenanceRequest,
  useAssignTechnician,
  useResolveMaintenanceRequest,
} from './useMaintenanceMutations';

// Audit Cycles & Verification
export {
  useCreateAuditCycle,
  useAssignAuditors,
  useVerifyAuditItem,
  useUpdateAuditCycleStatus,
} from './useAuditMutations';
