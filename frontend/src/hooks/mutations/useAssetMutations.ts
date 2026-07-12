import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { Asset, Allocation } from "@/lib/database.types"
import { throwIfError } from "@/lib/errors"
import { queryKeys } from "@/lib/queryKeys"
import { supabase } from "@/lib/supabase"

type AllocateAssetArgs = {
  assetId: string
  userId?: string | null
  departmentId?: string | null
  expectedReturnDate?: string | null
}

export function useRegisterAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (asset: Partial<Asset>) => {
      const { data, error } = await supabase.from("assets").insert(asset).select().single()
      throwIfError(error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardKpis })
    },
  })
}

export function useAllocateAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      assetId,
      userId = null,
      departmentId = null,
      expectedReturnDate = null,
    }: AllocateAssetArgs) => {
      const { data, error } = await supabase.rpc("allocate_asset", {
        p_asset_id: assetId,
        p_user_id: userId,
        p_department_id: departmentId,
        p_expected_return_date: expectedReturnDate,
      })

      throwIfError(error)
      return data satisfies Allocation
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] })
      queryClient.invalidateQueries({ queryKey: queryKeys.allocations })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardKpis })
    },
  })
}

export function useReturnAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      allocationId,
      returnNotes,
      conditionOnReturn,
    }: {
      allocationId: string
      returnNotes?: string
      conditionOnReturn?: Allocation["condition_on_return"]
    }) => {
      const { data: allocation, error: allocationError } = await supabase
        .from("allocations")
        .update({
          actual_return_date: new Date().toISOString().slice(0, 10),
          return_notes: returnNotes,
          condition_on_return: conditionOnReturn,
          status: "returned",
        })
        .eq("id", allocationId)
        .select()
        .single()

      throwIfError(allocationError)

      const { error: assetError } = await supabase
        .from("assets")
        .update({ status: "available" })
        .eq("id", allocation.asset_id)

      throwIfError(assetError)
      return allocation
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] })
      queryClient.invalidateQueries({ queryKey: queryKeys.allocations })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardKpis })
    },
  })
}
