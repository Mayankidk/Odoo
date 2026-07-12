import { useQuery } from "@tanstack/react-query"

import { throwIfError } from "@/lib/errors"
import { queryKeys } from "@/lib/queryKeys"
import { supabase } from "@/lib/supabase"

export function useAllocations() {
  return useQuery({
    queryKey: queryKeys.allocations,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("allocations")
        .select("*, asset:assets(asset_tag, name), user:users!allocations_allocated_to_user_id_fkey(name), department:departments!allocations_allocated_to_dept_id_fkey(name)")
        .order("created_at", { ascending: false })

      throwIfError(error)
      return data
    },
  })
}
