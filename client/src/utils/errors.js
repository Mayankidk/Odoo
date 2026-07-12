/**
 * Parses Postgres / Supabase error codes and custom database exceptions
 * into friendly, clean messages suitable for user-facing UI toasts.
 *
 * @param {any} error - The error object thrown by Supabase client / React Query
 * @returns {string} User-readable error message string
 */
export function parseSupabaseError(error) {
  if (!error) return 'An unexpected error occurred. Please try again.';

  // If error is already a string
  if (typeof error === 'string') {
    return cleanCustomMessage(error);
  }

  const message = error.message || '';
  const code = error.code || '';

  // 1. Match Custom Postgres RAISE EXCEPTION messages from RPCs
  if (message.includes('FORBIDDEN:')) {
    return 'Permission Denied: Only admins and asset managers can perform this action.';
  }
  if (message.includes('INVALID_HOLDER:')) {
    return 'Invalid Allocation: Please specify exactly one user OR one department as the holder.';
  }
  if (message.includes('ASSET_NOT_FOUND:')) {
    return 'The requested asset could not be found in the directory.';
  }
  if (message.includes('ASSET_ALREADY_ALLOCATED:')) {
    const holderMatch = message.match(/Currently held by (.+)/);
    const holder = holderMatch ? holderMatch[1] : 'another user';
    return `Allocation Conflict: This asset is currently allocated to ${holder}.`;
  }
  if (message.includes('INACTIVE_DEPARTMENT:')) {
    return 'Allocation Blocked: Deactivated departments cannot receive asset allocations.';
  }
  if (message.includes('INVALID_BOOKING_TIME:')) {
    return 'Invalid Time Range: The booking end time must be after the start time.';
  }
  if (message.includes('RESOURCE_NOT_FOUND:')) {
    return 'The shared resource booking could not be completed because the asset does not exist.';
  }
  if (message.includes('RESOURCE_NOT_BOOKABLE:')) {
    return 'Booking Blocked: This asset is not configured as a bookable/shared resource.';
  }
  if (message.includes('RESOURCE_UNAVAILABLE:')) {
    const statusMatch = message.match(/status is (.+)/);
    const status = statusMatch ? statusMatch[1].replace('_', ' ') : 'unavailable';
    return `Resource Unavailable: This asset is currently ${status} and cannot be booked.`;
  }
  if (message.includes('BOOKING_OVERLAP:')) {
    return 'Schedule Conflict: This resource is already booked by someone else during the selected time slot.';
  }
  if (message.includes('ASSET_TAG_IMMUTABLE:')) {
    return 'Action Blocked: Asset tags are permanent and cannot be modified after registration.';
  }

  // 2. Map Postgres standard error codes
  switch (code) {
    // 42501 - Insufficient Privilege (Row Level Security policy violation)
    case '42501':
      return 'Access Denied: You do not have permission to view, edit, or delete this record.';

    // 23505 - Unique Violation (e.g. duplicate email, unique names, duplicate asset tags)
    case '23505': {
      if (message.includes('email')) {
        return 'An account with this email address already exists.';
      }
      if (message.includes('asset_tag')) {
        return 'An asset with this Tag ID is already registered.';
      }
      if (message.includes('name')) {
        return 'A record with this name already exists. Please choose a unique name.';
      }
      return 'Conflict: A record with this unique identifier already exists.';
    }

    // 23503 - Foreign Key Violation
    case '23503':
      return 'Operation Blocked: This record is connected to other active data (e.g., assets in a department) and cannot be deleted.';

    // 23514 - Check Constraint Violation
    case '23514': {
      if (message.includes('assets_asset_tag_format')) {
        return 'Format Error: Asset tag must follow the prefix format (e.g., AF-0001).';
      }
      if (message.includes('assets_acquisition_cost_positive')) {
        return 'Validation Error: Acquisition cost cannot be a negative value.';
      }
      if (message.includes('bookings_valid_time_range')) {
        return 'Validation Error: Booking end time must be later than start time.';
      }
      return 'Validation Error: One or more fields violate database constraints.';
    }

    // 22001 - String Data Right Truncation (character limit exceeded)
    case '22001':
      return 'Field Length Limit Exceeded: One of your inputs contains too many characters.';

    // P0001 - Raise Exception (Fallback for Postgres custom errors)
    case 'P0001':
      return cleanCustomMessage(message);

    default:
      // Fallback to default message or database error message
      return message ? cleanCustomMessage(message) : 'An unexpected database error occurred.';
  }
}

/**
 * Truncates and cleans standard database messages to make them readable.
 */
function cleanCustomMessage(message) {
  // Removes standard database prefix logs e.g. "exception: " or "Error: "
  return message
    .replace(/^error:\s*/gi, '')
    .replace(/^exception:\s*/gi, '')
    .trim();
}
