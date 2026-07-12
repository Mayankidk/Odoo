import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { departmentSchema } from './02-validation-schemas';

const EMPTY_VALUES = {
  name: '',
  parent_department_id: '',
  department_head_id: '',
  status: 'active',
};

/**
 * M4 Department Form
 *
 * M2 supplies department and employee data plus the create/update mutation.
 * M3 can render this inside its modal or Organization Setup page.
 */
export function DepartmentForm({
  department,
  departments = [],
  employees = [],
  isSubmitting = false,
  onCancel,
  onSubmit,
}) {
  const form = useForm({
    resolver: zodResolver(departmentSchema),
    defaultValues: EMPTY_VALUES,
  });

  const { register, handleSubmit, reset, formState: { errors } } = form;

  useEffect(() => {
    reset({
      name: department?.name ?? '',
      parent_department_id: department?.parent_department_id ?? '',
      department_head_id: department?.department_head_id ?? '',
      status: department?.status ?? 'active',
    });
  }, [department, reset]);

  const availableParents = useMemo(
    () => departments.filter((item) => item.id !== department?.id && item.status === 'active'),
    [departments, department?.id],
  );

  const activeEmployees = useMemo(
    () => employees.filter((employee) => employee.status === 'active'),
    [employees],
  );

  async function submit(values) {
    const payload = {
      ...values,
      parent_department_id: values.parent_department_id || null,
      department_head_id: values.department_head_id || null,
    };

    await onSubmit?.(payload, department?.id);
  }

  return (
    <form noValidate onSubmit={handleSubmit(submit)} aria-label="Department form">
      <div>
        <label htmlFor="department-name">Department name</label>
        <input
          id="department-name"
          type="text"
          autoComplete="organization"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'department-name-error' : undefined}
          {...register('name')}
        />
        {errors.name && <p id="department-name-error" role="alert">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="parent-department">Parent department</label>
        <select
          id="parent-department"
          {...register('parent_department_id', { setValueAs: (value) => value || undefined })}
        >
          <option value="">No parent department</option>
          {availableParents.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="department-head">Department head</label>
        <select
          id="department-head"
          {...register('department_head_id', { setValueAs: (value) => value || undefined })}
        >
          <option value="">Assign later</option>
          {activeEmployees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name} — {employee.email}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend>Department status</legend>
        <label htmlFor="department-active">
          <input id="department-active" type="radio" value="active" {...register('status')} />
          Active
        </label>
        <label htmlFor="department-inactive">
          <input id="department-inactive" type="radio" value="inactive" {...register('status')} />
          Inactive
        </label>
      </fieldset>

      <div>
        <button type="button" onClick={onCancel} disabled={isSubmitting}>Cancel</button>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : department ? 'Save changes' : 'Create department'}
        </button>
      </div>
    </form>
  );
}
