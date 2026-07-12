import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { throwIfError } from "@/lib/errors"
import { queryKeys } from "@/lib/queryKeys"

type CreateTransferRequestArgs = {
  allocationId: string
  reason?: string | null
}

type ApproveTransferRequestArgs = {
  requestId: string
}

type RejectTransferRequestArgs = {
  requestId: string
  rejectionReason: string
}

export function useCreateTransferRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ allocationId, reason = null }: CreateTransferRequestArgs) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data, error } = await supabase
        .from("transfer_requests")
        .insert({
          allocation_id: allocationId,
          requested_by_id: user.id,
          reason,
          status: "pending",
        })
        .select()
        .single()

      throwIfError(error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfer-requests"] })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardKpis })
    },
  })
}
export function useApproveTransferRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ requestId }: ApproveTransferRequestArgs) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // 1. Get the transfer request details
      const { data: request, error: reqErr } = await supabase
        .from("transfer_requests")
        .select("id, status, allocation_id, requested_by_id")
        .eq("id", requestId)
        .single()

      throwIfError(reqErr)
      if (request.status !== "pending") {
        throw new Error("Transfer request is not pending")
      }

      // 2. Get the allocation details separately
      const { data: allocation, error: allocErr } = await supabase
        .from("allocations")
        .select("id, asset_id")
        .eq("id", request.allocation_id)
        .single()

      throwIfError(allocErr)

      // 3. Update the transfer request to approved
      const { error: updateReqErr } = await supabase
        .from("transfer_requests")
        .update({
          status: "approved",
          approved_by_id: user.id,
        })
        .eq("id", requestId)

      throwIfError(updateReqErr)

      // 4. Mark the old allocation as transferred and return it
      const { error: oldAllocErr } = await supabase
        .from("allocations")
        .update({
          status: "transferred",
          actual_return_date: new Date().toISOString().split("T")[0],
        })
        .eq("id", request.allocation_id)

      throwIfError(oldAllocErr)

      // 5. Create the new allocation for the requester
      const { data: newAlloc, error: newAllocErr } = await supabase
        .from("allocations")
        .insert({
          asset_id: allocation.asset_id,
          allocated_to_user_id: request.requested_by_id,
          allocated_by_id: user.id,
          status: "active",
        })
        .select()
        .single()

      throwIfError(newAllocErr)
      return { request, newAlloc }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfer-requests"] })
      queryClient.invalidateQueries({ queryKey: queryKeys.allocations })
      queryClient.invalidateQueries({ queryKey: ["assets"] })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardKpis })
    },
  })
}


export function useRejectTransferRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ requestId, rejectionReason }: RejectTransferRequestArgs) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data, error } = await supabase
        .from("transfer_requests")
        .update({
          status: "rejected",
          approved_by_id: user.id,
          rejection_reason: rejectionReason,
        })
        .eq("id", requestId)
        .select()
        .single()

      throwIfError(error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfer-requests"] })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardKpis })
    },
  })
}
