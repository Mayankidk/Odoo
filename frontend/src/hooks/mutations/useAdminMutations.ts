import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { AssetCategory, Department, User, UserRole } from "@/lib/database.types"
import { throwIfError } from "@/lib/errors"
import { queryKeys } from "@/lib/queryKeys"
import { supabase } from "@/lib/supabase"

export function useUpsertDepartment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (department: Partial<Department>) => {
      const { data, error } = await supabase.from("departments").upsert(department).select().single()
      throwIfError(error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.departments })
    },
  })
}

export function useUpsertCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (category: Partial<AssetCategory>) => {
      const { data, error } = await supabase.from("asset_categories").upsert(category).select().single()
      throwIfError(error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories })
    },
  })
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const { data, error } = await supabase
        .from("users")
        .update({ role } satisfies Partial<User>)
        .eq("id", userId)
        .select()
        .single()

      throwIfError(error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees })
    },
  })
}
