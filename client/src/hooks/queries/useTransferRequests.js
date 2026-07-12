import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { queryKeys } from '@/config/queryKeys';
import { mockTransferRequests, mockAllocations, mockAssets, mockEmployees, delay } from '@/config/mockData';

const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';

/**
 * Fetch transfer requests with optional filters.
 *
 * @param {{ status?: string, allocationId?: string }} [filters={}]
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useTransferRequests(filters = {}) {
  return useQuery({
    queryKey: queryKeys.transferRequests.list(filters),
    queryFn: async () => {
      if (useMock) {
        await delay();
        let list = [...mockTransferRequests];
        if (filters.status) {
          list = list.filter((tr) => tr.status === filters.status);
        }
        if (filters.allocationId) {
          list = list.filter((tr) => tr.allocation_id === filters.allocationId);
        }
        return list.map((tr) => {
          const allocation = mockAllocations.find((al) => al.id === tr.allocation_id) || null;
          return {
            ...tr,
            allocation: allocation
              ? {
                  ...allocation,
                  asset: mockAssets.find((a) => a.id === allocation.asset_id) || null,
                  holder: mockEmployees.find((e) => e.id === allocation.allocated_to_user_id) || null,
                  holder_dept: null,
                }
              : null,
            requested_by: mockEmployees.find((e) => e.id === tr.requested_by_id) || null,
            approved_by: mockEmployees.find((e) => e.id === tr.approved_by_id) || null,
          };
        });
      }

      let query = supabase
        .from('transfer_requests')
        .select(`
          *,
          allocation:allocations (
            id,
            asset:assets ( id, asset_tag, name ),
            holder:users!allocations_allocated_to_user_id_fkey ( id, name ),
            holder_dept:departments!allocations_allocated_to_dept_id_fkey ( id, name )
          ),
          requested_by:users!transfer_requests_requested_by_id_fkey ( id, name, email ),
          approved_by:users!transfer_requests_approved_by_id_fkey ( id, name )
        `)
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.allocationId) {
        query = query.eq('allocation_id', filters.allocationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

