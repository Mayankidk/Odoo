import { z } from 'zod';

const uuid = z.string().uuid('Please select a valid record.');
const optionalUuid = z.string().uuid().optional().nullable();
const optionalTrimmedText = (maxLength) =>
  z.string().trim().max(maxLength).optional().or(z.literal(''));

export const DEPARTMENT_STATUSES = ['active', 'inactive'];
export const ASSET_CONDITIONS = ['new', 'good', 'fair', 'poor'];
export const ASSET_STATUSES = [
  'available',
  'allocated',
  'reserved',
  'under_maintenance',
  'lost',
  'retired',
  'disposed',
];
export const MAINTENANCE_PRIORITIES = ['low', 'medium', 'high', 'critical'];
export const MAINTENANCE_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'assigned',
  'in_progress',
  'resolved',
];
export const AUDIT_VERIFICATION_STATUSES = ['verified', 'missing', 'damaged'];

export const departmentSchema = z.object({
  name: z.string().trim().min(1, 'Department name is required.').max(100),
  parent_department_id: optionalUuid,
  department_head_id: optionalUuid,
  status: z.enum(DEPARTMENT_STATUSES).default('active'),
});

export const assetCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required.').max(100),
  description: optionalTrimmedText(2000),
  custom_fields_schema: z.record(z.unknown()).optional().nullable(),
  status: z.enum(DEPARTMENT_STATUSES).default('active'),
});

export const assetSchema = z.object({
  name: z.string().trim().min(1, 'Asset name is required.').max(200),
  category_id: uuid,
  serial_number: optionalTrimmedText(100),
  acquisition_date: z.string().date().optional().or(z.literal('')),
  acquisition_cost: z.coerce
    .number()
    .min(0, 'Acquisition cost cannot be negative.')
    .max(9999999999.99)
    .optional()
    .nullable(),
  condition: z.enum(ASSET_CONDITIONS),
  location: optionalTrimmedText(200),
  department_id: optionalUuid,
  is_bookable: z.boolean().default(false),
  custom_fields: z.record(z.unknown()).optional().nullable(),
});

export const allocationSchema = z
  .object({
    asset_id: uuid,
    allocated_to_user_id: optionalUuid,
    allocated_to_dept_id: optionalUuid,
    expected_return_date: z.string().date().optional().or(z.literal('')),
  })
  .superRefine((data, context) => {
    const hasUser = Boolean(data.allocated_to_user_id);
    const hasDepartment = Boolean(data.allocated_to_dept_id);

    if (hasUser === hasDepartment) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select either one employee or one department.',
        path: ['allocated_to_user_id'],
      });
    }
  });

export const transferRequestSchema = z.object({
  allocation_id: uuid,
  reason: optionalTrimmedText(1000),
});

export const returnAssetSchema = z.object({
  allocation_id: uuid,
  return_notes: z.string().trim().min(1, 'Condition check-in notes are required.').max(2000),
  condition_on_return: z.enum([...ASSET_CONDITIONS, 'damaged']).optional(),
});

export const maintenanceRequestSchema = z.object({
  asset_id: uuid,
  description: z.string().trim().min(1, 'Describe the issue.').max(5000),
  priority: z.enum(MAINTENANCE_PRIORITIES).default('medium'),
});

export const maintenanceDecisionSchema = z
  .object({
    status: z.enum(MAINTENANCE_STATUSES),
    rejection_reason: optionalTrimmedText(2000),
    assigned_technician_id: optionalUuid,
    resolution_notes: optionalTrimmedText(5000),
  })
  .superRefine((data, context) => {
    if (data.status === 'rejected' && !data.rejection_reason) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide a reason for rejecting this request.',
        path: ['rejection_reason'],
      });
    }

    if (['assigned', 'in_progress'].includes(data.status) && !data.assigned_technician_id) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select a technician before progressing this request.',
        path: ['assigned_technician_id'],
      });
    }

    if (data.status === 'resolved' && !data.resolution_notes) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Add resolution notes before resolving this request.',
        path: ['resolution_notes'],
      });
    }
  });

export const auditCycleSchema = z
  .object({
    name: z.string().trim().min(1, 'Audit cycle name is required.').max(200),
    scope_type: z.enum(['department', 'location']),
    scope_id: optionalUuid,
    scope_location: optionalTrimmedText(200),
    start_date: z.string().date('Start date is required.'),
    end_date: z.string().date('End date is required.'),
    auditor_ids: z.array(uuid).min(1, 'Assign at least one auditor.'),
  })
  .superRefine((data, context) => {
    if (data.scope_type === 'department' && !data.scope_id) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select the department to audit.',
        path: ['scope_id'],
      });
    }

    if (data.scope_type === 'location' && !data.scope_location) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter the location to audit.',
        path: ['scope_location'],
      });
    }

    if (data.end_date < data.start_date) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be on or after the start date.',
        path: ['end_date'],
      });
    }

    if (new Set(data.auditor_ids).size !== data.auditor_ids.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'An auditor can be assigned only once.',
        path: ['auditor_ids'],
      });
    }
  });

export const auditVerificationSchema = z.object({
  verification_status: z.enum(AUDIT_VERIFICATION_STATUSES),
  notes: optionalTrimmedText(2000),
});

export const bookingSchema = z
  .object({
    resource_id: uuid,
    start_time: z.string().datetime('Choose a valid start time.'),
    end_time: z.string().datetime('Choose a valid end time.'),
    purpose: optionalTrimmedText(500),
  })
  .refine((data) => new Date(data.end_time) > new Date(data.start_time), {
    message: 'End time must be after start time.',
    path: ['end_time'],
  });

export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

export function validateUpload(file) {
  if (!file) return 'Choose a file to upload.';
  if (file.size > MAX_UPLOAD_SIZE_BYTES) return 'Files must be 10 MB or smaller.';
  return null;
}

export function formatZodErrors(error) {
  return error.issues.reduce((errors, issue) => {
    const field = issue.path.join('.') || 'form';
    if (!errors[field]) errors[field] = issue.message;
    return errors;
  }, {});
}
