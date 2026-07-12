import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { MAINTENANCE_PRIORITIES, maintenanceRequestSchema } from './02-validation-schemas';

/** M2 connects this form to useCreateMaintenanceRequest. */
export function MaintenanceRequestForm({ assets = [], isSubmitting = false, onCancel, onSubmit }) {
  const form = useForm({
    resolver: zodResolver(maintenanceRequestSchema),
    defaultValues: {
      asset_id: '',
      description: '',
      priority: 'medium',
    },
  });

  const { register, handleSubmit, formState: { errors } } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      <h2 className="text-lg font-semibold">Request Maintenance</h2>

      <div>
        <label htmlFor="asset_id" className="block text-sm font-medium mb-1">Asset</label>
        <select
          id="asset_id"
          {...register('asset_id')}
          className="w-full border rounded p-2"
          aria-invalid={!!errors.asset_id}
        >
          <option value="">Select an asset</option>
          {assets.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {asset.name} {asset.serial_number ? `(${asset.serial_number})` : ''}
            </option>
          ))}
        </select>
        {errors.asset_id && <p className="text-red-500 text-sm mt-1">{errors.asset_id.message}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">Issue Description</label>
        <textarea
          id="description"
          {...register('description')}
          className="w-full border rounded p-2"
          rows={4}
          aria-invalid={!!errors.description}
          placeholder="Describe the problem..."
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
      </div>

      <div>
        <label htmlFor="priority" className="block text-sm font-medium mb-1">Priority</label>
        <select
          id="priority"
          {...register('priority')}
          className="w-full border rounded p-2"
          aria-invalid={!!errors.priority}
        >
          {MAINTENANCE_PRIORITIES.map(p => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
        {errors.priority && <p className="text-red-500 text-sm mt-1">{errors.priority.message}</p>}
      </div>

      {/* Note: Attachment upload UI can reuse 07-asset-document-upload.jsx */}
      
      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded hover:bg-gray-50"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </div>
    </form>
  );
}
