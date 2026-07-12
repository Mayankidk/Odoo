import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { throwIfError } from "@/lib/errors"
import { queryKeys } from "@/lib/queryKeys"
import { supabase } from "@/lib/supabase"

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await (supabase
        .from("notifications") as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      throwIfError(error)
      return data
    },
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await (supabase
        .from("notifications") as any)
        .update({ is_read: true })
        .eq("id", id)
        .select()
        .single()

      throwIfError(error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const { data, error } = await (supabase
        .from("notifications") as any)
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false)

      throwIfError(error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
    },
  })
}
