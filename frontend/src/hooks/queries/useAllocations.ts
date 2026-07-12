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
        .select("*, asset:assets(asset_tag, name), user:users(name), department:departments(name)")
        .order("created_at", { ascending: false })

      throwIfError(error)
      return data
    },
  })
}
