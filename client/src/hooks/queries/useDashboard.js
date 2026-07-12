import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { queryKeys } from '@/config/queryKeys';
import { mockDashboardKPIs, mockAllocations, mockAssets, mockEmployees, delay } from '@/config/mockData';

const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';

/**
 * Fetch dashboard KPIs using the `get_dashboard_kpis` RPC.
 *
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useDashboardKPIs() {
  return useQuery({
    queryKey: queryKeys.dashboard.kpis(),
    queryFn: async () => {
      if (useMock) {
        await delay();
        return mockDashboardKPIs;
      }

      const { data, error } = await supabase.rpc('get_dashboard_kpis');
      if (error) throw error;
      return data;
    },
    refetchInterval: 60_000,
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
      if (useMock) {
        await delay();
        // Since mock data is static, we can return empty or simulate one overdue allocation
        const today = new Date().toISOString().split('T')[0];
        const overdue = mockAllocations
          .filter((al) => al.status === 'active' && al.expected_return_date < today)
          .map((al) => ({
            ...al,
            asset: mockAssets.find((a) => a.id === al.asset_id) || null,
            holder: mockEmployees.find((e) => e.id === al.allocated_to_user_id) || null,
            holder_dept: null,
          }));
        return overdue;
      }

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
      if (useMock) {
        await delay();
        return {
          transfers: [
            {
              id: 'trans-1',
              reason: 'Need this MacBook for high-intensity processing tests.',
              created_at: '2026-07-11T14:30:00Z',
              requested_by: { id: 'emp-2', name: 'Mayank Kumar' },
              allocation: { asset: { id: 'asset-1', asset_tag: 'AF-0001', name: 'MacBook Pro 16" M3' } },
            },
          ],
          maintenance: [],
        };
      }

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

