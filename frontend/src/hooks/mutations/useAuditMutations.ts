import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { AuditCycle, AuditItem } from "@/lib/database.types"
import { throwIfError } from "@/lib/errors"
import { queryKeys } from "@/lib/queryKeys"
import { supabase } from "@/lib/supabase"

export function useCreateAuditCycle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (auditCycle: Partial<AuditCycle>) => {
      const { data, error } = await supabase.from("audit_cycles").insert(auditCycle).select().single()
      throwIfError(error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auditCycles })
    },
  })
}

export function useUpdateAuditItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      auditItemId,
      values,
    }: {
      auditItemId: string
      values: Partial<AuditItem>
    }) => {
      const { data, error } = await supabase
        .from("audit_items")
        .update({
          ...values,
          verified_at: values.verification_status ? new Date().toISOString() : values.verified_at,
        })
        .eq("id", auditItemId)
        .select()
        .single()

      throwIfError(error)
      return data
    },
    onSuccess: (auditItem) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auditItems(auditItem.audit_cycle_id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.auditCycles })
    },
  })
}

export function useCloseAuditCycle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (auditCycleId: string) => {
      const { data: cycle, error: cycleError } = await supabase
        .from("audit_cycles")
        .update({ status: "closed" as any })
        .eq("id", auditCycleId)
        .select()
        .single()

      throwIfError(cycleError)

      const { data: items, error: itemsError } = await supabase
        .from("audit_items")
        .select("asset_id, verification_status")
        .eq("audit_cycle_id", auditCycleId)

      throwIfError(itemsError)

      const missingItems = items?.filter(item => item.verification_status === "missing") ?? []

      if (missingItems.length > 0) {
        const assetIds = missingItems.map(item => item.asset_id)
        const { error: assetsError } = await supabase
          .from("assets")
          .update({ status: "lost" })
          .in("id", assetIds)

        throwIfError(assetsError)
      }

      return cycle
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] })
      queryClient.invalidateQueries({ queryKey: queryKeys.auditCycles })
      queryClient.invalidateQueries({ queryKey: ["auditItems"] })
    },
  })
}
