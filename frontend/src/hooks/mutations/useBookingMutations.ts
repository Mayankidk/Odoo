import { useMutation, useQueryClient } from "@tanstack/react-query"

import { throwIfError } from "@/lib/errors"
import { queryKeys } from "@/lib/queryKeys"
import { supabase } from "@/lib/supabase"

type BookResourceArgs = {
  resourceId: string
  startTime: string
  endTime: string
  purpose?: string | null
}

export function useBookResource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ resourceId, startTime, endTime, purpose = null }: BookResourceArgs) => {
      const { data, error } = await supabase.rpc("book_resource", {
        p_resource_id: resourceId,
        p_start_time: startTime,
        p_end_time: endTime,
        p_purpose: purpose,
      })

      throwIfError(error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardKpis })
    },
  })
}

export function useCancelBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { data, error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId)
        .select()
        .single()

      throwIfError(error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardKpis })
    },
  })
}
