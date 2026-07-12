import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { queryKeys } from '@/config/queryKeys';

/**
 * Fetch notifications for the current user.
 *
 * @param {{ unreadOnly?: boolean }} [filters={}]
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useNotifications(filters = {}) {
  return useQuery({
    queryKey: queryKeys.notifications.list(filters),
    queryFn: async () => {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (filters.unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    // Poll every 30s to keep the bell icon count fresh
    refetchInterval: 30_000,
  });
}

/**
 * Fetch the count of unread notifications (for the header badge).
 *
 * @returns {import('@tanstack/react-query').UseQueryResult<number>}
 */
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 30_000,
  });
}
