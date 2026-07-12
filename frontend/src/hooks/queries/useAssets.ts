import { useQuery } from "@tanstack/react-query"

import type { AssetFilters } from "@/lib/database.types"
import { throwIfError } from "@/lib/errors"
import { queryKeys } from "@/lib/queryKeys"
import { supabase } from "@/lib/supabase"

export function useAssets(filters: AssetFilters = {}) {
  return useQuery({
    queryKey: queryKeys.assets(filters),
    queryFn: async () => {
      const page = filters.page ?? 1
      const pageSize = filters.pageSize ?? 20
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      let query = supabase
        .from("assets")
        .select("*, category:asset_categories(name), department:departments(name)", {
          count: "exact",
        })
        .range(from, to)
        .order("created_at", { ascending: false })

      if (filters.status) query = query.eq("status", filters.status)
      if (filters.categoryId) query = query.eq("category_id", filters.categoryId)
      if (filters.departmentId) query = query.eq("department_id", filters.departmentId)
      if (typeof filters.bookable === "boolean") query = query.eq("is_bookable", filters.bookable)
      if (filters.search) query = query.ilike("name", `%${filters.search}%`)

      const { data, error, count } = await query
      throwIfError(error)
      return { data, count: count ?? 0, page, pageSize }
    },
  })
}
