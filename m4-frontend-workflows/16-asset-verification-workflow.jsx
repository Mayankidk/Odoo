import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { AUDIT_VERIFICATION_STATUSES, auditVerificationSchema } from './02-validation-schemas';

export function AssetVerificationWorkflow({ audit, expectedAssets = [], onVerify }) {
  const [selectedAsset, setSelectedAsset] = useState(null);

  // Derive discrepancy states
  const verifiedCount = expectedAssets.filter(a => a.verification_status === 'verified').length;
  const missingCount = expectedAssets.filter(a => a.verification_status === 'missing').length;
  const damagedCount = expectedAssets.filter(a => a.verification_status === 'damaged').length;
  const pendingCount = expectedAssets.length - verifiedCount - missingCount - damagedCount;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">{audit.name}</h2>
        <p className="text-gray-600">Audit Scope: {audit.scope_type === 'department' ? 'Department' : 'Location'}</p>
      </div>

      {/* Progress / KPI Bar */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded border">
        <div className="text-center border-r"><p className="text-sm text-gray-500">Pending</p><p className="text-xl font-bold">{pendingCount}</p></div>
        <div className="text-center border-r"><p className="text-sm text-green-600">Verified</p><p className="text-xl font-bold text-green-600">{verifiedCount}</p></div>
        <div className="text-center border-r"><p className="text-sm text-red-600">Missing</p><p className="text-xl font-bold text-red-600">{missingCount}</p></div>
        <div className="text-center"><p className="text-sm text-orange-600">Damaged</p><p className="text-xl font-bold text-orange-600">{damagedCount}</p></div>
      </div>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b bg-gray-100">
            <th className="p-2">Asset Tag / SN</th>
            <th className="p-2">Name</th>
            <th className="p-2">Expected Holder</th>
            <th className="p-2">Status</th>
            <th className="p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {expectedAssets.map(asset => (
            <tr key={asset.id} className="border-b hover:bg-gray-50">
              <td className="p-2 text-sm">{asset.serial_number || 'N/A'}</td>
              <td className="p-2">{asset.name}</td>
              <td className="p-2">{asset.current_holder || 'Unallocated'}</td>
              <td className="p-2">
                <StatusBadge status={asset.verification_status || 'pending'} />
              </td>
              <td className="p-2">
                <button
                  onClick={() => setSelectedAsset(asset)}
                  className="text-blue-600 hover:underline text-sm font-medium"
                >
                  Verify
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedAsset && (
        <VerificationModal 
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onSubmit={async (values) => {
            await onVerify(selectedAsset.id, values);
            setSelectedAsset(null);
          }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-gray-200 text-gray-800',
    verified: 'bg-green-100 text-green-800',
    missing: 'bg-red-100 text-red-800',
    damaged: 'bg-orange-100 text-orange-800'
  };
  
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}

function VerificationModal({ asset, onClose, onSubmit }) {
  const form = useForm({
    resolver: zodResolver(auditVerificationSchema),
    defaultValues: {
      verification_status: asset.verification_status || 'verified',
      notes: asset.verification_notes || '',
    },
  });

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = form;
  const status = watch('verification_status');

  return (
    <div role="dialog" className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
        <h3 className="text-lg font-bold mb-4">Verify: {asset.name}</h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Verification Status</label>
            <select {...register('verification_status')} className="w-full border p-2 rounded">
              {AUDIT_VERIFICATION_STATUSES.map(s => (
                <option key={s} value={s}>{s.toUpperCase()}</option>
              ))}
            </select>
            {errors.verification_status && <p className="text-red-500 text-sm">{errors.verification_status.message}</p>}
          </div>

          {(status === 'missing' || status === 'damaged') && (
            <div>
              <label className="block text-sm font-medium mb-1">Discrepancy Notes (Required for missing/damaged)</label>
              <textarea 
                {...register('notes')} 
                className="w-full border p-2 rounded" 
                rows={3}
                required
                placeholder="Explain the discrepancy..."
              />
              {errors.notes && <p className="text-red-500 text-sm">{errors.notes.message}</p>}
            </div>
          )}
          {status === 'verified' && (
            <div>
              <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
              <textarea {...register('notes')} className="w-full border p-2 rounded" rows={2} />
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded">
              {isSubmitting ? 'Saving...' : 'Save Verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
