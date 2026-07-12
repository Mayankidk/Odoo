import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { queryKeys } from '@/config/queryKeys';

/**
 * Fetch dashboard KPIs using the `get_dashboard_kpis` RPC.
 * The RPC is role-aware — it scopes counts to the user's department for
 * non-admin roles.
 *
 * @returns {import('@tanstack/react-query').UseQueryResult<{
 *   assets_available: number,
 *   assets_allocated: number,
 *   maintenance_today: number,
 *   active_bookings: number,
 *   pending_transfers: number,
 *   upcoming_returns: number,
 *   overdue_returns: number,
 * }>}
 */
export function useDashboardKPIs() {
  return useQuery({
    queryKey: queryKeys.dashboard.kpis(),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_kpis');
      if (error) throw error;
      return data;
    },
    // Refresh every 60 seconds so counts stay current
    refetchInterval: 60_000,
    // Keep showing previous counts while refetching
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Fetch overdue returns for the dashboard panel.
 *
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useOverdueReturns() {
  return useQuery({
    queryKey: queryKeys.dashboard.overdueReturns(),
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('allocations')
        .select(`
          id, expected_return_date, created_at,
          asset:assets ( id, asset_tag, name ),
          holder:users!allocations_allocated_to_user_id_fkey ( id, name, email ),
          holder_dept:departments!allocations_allocated_to_dept_id_fkey ( id, name )
        `)
        .eq('status', 'active')
        .is('actual_return_date', null)
        .lt('expected_return_date', today)
        .order('expected_return_date');

      if (error) throw error;
      return data;
    },
    refetchInterval: 60_000,
  });
}

/**
 * Fetch items requiring managerial approval (transfers, maintenance).
 *
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function usePendingApprovals() {
  return useQuery({
    queryKey: queryKeys.dashboard.pendingApprovals(),
    queryFn: async () => {
      const [transfers, maintenance] = await Promise.all([
        supabase
          .from('transfer_requests')
          .select(`
            id, reason, created_at,
            requested_by:users!transfer_requests_requested_by_id_fkey ( id, name ),
            allocation:allocations (
              asset:assets ( id, asset_tag, name )
            )
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),

        supabase
          .from('maintenance_requests')
          .select(`
            id, description, priority, created_at,
            asset:assets ( id, asset_tag, name ),
            raised_by:users!maintenance_requests_raised_by_id_fkey ( id, name )
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
      ]);

      if (transfers.error) throw transfers.error;
      if (maintenance.error) throw maintenance.error;

      return {
        transfers: transfers.data,
        maintenance: maintenance.data,
      };
    },
    refetchInterval: 60_000,
  });
}
