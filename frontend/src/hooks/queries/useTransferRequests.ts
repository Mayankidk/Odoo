import { useQuery } from "@tanstack/react-query"

import { throwIfError } from "@/lib/errors"
import { supabase } from "@/lib/supabase"

export type TransferRequestFilters = {
  status?: "pending" | "approved" | "rejected"
  allocationId?: string
}

export function useTransferRequests(filters: TransferRequestFilters = {}) {
  return useQuery({
    queryKey: ["transfer-requests", filters],
    queryFn: async () => {
      let query = supabase
        .from("transfer_requests")
        .select(`
          *,
          allocation:allocations (
            id,
            asset:assets ( id, asset_tag, name ),
            holder:users!allocations_allocated_to_user_id_fkey ( id, name ),
            holder_dept:departments!allocations_allocated_to_dept_id_fkey ( id, name )
          ),
          requested_by:users!transfer_requests_requested_by_id_fkey ( id, name, email ),
          approved_by:users!transfer_requests_approved_by_id_fkey ( id, name )
        `)
        .order("created_at", { ascending: false })

      if (filters.status) {
        query = query.eq("status", filters.status)
      }
      if (filters.allocationId) {
        query = query.eq("allocation_id", filters.allocationId)
      }

      const { data, error } = await query
      throwIfError(error)
      return data as any[]
    },
  })
}
