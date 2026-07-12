import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { queryKeys } from '@/config/queryKeys';
import { mockAllocations, mockAssets, mockEmployees, mockDepartments, mockTransferRequests, delay } from '@/config/mockData';

const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';

/**
 * Fetch allocations with optional filters.
 *
 * @param {{
 *   status?: string,
 *   assetId?: string,
 *   userId?: string,
 *   departmentId?: string,
 *   overdue?: boolean,
 * }} [filters={}]
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useAllocations(filters = {}) {
  return useQuery({
    queryKey: queryKeys.allocations.list(filters),
    queryFn: async () => {
      if (useMock) {
        await delay();
        let list = [...mockAllocations];
        if (filters.status) {
          list = list.filter((al) => al.status === filters.status);
        }
        if (filters.assetId) {
          list = list.filter((al) => al.asset_id === filters.assetId);
        }
        if (filters.userId) {
          list = list.filter((al) => al.allocated_to_user_id === filters.userId);
        }
        if (filters.departmentId) {
          list = list.filter((al) => al.allocated_to_dept_id === filters.departmentId);
        }
        if (filters.overdue) {
          const today = new Date().toISOString().split('T')[0];
          list = list.filter(
            (al) =>
              al.status === 'active' &&
              al.expected_return_date &&
              al.expected_return_date < today,
          );
        }
        return list.map((al) => ({
          ...al,
          asset: mockAssets.find((a) => a.id === al.asset_id) || null,
          holder: mockEmployees.find((e) => e.id === al.allocated_to_user_id) || null,
          holder_dept: mockDepartments.find((d) => d.id === al.allocated_to_dept_id) || null,
          allocated_by: mockEmployees.find((e) => e.id === al.allocated_by_id) || null,
        }));
      }

      let query = supabase
        .from('allocations')
        .select(`
          *,
          asset:assets ( id, asset_tag, name, status ),
          holder:users!allocations_allocated_to_user_id_fkey ( id, name, email ),
          holder_dept:departments!allocations_allocated_to_dept_id_fkey ( id, name ),
          allocated_by:users!allocations_allocated_by_id_fkey ( id, name )
        `)
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.assetId) {
        query = query.eq('asset_id', filters.assetId);
      }

      if (filters.userId) {
        query = query.eq('allocated_to_user_id', filters.userId);
      }

      if (filters.departmentId) {
        query = query.eq('allocated_to_dept_id', filters.departmentId);
      }

      if (filters.overdue) {
        query = query
          .is('actual_return_date', null)
          .lt('expected_return_date', new Date().toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Fetch a single allocation by ID.
 *
 * @param {string} id
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useAllocation(id) {
  return useQuery({
    queryKey: queryKeys.allocations.detail(id),
    queryFn: async () => {
      if (useMock) {
        await delay();
        const al = mockAllocations.find((a) => a.id === id);
        if (!al) throw new Error('Allocation not found');
        return {
          ...al,
          asset: mockAssets.find((a) => a.id === al.asset_id) || null,
          holder: mockEmployees.find((e) => e.id === al.allocated_to_user_id) || null,
          holder_dept: mockDepartments.find((d) => d.id === al.allocated_to_dept_id) || null,
          allocated_by: mockEmployees.find((e) => e.id === al.allocated_by_id) || null,
          transfer_requests: mockTransferRequests.filter((t) => t.allocation_id === id),
        };
      }

      const { data, error } = await supabase
        .from('allocations')
        .select(`
          *,
          asset:assets ( id, asset_tag, name, status, category:asset_categories ( id, name ) ),
          holder:users!allocations_allocated_to_user_id_fkey ( id, name, email ),
          holder_dept:departments!allocations_allocated_to_dept_id_fkey ( id, name ),
          allocated_by:users!allocations_allocated_by_id_fkey ( id, name ),
          transfer_requests (
            id, status, reason, rejection_reason, created_at,
            requested_by:users!transfer_requests_requested_by_id_fkey ( id, name ),
            approved_by:users!transfer_requests_approved_by_id_fkey ( id, name )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

/**
 * Fetch allocations for the currently logged-in user ("My Assets").
 *
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useMyAllocations() {
  return useQuery({
    queryKey: queryKeys.allocations.list({ scope: 'mine' }),
    queryFn: async () => {
      if (useMock) {
        await delay();
        // Return allocations for emp-4 Jane Doe (our default simulated employee)
        const list = mockAllocations.filter(
          (al) => al.allocated_to_user_id === 'emp-4' && al.status === 'active',
        );
        return list.map((al) => ({
          ...al,
          asset: mockAssets.find((a) => a.id === al.asset_id) || null,
          allocated_by: mockEmployees.find((e) => e.id === al.allocated_by_id) || null,
        }));
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('allocations')
        .select(`
          *,
          asset:assets ( id, asset_tag, name, status, category:asset_categories ( id, name ) ),
          allocated_by:users!allocations_allocated_by_id_fkey ( id, name )
        `)
        .eq('allocated_to_user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

