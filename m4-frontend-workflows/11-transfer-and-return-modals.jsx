import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ASSET_CONDITIONS, returnAssetSchema, transferRequestSchema } from './02-validation-schemas';

const EMPTY_TRANSFER_VALUES = { allocation_id: '', reason: '' };
const EMPTY_RETURN_VALUES = { allocation_id: '', return_notes: '', condition_on_return: '' };

function holderName(allocation) {
  return allocation?.allocated_to_user?.name
    ?? allocation?.allocated_to_dept?.name
    ?? allocation?.holder_name
    ?? 'the current holder';
}

/** M2 connects this form to useCreateTransferRequest. */
export function TransferRequestModal({ allocation, isSubmitting = false, onCancel, onSubmit }) {
  const form = useForm({
    resolver: zodResolver(transferRequestSchema),
    defaultValues: EMPTY_TRANSFER_VALUES,
  });
  const { register, handleSubmit, reset, formState: { errors } } = form;

  useEffect(() => {
    reset({ allocation_id: allocation?.id ?? '', reason: '' });
  }, [allocation, reset]);

  async function submit(values) {
    await onSubmit?.({ ...values, reason: values.reason || null });
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="transfer-request-title">
      <h2 id="transfer-request-title">Request asset transfer</h2>
      <p>
        {allocation?.asset?.name ?? 'This asset'} is currently allocated to {holderName(allocation)}.
      </p>
      <form noValidate onSubmit={handleSubmit(submit)} aria-label="Transfer request form">
        <input type="hidden" {...register('allocation_id')} />
        <div>
          <label htmlFor="transfer-reason">Reason for transfer <span>(optional)</span></label>
          <textarea
            id="transfer-reason"
            rows="4"
            aria-invalid={Boolean(errors.reason)}
            aria-describedby={errors.reason ? 'transfer-reason-error' : undefined}
            {...register('reason')}
          />
          {errors.reason && <p id="transfer-reason-error" role="alert">{errors.reason.message}</p>}
        </div>
        <div>
          <button type="button" onClick={onCancel} disabled={isSubmitting}>Cancel</button>
          <button type="submit" disabled={isSubmitting || !allocation?.id}>
            {isSubmitting ? 'Submitting…' : 'Request transfer'}
          </button>
        </div>
      </form>
    </div>
  );
}

/** M2 connects this form to useReturnAsset. */
export function ReturnAssetModal({ allocation, isSubmitting = false, onCancel, onSubmit }) {
  const form = useForm({
    resolver: zodResolver(returnAssetSchema),
    defaultValues: EMPTY_RETURN_VALUES,
  });
  const { register, handleSubmit, reset, formState: { errors } } = form;

  useEffect(() => {
    reset({ ...EMPTY_RETURN_VALUES, allocation_id: allocation?.id ?? '' });
  }, [allocation, reset]);

  async function submit(values) {
    await onSubmit?.({
      ...values,
      condition_on_return: values.condition_on_return || null,
    });
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="return-asset-title">
      <h2 id="return-asset-title">Return asset</h2>
      <p>Record the asset’s condition before returning it to available inventory.</p>
      <form noValidate onSubmit={handleSubmit(submit)} aria-label="Asset return form">
        <input type="hidden" {...register('allocation_id')} />
        <div>
          <label htmlFor="return-notes">Condition check-in notes</label>
          <textarea
            id="return-notes"
            rows="4"
            aria-invalid={Boolean(errors.return_notes)}
            aria-describedby={errors.return_notes ? 'return-notes-error' : undefined}
            {...register('return_notes')}
          />
          {errors.return_notes && <p id="return-notes-error" role="alert">{errors.return_notes.message}</p>}
        </div>
        <div>
          <label htmlFor="return-condition">Condition on return <span>(optional)</span></label>
          <select
            id="return-condition"
            {...register('condition_on_return', { setValueAs: (value) => value || undefined })}
          >
            <option value="">Not specified</option>
            {[...ASSET_CONDITIONS, 'damaged'].map((condition) => (
              <option key={condition} value={condition}>{condition}</option>
            ))}
          </select>
        </div>
        <div>
          <button type="button" onClick={onCancel} disabled={isSubmitting}>Cancel</button>
          <button type="submit" disabled={isSubmitting || !allocation?.id}>
            {isSubmitting ? 'Returning…' : 'Confirm return'}
          </button>
        </div>
      </form>
    </div>
  );
}
