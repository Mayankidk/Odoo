import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { auditCycleSchema } from './02-validation-schemas';

export function AuditCycleForm({ departments = [], employees = [], isSubmitting = false, onSubmit, onCancel }) {
  const form = useForm({
    resolver: zodResolver(auditCycleSchema),
    defaultValues: {
      name: '',
      scope_type: 'department',
      scope_id: '',
      scope_location: '',
      start_date: '',
      end_date: '',
      auditor_ids: [],
    },
  });

  const { register, handleSubmit, watch, formState: { errors } } = form;
  const scopeType = watch('scope_type');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      <h2 className="text-xl font-bold mb-4">Create Audit Cycle</h2>

      <div>
        <label className="block text-sm font-medium mb-1">Audit Name</label>
        <input
          {...register('name')}
          className="w-full border p-2 rounded"
          placeholder="e.g. Q3 IT Assets Audit"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
      </div>

      <div className="flex gap-4">
        <div className="w-1/2">
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <input type="date" {...register('start_date')} className="w-full border p-2 rounded" />
          {errors.start_date && <p className="text-red-500 text-sm mt-1">{errors.start_date.message}</p>}
        </div>
        <div className="w-1/2">
          <label className="block text-sm font-medium mb-1">End Date</label>
          <input type="date" {...register('end_date')} className="w-full border p-2 rounded" />
          {errors.end_date && <p className="text-red-500 text-sm mt-1">{errors.end_date.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Scope</label>
        <select {...register('scope_type')} className="w-full border p-2 rounded mb-2">
          <option value="department">By Department</option>
          <option value="location">By Location</option>
        </select>
        
        {scopeType === 'department' ? (
          <div>
            <select {...register('scope_id')} className="w-full border p-2 rounded">
              <option value="">Select Department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            {errors.scope_id && <p className="text-red-500 text-sm mt-1">{errors.scope_id.message}</p>}
          </div>
        ) : (
          <div>
            <input {...register('scope_location')} placeholder="e.g. Building A, Floor 2" className="w-full border p-2 rounded" />
            {errors.scope_location && <p className="text-red-500 text-sm mt-1">{errors.scope_location.message}</p>}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Assign Auditors</label>
        {/* Simple multi-select for hackathon MVP */}
        <select {...register('auditor_ids')} multiple className="w-full border p-2 rounded h-32">
          {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
        {errors.auditor_ids && <p className="text-red-500 text-sm mt-1">{errors.auditor_ids.message}</p>}
      </div>

      <div className="flex gap-4 pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded" disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded">
          {isSubmitting ? 'Creating...' : 'Create Audit'}
        </button>
      </div>
    </form>
  );
}
