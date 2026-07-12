const codeMessages: Record<string, string> = {
  "23505": "This record already exists.",
  "23503": "A linked record is missing or invalid.",
  "42501": "You do not have permission to perform this action.",
  PGRST116: "The requested record was not found.",
}

const rpcMessages: Array<[string, string]> = [
  ["FORBIDDEN", "You do not have permission to perform this action."],
  ["INVALID_HOLDER", "Choose exactly one employee or department."],
  ["ASSET_NOT_FOUND", "Asset does not exist."],
  ["ASSET_ALREADY_ALLOCATED", "This asset is already allocated."],
  ["INACTIVE_DEPARTMENT", "Inactive departments cannot receive allocations."],
  ["INVALID_BOOKING_TIME", "End time must be after start time."],
  ["RESOURCE_NOT_FOUND", "Resource does not exist."],
  ["RESOURCE_NOT_BOOKABLE", "This asset is not marked as a shared resource."],
  ["RESOURCE_UNAVAILABLE", "This resource is unavailable."],
  ["BOOKING_OVERLAP", "This booking overlaps with an existing reservation."],
]

type SupabaseLikeError = {
  code?: string
  message?: string
  details?: string
}

export function toReadableError(error: unknown): Error {
  if (error instanceof Error) {
    return new Error(mapMessage(error.message))
  }

  if (typeof error === "object" && error !== null) {
    const supabaseError = error as SupabaseLikeError
    if (supabaseError.code && codeMessages[supabaseError.code]) {
      return new Error(codeMessages[supabaseError.code])
    }

    if (supabaseError.message) {
      return new Error(mapMessage(supabaseError.message))
    }
  }

  return new Error("Something went wrong. Please try again.")
}

export function throwIfError(error: unknown): asserts error is null {
  if (error) {
    throw toReadableError(error)
  }
}

function mapMessage(message: string) {
  const rpcMatch = rpcMessages.find(([code]) => message.includes(code))
  return rpcMatch?.[1] ?? message
}
