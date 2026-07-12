import { useQuery } from "@tanstack/react-query"

import { throwIfError } from "@/lib/errors"
import { queryKeys } from "@/lib/queryKeys"
import { supabase } from "@/lib/supabase"

export function useMaintenanceRequests() {
  return useQuery({
    queryKey: queryKeys.maintenanceRequests,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_requests")
        .select("*, asset:assets!asset_id(asset_tag, name), raised_by:users!raised_by_id(name)")
        .order("created_at", { ascending: false })

      throwIfError(error)
      return data as any[]
    },
  })
}
