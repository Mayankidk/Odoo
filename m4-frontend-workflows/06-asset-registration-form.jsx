import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ASSET_CONDITIONS, assetSchema } from './02-validation-schemas';

const EMPTY_VALUES = {
  name: '',
  category_id: '',
  serial_number: '',
  acquisition_date: '',
  acquisition_cost: '',
  condition: 'good',
  location: '',
  department_id: '',
  is_bookable: false,
  custom_fields: {},
};

function CustomFields({ schema, register, errors }) {
  const fields = Object.entries(schema ?? {});
  if (fields.length === 0) return null;

  return (
    <fieldset>
      <legend>Category details</legend>
      {fields.map(([key, definition]) => {
        const type = definition?.type === 'number' ? 'number' : definition?.type === 'date' ? 'date' : 'text';
        const label = definition?.label ?? key.replaceAll('_', ' ');
        const error = errors.custom_fields?.[key];

        return (
          <div key={key}>
            <label htmlFor={`custom-field-${key}`}>{label}</label>
            <input
              id={`custom-field-${key}`}
              type={type}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `custom-field-${key}-error` : undefined}
              {...register(`custom_fields.${key}`, {
                setValueAs: (value) => (type === 'number' && value !== '' ? Number(value) : value),
              })}
            />
            {error && <p id={`custom-field-${key}-error`} role="alert">{error.message}</p>}
          </div>
        );
      })}
    </fieldset>
  );
}

/**
 * M4 Asset Registration Form
 *
 * M2 supplies active categories/departments and connects `onSubmit` to
 * useCreateAsset. Asset tag, lifecycle status, and registered-by are deliberately
 * omitted because M1 creates those values server-side.
 */
export function AssetRegistrationForm({
  asset,
  categories = [],
  departments = [],
  isSubmitting = false,
  onCancel,
  onSubmit,
}) {
  const activeCategories = useMemo(
    () => categories.filter((category) => category.status === 'active'),
    [categories],
  );
  const activeDepartments = useMemo(
    () => departments.filter((department) => department.status === 'active'),
    [departments],
  );
  const form = useForm({
    resolver: zodResolver(assetSchema),
    defaultValues: EMPTY_VALUES,
  });
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = form;
  const categoryId = watch('category_id');
  const selectedCategory = activeCategories.find((category) => category.id === categoryId);

  useEffect(() => {
    reset({
      name: asset?.name ?? '',
      category_id: asset?.category_id ?? asset?.category?.id ?? '',
      serial_number: asset?.serial_number ?? '',
      acquisition_date: asset?.acquisition_date ?? '',
      acquisition_cost: asset?.acquisition_cost ?? '',
      condition: asset?.condition ?? 'good',
      location: asset?.location ?? '',
      department_id: asset?.department_id ?? asset?.department?.id ?? '',
      is_bookable: asset?.is_bookable ?? false,
      custom_fields: asset?.custom_fields ?? {},
    });
  }, [asset, reset]);

  async function submit(values) {
    await onSubmit?.({
      ...values,
      serial_number: values.serial_number || null,
      acquisition_date: values.acquisition_date || null,
      acquisition_cost: values.acquisition_cost === '' ? null : values.acquisition_cost,
      location: values.location || null,
      department_id: values.department_id || null,
    }, asset?.id);
  }

  return (
    <form noValidate onSubmit={handleSubmit(submit)} aria-label="Asset registration form">
      <div>
        <label htmlFor="asset-name">Asset name</label>
        <input
          id="asset-name"
          type="text"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'asset-name-error' : undefined}
          {...register('name')}
        />
        {errors.name && <p id="asset-name-error" role="alert">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="asset-category">Category</label>
        <select
          id="asset-category"
          aria-invalid={Boolean(errors.category_id)}
          aria-describedby={errors.category_id ? 'asset-category-error' : undefined}
          {...register('category_id')}
        >
          <option value="">Select a category</option>
          {activeCategories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        {errors.category_id && <p id="asset-category-error" role="alert">{errors.category_id.message}</p>}
      </div>

      <div>
        <label htmlFor="asset-serial-number">Serial number <span>(optional)</span></label>
        <input id="asset-serial-number" type="text" {...register('serial_number')} />
        <p>Duplicate serial numbers are allowed but will be highlighted by the directory.</p>
      </div>

      <div>
        <label htmlFor="asset-acquisition-date">Acquisition date <span>(optional)</span></label>
        <input id="asset-acquisition-date" type="date" {...register('acquisition_date')} />
      </div>

      <div>
        <label htmlFor="asset-acquisition-cost">Acquisition cost <span>(optional)</span></label>
        <input
          id="asset-acquisition-cost"
          type="number"
          min="0"
          step="0.01"
          aria-invalid={Boolean(errors.acquisition_cost)}
          aria-describedby={errors.acquisition_cost ? 'asset-acquisition-cost-error' : undefined}
          {...register('acquisition_cost')}
        />
        {errors.acquisition_cost && (
          <p id="asset-acquisition-cost-error" role="alert">{errors.acquisition_cost.message}</p>
        )}
      </div>

      <fieldset>
        <legend>Condition</legend>
        {ASSET_CONDITIONS.map((condition) => (
          <label key={condition} htmlFor={`asset-condition-${condition}`}>
            <input
              id={`asset-condition-${condition}`}
              type="radio"
              value={condition}
              {...register('condition')}
            />
            {condition}
          </label>
        ))}
        {errors.condition && <p role="alert">{errors.condition.message}</p>}
      </fieldset>

      <div>
        <label htmlFor="asset-location">Location <span>(optional)</span></label>
        <input id="asset-location" type="text" {...register('location')} />
      </div>

      <div>
        <label htmlFor="asset-department">Owning department <span>(optional)</span></label>
        <select id="asset-department" {...register('department_id')}>
          <option value="">No department</option>
          {activeDepartments.map((department) => (
            <option key={department.id} value={department.id}>{department.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="asset-is-bookable">
          <input id="asset-is-bookable" type="checkbox" {...register('is_bookable')} />
          This is a shared resource that can be booked by time slot
        </label>
      </div>

      <CustomFields schema={selectedCategory?.custom_fields_schema} register={register} errors={errors} />

      <div>
        <button type="button" onClick={onCancel} disabled={isSubmitting}>Cancel</button>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : asset ? 'Save changes' : 'Register asset'}
        </button>
      </div>
    </form>
  );
}
