import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { queryKeys } from '@/config/queryKeys';

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
 * Updates allocation status to 'returned' and asset status back to 'available'.
 */
export function useReturnAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ allocationId, conditionOnReturn, returnNotes }) => {
      // 1. Get the allocation details to find the asset_id
      const { data: allocation, error: fetchErr } = await supabase
        .from('allocations')
        .select('asset_id')
        .eq('id', allocationId)
        .single();

      if (fetchErr) throw fetchErr;

      // 2. Update the allocation record
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

      // 3. Update the asset status back to 'available'
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
 * Resolves the request, marks old allocation 'transferred', and spawns a new allocation.
 */
export function useApproveTransferRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Fetch the request details
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

      // 2. Mark the request as approved
      const { error: updateReqErr } = await supabase
        .from('transfer_requests')
        .update({
          status: 'approved',
          approved_by_id: user.id,
        })
        .eq('id', requestId);

      if (updateReqErr) throw updateReqErr;

      // 3. Complete/Close the old allocation as 'transferred'
      const { error: oldAllocErr } = await supabase
        .from('allocations')
        .update({
          status: 'transferred',
          actual_return_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', request.allocation_id);

      if (oldAllocErr) throw oldAllocErr;

      // 4. Create the new allocation to the requesting user
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
