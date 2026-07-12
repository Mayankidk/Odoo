import { useQuery } from "@tanstack/react-query"

import { throwIfError } from "@/lib/errors"
import { queryKeys } from "@/lib/queryKeys"
import { supabase } from "@/lib/supabase"

export function useDepartments() {
  return useQuery({
    queryKey: queryKeys.departments,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name", { ascending: true })

      throwIfError(error)
      return data
    },
  })
}
