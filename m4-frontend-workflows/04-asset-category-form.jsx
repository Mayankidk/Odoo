import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { assetCategorySchema } from './02-validation-schemas';

const EMPTY_VALUES = {
  name: '',
  description: '',
  custom_fields_schema: null,
  status: 'active',
};

function schemaToText(schema) {
  return schema ? JSON.stringify(schema, null, 2) : '';
}

/**
 * M4 Asset Category Form
 *
 * M2 supplies create/update mutations through `onSubmit`. The form intentionally
 * keeps custom fields as JSON so the API can store the future-facing schema without
 * forcing a particular schema-builder UI in the MVP.
 */
export function AssetCategoryForm({
  category,
  isSubmitting = false,
  onCancel,
  onSubmit,
}) {
  const [customFieldsText, setCustomFieldsText] = useState('');
  const [customFieldsError, setCustomFieldsError] = useState('');
  const form = useForm({
    resolver: zodResolver(assetCategorySchema),
    defaultValues: EMPTY_VALUES,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  useEffect(() => {
    reset({
      name: category?.name ?? '',
      description: category?.description ?? '',
      custom_fields_schema: category?.custom_fields_schema ?? null,
      status: category?.status ?? 'active',
    });
    setCustomFieldsText(schemaToText(category?.custom_fields_schema));
    setCustomFieldsError('');
  }, [category, reset]);

  async function submit(values) {
    let customFieldsSchema = null;

    if (customFieldsText.trim()) {
      try {
        customFieldsSchema = JSON.parse(customFieldsText);
      } catch {
        setCustomFieldsError('Custom fields must be valid JSON.');
        return;
      }

      if (!customFieldsSchema || Array.isArray(customFieldsSchema) || typeof customFieldsSchema !== 'object') {
        setCustomFieldsError('Custom fields must be a JSON object.');
        return;
      }
    }

    setCustomFieldsError('');
    await onSubmit?.(
      {
        ...values,
        description: values.description || null,
        custom_fields_schema: customFieldsSchema,
      },
      category?.id,
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit(submit)} aria-label="Asset category form">
      <div>
        <label htmlFor="category-name">Category name</label>
        <input
          id="category-name"
          type="text"
          autoComplete="off"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'category-name-error' : undefined}
          {...register('name')}
        />
        {errors.name && <p id="category-name-error" role="alert">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="category-description">Description <span>(optional)</span></label>
        <textarea
          id="category-description"
          rows="4"
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? 'category-description-error' : undefined}
          {...register('description')}
        />
        {errors.description && (
          <p id="category-description-error" role="alert">{errors.description.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="category-custom-fields">Custom fields schema <span>(optional JSON)</span></label>
        <textarea
          id="category-custom-fields"
          rows="8"
          value={customFieldsText}
          onChange={(event) => {
            setCustomFieldsText(event.target.value);
            if (customFieldsError) setCustomFieldsError('');
          }}
          placeholder={'{\n  "warranty_months": { "type": "number" }\n}'}
          aria-invalid={Boolean(customFieldsError)}
          aria-describedby={customFieldsError ? 'category-custom-fields-error' : undefined}
          spellCheck="false"
        />
        <p>Define optional fields that assets in this category can collect later.</p>
        {customFieldsError && (
          <p id="category-custom-fields-error" role="alert">{customFieldsError}</p>
        )}
      </div>

      <fieldset>
        <legend>Category status</legend>
        <label htmlFor="category-active">
          <input id="category-active" type="radio" value="active" {...register('status')} />
          Active
        </label>
        <label htmlFor="category-inactive">
          <input id="category-inactive" type="radio" value="inactive" {...register('status')} />
          Inactive
        </label>
      </fieldset>

      <div>
        <button type="button" onClick={onCancel} disabled={isSubmitting}>Cancel</button>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : category ? 'Save changes' : 'Create category'}
        </button>
      </div>
    </form>
  );
}
