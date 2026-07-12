const BLOCKED_STATUSES = new Set(['reserved', 'under_maintenance', 'lost', 'retired', 'disposed']);

function formatStatus(status) {
  return status?.replaceAll('_', ' ') ?? 'unavailable';
}

function getHolderName(activeAllocation) {
  return activeAllocation?.allocated_to_user?.name
    ?? activeAllocation?.allocated_to_dept?.name
    ?? activeAllocation?.holder_name
    ?? null;
}

function isAllocationConflict(error) {
  return error?.code === 'ASSET_ALREADY_ALLOCATED'
    || String(error?.message ?? '').includes('ASSET_ALREADY_ALLOCATED');
}

/**
 * M4 Allocation Conflict State
 *
 * Render this after useAllocateAsset fails or before opening the allocation modal
 * for an ineligible asset. M2 should pass the active allocation from
 * useActiveAllocation when it is available.
 */
export function AllocationConflictState({
  asset,
  activeAllocation,
  error,
  onRequestTransfer,
  onClose,
  onRetry,
}) {
  const holder = getHolderName(activeAllocation);
  const conflict = isAllocationConflict(error) || asset?.status === 'allocated';
  const blocked = BLOCKED_STATUSES.has(asset?.status);

  if (!conflict && !blocked) return null;

  if (blocked) {
    return (
      <div role="alert" aria-live="assertive">
        <h2>Asset cannot be allocated</h2>
        <p>
          {asset?.name ?? 'This asset'} is currently {formatStatus(asset?.status)} and cannot be allocated.
        </p>
        <p>Choose another available asset or update its lifecycle status through the appropriate workflow.</p>
        {onClose && <button type="button" onClick={onClose}>Close</button>}
      </div>
    );
  }

  return (
    <div role="alertdialog" aria-modal="true" aria-labelledby="allocation-conflict-title">
      <h2 id="allocation-conflict-title">Asset already allocated</h2>
      <p>
        {asset?.name ?? 'This asset'} is already assigned{holder ? ` to ${holder}` : ''}.
      </p>
      {error?.message && !String(error.message).includes('ASSET_ALREADY_ALLOCATED') && (
        <p>{error.message}</p>
      )}
      <p>Submit a transfer request to move it after approval.</p>
      <div>
        {onRequestTransfer && activeAllocation && (
          <button type="button" onClick={() => onRequestTransfer(activeAllocation)}>
            Request transfer
          </button>
        )}
        {onRetry && <button type="button" onClick={onRetry}>Choose another asset</button>}
        {onClose && <button type="button" onClick={onClose}>Close</button>}
      </div>
    </div>
  );
}
