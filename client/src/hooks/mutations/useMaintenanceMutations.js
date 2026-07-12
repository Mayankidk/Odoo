import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { queryKeys } from '@/config/queryKeys';
import { addMockMaintenanceRequest, updateMockMaintenanceStatus, delay } from '@/config/mockData';

const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';

/**
 * Mutation to raise a new maintenance request.
 *
 * @param {{ assetId: string, description: string, priority: 'low'|'medium'|'high'|'critical' }} params
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useRaiseMaintenanceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assetId, description, priority }) => {
      if (useMock) {
        await delay();
        return addMockMaintenanceRequest({
          asset_id: assetId,
          raised_by_id: 'emp-4',
          description,
          priority,
        });
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('maintenance_requests')
        .insert([
          {
            asset_id: assetId,
            raised_by_id: user.id,
            description,
            priority,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.all });
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
 * Mutation to approve a maintenance request.
 *
 * @param {{ requestId: string, assetId: string }} params
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useApproveMaintenanceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, assetId }) => {
      if (useMock) {
        await delay();
        return updateMockMaintenanceStatus(requestId, 'approved', {
          approved_by_id: 'emp-2',
        });
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: request, error: reqErr } = await supabase
        .from('maintenance_requests')
        .update({
          status: 'approved',
          approved_by_id: user.id,
        })
        .eq('id', requestId)
        .select()
        .single();

      if (reqErr) throw reqErr;

      const { error: assetErr } = await supabase
        .from('assets')
        .update({ status: 'under_maintenance' })
        .eq('id', assetId);

      if (assetErr) throw assetErr;

      return request;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.all });
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
 * Mutation to reject a maintenance request.
 *
 * @param {{ requestId: string, resolutionNotes?: string }} params
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useRejectMaintenanceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, resolutionNotes }) => {
      if (useMock) {
        await delay();
        return updateMockMaintenanceStatus(requestId, 'rejected', {
          approved_by_id: 'emp-2',
          resolution_notes: resolutionNotes,
        });
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('maintenance_requests')
        .update({
          status: 'rejected',
          approved_by_id: user.id,
          resolution_notes: resolutionNotes,
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.all });
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
 * Mutation to assign a technician to a maintenance request.
 *
 * @param {{ requestId: string, technicianId: string }} params
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useAssignTechnician() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, technicianId }) => {
      if (useMock) {
        await delay();
        return updateMockMaintenanceStatus(requestId, 'assigned', {
          assigned_technician_id: technicianId,
        });
      }

      const { data, error } = await supabase
        .from('maintenance_requests')
        .update({
          status: 'assigned',
          assigned_technician_id: technicianId,
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.all });
      if (data?.asset_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.assets.detail(data.asset_id),
        });
      }
    },
  });
}

/**
 * Mutation to mark a maintenance request as resolved.
 *
 * @param {{ requestId: string, assetId: string, resolutionNotes?: string }} params
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useResolveMaintenanceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, assetId, resolutionNotes }) => {
      if (useMock) {
        await delay();
        return updateMockMaintenanceStatus(requestId, 'resolved', {
          resolution_notes: resolutionNotes,
          resolved_at: new Date().toISOString(),
        });
      }

      const { data: request, error: reqErr } = await supabase
        .from('maintenance_requests')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolution_notes: resolutionNotes,
        })
        .eq('id', requestId)
        .select()
        .single();

      if (reqErr) throw reqErr;

      const { error: assetErr } = await supabase
        .from('assets')
        .update({ status: 'available' })
        .eq('id', assetId);

      if (assetErr) throw assetErr;

      return request;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.all });
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
