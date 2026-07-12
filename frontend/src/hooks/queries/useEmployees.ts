import { useQuery } from "@tanstack/react-query"

import { throwIfError } from "@/lib/errors"
import { queryKeys } from "@/lib/queryKeys"
import { supabase } from "@/lib/supabase"

export function useEmployees() {
  return useQuery({
    queryKey: queryKeys.employees,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*, department:departments!users_department_id_fkey(name)")
        .order("name", { ascending: true })

      throwIfError(error)
      return data
    },
  })
}
