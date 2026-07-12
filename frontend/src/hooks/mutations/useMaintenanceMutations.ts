import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { MaintenanceRequest, MaintenanceStatus } from "@/lib/database.types"
import { throwIfError } from "@/lib/errors"
import { queryKeys } from "@/lib/queryKeys"
import { supabase } from "@/lib/supabase"

export function useCreateMaintenanceRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: Partial<MaintenanceRequest>) => {
      const { data, error } = await supabase.from("maintenance_requests").insert(request).select().single()
      throwIfError(error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenanceRequests })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardKpis })
    },
  })
}

export function useUpdateMaintenanceStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      requestId,
      status,
      assignedTechnicianId,
      resolutionNotes,
    }: {
      requestId: string
      status: MaintenanceStatus
      assignedTechnicianId?: string | null
      resolutionNotes?: string | null
    }) => {
      const { data, error } = await supabase
        .from("maintenance_requests")
        .update({
          status,
          assigned_technician_id: assignedTechnicianId,
          resolution_notes: resolutionNotes,
          resolved_at: status === "resolved" ? new Date().toISOString() : undefined,
        })
        .eq("id", requestId)
        .select()
        .single()

      throwIfError(error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenanceRequests })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardKpis })
    },
  })
}
