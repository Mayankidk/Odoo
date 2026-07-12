import { useQuery } from "@tanstack/react-query"

import { throwIfError } from "@/lib/errors"
import { queryKeys } from "@/lib/queryKeys"
import { supabase } from "@/lib/supabase"

export function useBookings() {
  return useQuery({
    queryKey: queryKeys.bookings,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, resource:assets(asset_tag, name), booked_by:users(name)")
        .order("start_time", { ascending: true })

      throwIfError(error)
      return data
    },
  })
}
