import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { queryKeys } from '@/config/queryKeys';

/**
 * Mutation to create a new audit cycle.
 * Initiates the cycle and generates corresponding audit items for all assets in scope.
 */
export function useCreateAuditCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, scopeType, scopeId = null, scopeLocation = null, startDate, endDate }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Insert the audit cycle
      const { data: cycle, error: cycleErr } = await supabase
        .from('audit_cycles')
        .insert([
          {
            name,
            scope_type: scopeType,
            scope_id: scopeId,
            scope_location: scopeLocation,
            start_date: startDate,
            end_date: endDate,
            status: 'planned',
            created_by_id: user.id,
          },
        ])
        .select()
        .single();

      if (cycleErr) throw cycleErr;

      // 2. Query all assets that match the scope
      let assetQuery = supabase.from('assets').select('id');
      if (scopeType === 'department') {
        assetQuery = assetQuery.eq('department_id', scopeId);
      } else if (scopeType === 'location') {
        assetQuery = assetQuery.eq('location', scopeLocation);
      }

      const { data: assets, error: assetErr } = await assetQuery;
      if (assetErr) throw assetErr;

      // 3. Insert audit items for all matching assets (verification_status defaults to 'pending')
      if (assets && assets.length > 0) {
        const auditItems = assets.map((asset) => ({
          audit_cycle_id: cycle.id,
          asset_id: asset.id,
          verification_status: 'pending',
        }));

        const { error: itemsErr } = await supabase
          .from('audit_items')
          .insert(auditItems);

        if (itemsErr) throw itemsErr;
      }

      return cycle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auditCycles.all });
    },
  });
}

/**
 * Mutation to assign auditors to an audit cycle.
 */
export function useAssignAuditors() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ auditCycleId, auditorIds }) => {
      // 1. Delete existing auditors for this cycle
      const { error: deleteErr } = await supabase
        .from('audit_cycle_auditors')
        .delete()
        .eq('audit_cycle_id', auditCycleId);

      if (deleteErr) throw deleteErr;

      // 2. Insert new auditor associations
      if (auditorIds && auditorIds.length > 0) {
        const assignments = auditorIds.map((auditorId) => ({
          audit_cycle_id: auditCycleId,
          auditor_id: auditorId,
        }));

        const { data, error: insertErr } = await supabase
          .from('audit_cycle_auditors')
          .insert(assignments)
          .select();

        if (insertErr) throw insertErr;
        return data;
      }

      return [];
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auditCycles.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.auditCycles.detail(variables.auditCycleId),
      });
    },
  });
}

/**
 * Mutation to verify/audit an individual asset.
 * Updates verification status and logs who verified it and when.
 * If status is 'damaged', updates the asset's condition to 'damaged'.
 */
export function useVerifyAuditItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ auditItemId, assetId, verificationStatus, notes }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Update the audit item status
      const { data: item, error: itemErr } = await supabase
        .from('audit_items')
        .update({
          verification_status: verificationStatus,
          notes: notes,
          verified_by_id: user.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', auditItemId)
        .select()
        .single();

      if (itemErr) throw itemErr;

      // 2. If the asset is verified as damaged, update its condition in the assets table
      if (verificationStatus === 'damaged') {
        const { error: assetErr } = await supabase
          .from('assets')
          .update({ condition: 'damaged' })
          .eq('id', assetId);

        if (assetErr) throw assetErr;
      }

      return item;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auditItems.all });
      if (data?.audit_cycle_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.auditCycles.detail(data.audit_cycle_id),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
      if (data?.asset_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.assets.detail(data.asset_id),
        });
      }
    },
  });
}

/**
 * Mutation to update an audit cycle's status (planned, in_progress, completed).
 * If status is updated to 'completed', missing assets are updated to 'lost' status.
 */
export function useUpdateAuditCycleStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ auditCycleId, status }) => {
      // 1. Update the audit cycle status
      const { data: cycle, error: cycleErr } = await supabase
        .from('audit_cycles')
        .update({ status })
        .eq('id', auditCycleId)
        .select()
        .single();

      if (cycleErr) throw cycleErr;

      // 2. Cascade changes if cycle is completed
      if (status === 'completed') {
        // Find all missing items in this cycle
        const { data: missingItems, error: itemsErr } = await supabase
          .from('audit_items')
          .select('asset_id')
          .eq('audit_cycle_id', auditCycleId)
          .eq('verification_status', 'missing');

        if (itemsErr) throw itemsErr;

        if (missingItems && missingItems.length > 0) {
          const assetIds = missingItems.map((item) => item.asset_id);

          // Update asset status to 'lost'
          const { error: assetsErr } = await supabase
            .from('assets')
            .update({ status: 'lost' })
            .in('id', assetIds);

          if (assetsErr) throw assetsErr;
        }
      }

      return cycle;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auditCycles.all });
      if (data?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.auditCycles.detail(data.id),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}
