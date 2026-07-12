import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { MAINTENANCE_STATUSES, maintenanceDecisionSchema } from './02-validation-schemas';

export function MaintenanceApprovalQueue({ requests = [], technicians = [], onUpdateStatus }) {
  const [selectedRequest, setSelectedRequest] = useState(null);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Maintenance Approval Queue</h2>
      
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="p-2">Asset</th>
            <th className="p-2">Priority</th>
            <th className="p-2">Status</th>
            <th className="p-2">Requested By</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.length === 0 ? (
            <tr><td colSpan={5} className="p-4 text-center text-gray-500">No maintenance requests found.</td></tr>
          ) : requests.map(req => (
            <tr key={req.id} className="border-b">
              <td className="p-2">{req.asset?.name}</td>
              <td className="p-2 capitalize">{req.priority}</td>
              <td className="p-2 capitalize">{req.status.replace('_', ' ')}</td>
              <td className="p-2">{req.requested_by?.name}</td>
              <td className="p-2">
                <button
                  onClick={() => setSelectedRequest(req)}
                  className="text-blue-600 hover:underline"
                >
                  Manage Status
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedRequest && (
        <MaintenanceDecisionModal
          request={selectedRequest}
          technicians={technicians}
          onClose={() => setSelectedRequest(null)}
          onSubmit={async (values) => {
            await onUpdateStatus(selectedRequest.id, values);
            setSelectedRequest(null);
          }}
        />
      )}
    </div>
  );
}

function MaintenanceDecisionModal({ request, technicians, onClose, onSubmit }) {
  const form = useForm({
    resolver: zodResolver(maintenanceDecisionSchema),
    defaultValues: {
      status: request.status,
      rejection_reason: request.rejection_reason || '',
      assigned_technician_id: request.assigned_technician_id || '',
      resolution_notes: request.resolution_notes || '',
    },
  });

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = form;
  const currentStatus = watch('status');

  return (
    <div role="dialog" className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">Manage Request: {request.asset?.name}</h3>
        
        <div className="mb-6 p-4 bg-gray-50 rounded">
          <p><strong>Description:</strong> {request.description}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">New Status</label>
            <select {...register('status')} className="w-full border p-2 rounded">
              {MAINTENANCE_STATUSES.map(s => (
                <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>
            {errors.status && <p className="text-red-500 text-sm">{errors.status.message}</p>}
          </div>

          {currentStatus === 'rejected' && (
            <div>
              <label className="block text-sm font-medium mb-1">Rejection Reason</label>
              <textarea {...register('rejection_reason')} className="w-full border p-2 rounded" rows={3} />
              {errors.rejection_reason && <p className="text-red-500 text-sm">{errors.rejection_reason.message}</p>}
            </div>
          )}

          {['assigned', 'in_progress', 'resolved'].includes(currentStatus) && (
            <div>
              <label className="block text-sm font-medium mb-1">Assigned Technician</label>
              <select {...register('assigned_technician_id')} className="w-full border p-2 rounded">
                <option value="">Select Technician</option>
                {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {errors.assigned_technician_id && <p className="text-red-500 text-sm">{errors.assigned_technician_id.message}</p>}
            </div>
          )}

          {currentStatus === 'resolved' && (
            <div>
              <label className="block text-sm font-medium mb-1">Resolution Notes</label>
              <textarea {...register('resolution_notes')} className="w-full border p-2 rounded" rows={3} />
              {errors.resolution_notes && <p className="text-red-500 text-sm">{errors.resolution_notes.message}</p>}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded">
              {isSubmitting ? 'Saving...' : 'Save Decision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
