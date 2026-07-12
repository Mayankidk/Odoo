import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { queryKeys } from '@/config/queryKeys';

/**
 * Mutation to raise a new maintenance request.
 */
export function useRaiseMaintenanceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assetId, description, priority }) => {
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
            description: description,
            priority: priority,
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
 * Sets request status to 'approved' and marks asset status as 'under_maintenance'.
 */
export function useApproveMaintenanceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, assetId }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Update the request status
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

      // 2. Update the asset status
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
 */
export function useRejectMaintenanceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, resolutionNotes }) => {
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
 */
export function useAssignTechnician() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, technicianId }) => {
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
 * Sets status to 'resolved', updates resolution notes, and sets asset status back to 'available'.
 */
export function useResolveMaintenanceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, assetId, resolutionNotes }) => {
      // 1. Update the maintenance request record
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

      // 2. Return the asset back to available status
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
