import { useQuery } from "@tanstack/react-query"

import { throwIfError } from "@/lib/errors"
import { queryKeys } from "@/lib/queryKeys"
import { supabase } from "@/lib/supabase"

export function useAuditCycles() {
  return useQuery({
    queryKey: queryKeys.auditCycles,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_cycles")
        .select("*")
        .order("start_date", { ascending: false })

      throwIfError(error)
      return data as any[]
    },
  })
}

export function useAuditItems(auditCycleId?: string) {
  return useQuery({
    queryKey: queryKeys.auditItems(auditCycleId),
    enabled: Boolean(auditCycleId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_items")
        .select("*, asset:assets!asset_id(asset_tag, name), verified_by:users!verified_by_id(name)")
        .eq("audit_cycle_id", auditCycleId ?? "")
        .order("created_at", { ascending: true })

      throwIfError(error)
      return data as any[]
    },
  })
}
