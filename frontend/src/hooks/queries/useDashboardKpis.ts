import { useQuery } from "@tanstack/react-query"

import { throwIfError } from "@/lib/errors"
import { queryKeys } from "@/lib/queryKeys"
import { supabase } from "@/lib/supabase"

export function useDashboardKpis() {
  return useQuery({
    queryKey: queryKeys.dashboardKpis,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_dashboard_kpis")
      throwIfError(error)
      return data
    },
  })
}
