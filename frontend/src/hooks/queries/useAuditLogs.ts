import { useQuery } from "@tanstack/react-query"
import { throwIfError } from "@/lib/errors"
import { queryKeys } from "@/lib/queryKeys"
import { supabase } from "@/lib/supabase"

export type AuditLogFilters = {
  action?: string
  resourceType?: string
  search?: string
  page?: number
  pageSize?: number
}

export function useAuditLogs(filters: AuditLogFilters = {}) {
  return useQuery({
    queryKey: queryKeys.auditLogs(filters),
    queryFn: async () => {
      const page = filters.page ?? 1
      const pageSize = filters.pageSize ?? 20
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      let query = supabase
        .from("audit_logs")
        .select("*, user:users(name, email)", {
          count: "exact",
        })
        .range(from, to)
        .order("created_at", { ascending: false })

      if (filters.action) {
        query = query.eq("action", filters.action)
      }
      if (filters.resourceType) {
        query = query.eq("resource_type", filters.resourceType)
      }

      if (filters.search) {
        const searchVal = filters.search.trim()
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (uuidRegex.test(searchVal)) {
          query = query.or(`resource_id.eq.${searchVal},user_id.eq.${searchVal}`)
        } else {
          query = query.or(`action.ilike.%${searchVal}%,resource_type.ilike.%${searchVal}%`)
        }
      }

      const { data, error, count } = await query
      throwIfError(error)
      return { data, count: count ?? 0, page, pageSize }
    },
  })
}
