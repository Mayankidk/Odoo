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
