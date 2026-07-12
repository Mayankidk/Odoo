import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { queryKeys } from '@/config/queryKeys';

/**
 * Mutation to book a resource using the `book_resource` RPC.
 */
export function useBookResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ resourceId, startTime, endTime, purpose }) => {
      const { data, error } = await supabase.rpc('book_resource', {
        p_resource_id: resourceId,
        p_start_time: startTime,
        p_end_time: endTime,
        p_purpose: purpose,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      if (data?.resource_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.assets.detail(data.resource_id),
        });
      }
    },
  });
}

/**
 * Mutation to cancel an existing booking.
 */
export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId) => {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      if (data?.resource_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.assets.detail(data.resource_id),
        });
      }
    },
  });
}
