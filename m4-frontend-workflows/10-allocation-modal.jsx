import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { allocationSchema } from './02-validation-schemas';

const EMPTY_VALUES = {
  asset_id: '',
  allocated_to_user_id: '',
  allocated_to_dept_id: '',
  expected_return_date: '',
};

/**
 * M4 Asset Allocation Modal
 *
 * M2 connects `onSubmit` to useAllocateAsset. The M1 RPC remains the source of
 * truth for availability and atomic double-allocation prevention.
 */
export function AllocationModal({
  asset,
  employees = [],
  departments = [],
  isSubmitting = false,
  onCancel,
  onSubmit,
}) {
  const [targetType, setTargetType] = useState('employee');
  const activeEmployees = useMemo(
    () => employees.filter((employee) => employee.status === 'active'),
    [employees],
  );
  const activeDepartments = useMemo(
    () => departments.filter((department) => department.status === 'active'),
    [departments],
  );
  const form = useForm({
    resolver: zodResolver(allocationSchema),
    defaultValues: EMPTY_VALUES,
  });
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = form;

  useEffect(() => {
    reset({ ...EMPTY_VALUES, asset_id: asset?.id ?? '' });
    setTargetType('employee');
  }, [asset, reset]);

  function changeTargetType(nextTargetType) {
    setTargetType(nextTargetType);
    if (nextTargetType === 'employee') {
      setValue('allocated_to_dept_id', '');
    } else {
      setValue('allocated_to_user_id', '');
    }
  }

  async function submit(values) {
    await onSubmit?.({
      ...values,
      allocated_to_user_id: values.allocated_to_user_id || null,
      allocated_to_dept_id: values.allocated_to_dept_id || null,
      expected_return_date: values.expected_return_date || null,
    });
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="allocation-title">
      <div>
        <h2 id="allocation-title">Allocate asset</h2>
        <p>
          {asset?.name ?? 'Selected asset'} {asset?.asset_tag ? `(${asset.asset_tag})` : ''}
        </p>
      </div>

      <form noValidate onSubmit={handleSubmit(submit)} aria-label="Asset allocation form">
        <input type="hidden" {...register('asset_id')} />

        <fieldset>
          <legend>Allocate to</legend>
          <label htmlFor="allocate-to-employee">
            <input
              id="allocate-to-employee"
              type="radio"
              checked={targetType === 'employee'}
              onChange={() => changeTargetType('employee')}
            />
            Employee
          </label>
          <label htmlFor="allocate-to-department">
            <input
              id="allocate-to-department"
              type="radio"
              checked={targetType === 'department'}
              onChange={() => changeTargetType('department')}
            />
            Department
          </label>
        </fieldset>

        {targetType === 'employee' ? (
          <div>
            <label htmlFor="allocation-employee">Employee</label>
            <select
              id="allocation-employee"
              aria-invalid={Boolean(errors.allocated_to_user_id)}
              aria-describedby={errors.allocated_to_user_id ? 'allocation-target-error' : undefined}
              {...register('allocated_to_user_id')}
            >
              <option value="">Select an employee</option>
              {activeEmployees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} — {employee.email}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label htmlFor="allocation-department">Department</label>
            <select
              id="allocation-department"
              aria-invalid={Boolean(errors.allocated_to_user_id)}
              aria-describedby={errors.allocated_to_user_id ? 'allocation-target-error' : undefined}
              {...register('allocated_to_dept_id')}
            >
              <option value="">Select a department</option>
              {activeDepartments.map((department) => (
                <option key={department.id} value={department.id}>{department.name}</option>
              ))}
            </select>
          </div>
        )}
        {errors.allocated_to_user_id && (
          <p id="allocation-target-error" role="alert">{errors.allocated_to_user_id.message}</p>
        )}

        <div>
          <label htmlFor="expected-return-date">Expected return date <span>(optional)</span></label>
          <input id="expected-return-date" type="date" {...register('expected_return_date')} />
        </div>

        <div>
          <button type="button" onClick={onCancel} disabled={isSubmitting}>Cancel</button>
          <button type="submit" disabled={isSubmitting || !asset?.id}>
            {isSubmitting ? 'Allocating…' : 'Allocate asset'}
          </button>
        </div>
      </form>
    </div>
  );
}
