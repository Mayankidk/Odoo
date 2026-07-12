import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { queryKeys } from '@/config/queryKeys';
import { addMockAllocation, returnMockAsset, addMockTransferRequest, approveMockTransfer, rejectMockTransfer, delay } from '@/config/mockData';

const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';

/**
 * Mutation to allocate an asset using the RPC function `allocate_asset`.
 */
export function useAllocateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assetId,
      userId = null,
      departmentId = null,
      expectedReturnDate = null,
    }) => {
      if (useMock) {
        await delay();
        return addMockAllocation({
          asset_id: assetId,
          allocated_to_user_id: userId,
          allocated_to_dept_id: departmentId,
          expected_return_date: expectedReturnDate,
          allocated_by_id: 'emp-2',
        });
      }

      const { data, error } = await supabase.rpc('allocate_asset', {
        p_asset_id: assetId,
        p_user_id: userId,
        p_department_id: departmentId,
        p_expected_return_date: expectedReturnDate,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allocations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      if (data?.asset_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.assets.detail(data.asset_id),
        });
      }
    },
  });
}

/**
 * Mutation to return an allocated asset.
 */
export function useReturnAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ allocationId, conditionOnReturn, returnNotes }) => {
      if (useMock) {
        await delay();
        return returnMockAsset(allocationId, conditionOnReturn, returnNotes);
      }

      const { data: allocation, error: fetchErr } = await supabase
        .from('allocations')
        .select('asset_id')
        .eq('id', allocationId)
        .single();

      if (fetchErr) throw fetchErr;

      const { data: updatedAllocation, error: allocErr } = await supabase
        .from('allocations')
        .update({
          status: 'returned',
          actual_return_date: new Date().toISOString().split('T')[0],
          condition_on_return: conditionOnReturn,
          return_notes: returnNotes,
        })
        .eq('id', allocationId)
        .select()
        .single();

      if (allocErr) throw allocErr;

      const { error: assetErr } = await supabase
        .from('assets')
        .update({ status: 'available' })
        .eq('id', allocation.asset_id);

      if (assetErr) throw assetErr;

      return updatedAllocation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allocations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      if (data?.asset_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.assets.detail(data.asset_id),
        });
      }
    },
  });
}

/**
 * Mutation to submit a transfer request.
 */
export function useCreateTransferRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ allocationId, reason }) => {
      if (useMock) {
        await delay();
        return addMockTransferRequest({
          allocation_id: allocationId,
          requested_by_id: 'emp-2',
          reason,
        });
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('transfer_requests')
        .insert([
          {
            allocation_id: allocationId,
            requested_by_id: user.id,
            reason: reason,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transferRequests.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      if (data?.allocation_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.allocations.detail(data.allocation_id),
        });
      }
    },
  });
}

/**
 * Mutation to approve a transfer request.
 */
export function useApproveTransferRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId) => {
      if (useMock) {
        await delay();
        return approveMockTransfer(requestId, 'emp-1');
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: request, error: reqErr } = await supabase
        .from('transfer_requests')
        .select(
          `
          *,
          allocation:allocations (
            id,
            asset_id
          )
        `,
        )
        .eq('id', requestId)
        .single();

      if (reqErr) throw reqErr;
      if (request.status !== 'pending') {
        throw new Error('Transfer request is not pending');
      }

      const { error: updateReqErr } = await supabase
        .from('transfer_requests')
        .update({
          status: 'approved',
          approved_by_id: user.id,
        })
        .eq('id', requestId);

      if (updateReqErr) throw updateReqErr;

      const { error: oldAllocErr } = await supabase
        .from('allocations')
        .update({
          status: 'transferred',
          actual_return_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', request.allocation_id);

      if (oldAllocErr) throw oldAllocErr;

      const { data: newAlloc, error: newAllocErr } = await supabase
        .from('allocations')
        .insert([
          {
            asset_id: request.allocation.asset_id,
            allocated_to_user_id: request.requested_by_id,
            allocated_by_id: user.id,
            status: 'active',
          },
        ])
        .select()
        .single();

      if (newAllocErr) throw newAllocErr;

      return { request, newAlloc };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transferRequests.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.allocations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      if (data?.newAlloc?.asset_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.assets.detail(data.newAlloc.asset_id),
        });
      }
    },
  });
}

/**
 * Mutation to reject a transfer request.
 */
export function useRejectTransferRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, rejectionReason }) => {
      if (useMock) {
        await delay();
        return rejectMockTransfer(requestId, 'emp-1', rejectionReason);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('transfer_requests')
        .update({
          status: 'rejected',
          approved_by_id: user.id,
          rejection_reason: rejectionReason,
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transferRequests.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      if (data?.allocation_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.allocations.detail(data.allocation_id),
        });
      }
    },
  });
}

