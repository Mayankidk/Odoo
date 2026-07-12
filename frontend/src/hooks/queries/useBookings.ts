import { useQuery } from "@tanstack/react-query"
import { throwIfError } from "@/lib/errors"
import { queryKeys } from "@/lib/queryKeys"
import { supabase } from "@/lib/supabase"
import type { Booking } from "@/lib/database.types"

export type BookingWithRelations = Booking & {
  resource: {
    asset_tag: string
    name: string
  } | null
  booked_by: {
    name: string
  } | null
}

export function useBookings() {
  return useQuery({
    queryKey: queryKeys.bookings,
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("bookings")
        .select("*, resource:assets(asset_tag, name), booked_by:users(name)")
        .order("start_time", { ascending: true }) as any)

      throwIfError(error)
      return data as BookingWithRelations[]
    },
  })
}
