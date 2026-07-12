import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { queryKeys } from '@/config/queryKeys';
import { mockAssets, mockAuditCycles, mockAuditItems, delay } from '@/config/mockData';

const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';

/**
 * Mutation to create a new audit cycle.
 * Initiates the cycle and generates corresponding audit items for all assets in scope.
 *
 * @param {{ name: string, scopeType: 'all'|'department'|'location', scopeId?: string, scopeLocation?: string, startDate: string, endDate: string }} params
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useCreateAuditCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, scopeType, scopeId = null, scopeLocation = null, startDate, endDate }) => {
      if (useMock) {
        await delay();
        const newCycle = {
          id: `audit-c-${Date.now()}`,
          name,
          scope_type: scopeType,
          scope_id: scopeId,
          scope_location: scopeLocation,
          start_date: startDate,
          end_date: endDate,
          status: 'planned',
          created_by_id: 'emp-1',
          created_at: new Date().toISOString(),
        };
        mockAuditCycles.push(newCycle);

        // Generate audit items for matching assets
        let scopedAssets = [...mockAssets];
        if (scopeType === 'department') {
          scopedAssets = scopedAssets.filter((a) => a.department_id === scopeId);
        } else if (scopeType === 'location') {
          scopedAssets = scopedAssets.filter((a) => a.location === scopeLocation);
        }

        scopedAssets.forEach((asset) => {
          mockAuditItems.push({
            id: `audit-i-${Date.now()}-${asset.id}`,
            audit_cycle_id: newCycle.id,
            asset_id: asset.id,
            verified_by_id: null,
            verification_status: 'pending',
            notes: null,
            verified_at: null,
            created_at: new Date().toISOString(),
          });
        });

        return newCycle;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

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

      let assetQuery = supabase.from('assets').select('id');
      if (scopeType === 'department') {
        assetQuery = assetQuery.eq('department_id', scopeId);
      } else if (scopeType === 'location') {
        assetQuery = assetQuery.eq('location', scopeLocation);
      }

      const { data: assets, error: assetErr } = await assetQuery;
      if (assetErr) throw assetErr;

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
 *
 * @param {{ auditCycleId: string, auditorIds: string[] }} params
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useAssignAuditors() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ auditCycleId, auditorIds }) => {
      if (useMock) {
        await delay();
        return auditorIds.map((id) => ({
          id: `auditor-assign-${Date.now()}-${id}`,
          audit_cycle_id: auditCycleId,
          auditor_id: id,
        }));
      }

      const { error: deleteErr } = await supabase
        .from('audit_cycle_auditors')
        .delete()
        .eq('audit_cycle_id', auditCycleId);

      if (deleteErr) throw deleteErr;

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
 *
 * @param {{ auditItemId: string, assetId: string, verificationStatus: 'verified'|'missing'|'damaged', notes?: string }} params
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useVerifyAuditItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ auditItemId, assetId, verificationStatus, notes }) => {
      if (useMock) {
        await delay();
        const index = mockAuditItems.findIndex((i) => i.id === auditItemId);
        if (index !== -1) {
          mockAuditItems[index] = {
            ...mockAuditItems[index],
            verification_status: verificationStatus,
            notes,
            verified_by_id: 'emp-2',
            verified_at: new Date().toISOString(),
          };

          if (verificationStatus === 'damaged') {
            const assetIdx = mockAssets.findIndex((a) => a.id === assetId);
            if (assetIdx !== -1) {
              mockAssets[assetIdx] = { ...mockAssets[assetIdx], condition: 'damaged' };
            }
          }

          return mockAuditItems[index];
        }
        throw new Error('Audit item not found');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: item, error: itemErr } = await supabase
        .from('audit_items')
        .update({
          verification_status: verificationStatus,
          notes,
          verified_by_id: user.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', auditItemId)
        .select()
        .single();

      if (itemErr) throw itemErr;

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
 * Mutation to update an audit cycle's status (planned → in_progress → completed).
 * If status is updated to 'completed', missing assets are marked 'lost'.
 *
 * @param {{ auditCycleId: string, status: 'planned'|'in_progress'|'completed' }} params
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useUpdateAuditCycleStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ auditCycleId, status }) => {
      if (useMock) {
        await delay();
        const cycleIdx = mockAuditCycles.findIndex((c) => c.id === auditCycleId);
        if (cycleIdx === -1) throw new Error('Audit cycle not found');

        mockAuditCycles[cycleIdx] = { ...mockAuditCycles[cycleIdx], status };

        if (status === 'completed') {
          const missingItems = mockAuditItems.filter(
            (i) => i.audit_cycle_id === auditCycleId && i.verification_status === 'missing',
          );
          missingItems.forEach((item) => {
            const assetIdx = mockAssets.findIndex((a) => a.id === item.asset_id);
            if (assetIdx !== -1) {
              mockAssets[assetIdx] = { ...mockAssets[assetIdx], status: 'lost' };
            }
          });
        }

        return mockAuditCycles[cycleIdx];
      }

      const { data: cycle, error: cycleErr } = await supabase
        .from('audit_cycles')
        .update({ status })
        .eq('id', auditCycleId)
        .select()
        .single();

      if (cycleErr) throw cycleErr;

      if (status === 'completed') {
        const { data: missingItems, error: itemsErr } = await supabase
          .from('audit_items')
          .select('asset_id')
          .eq('audit_cycle_id', auditCycleId)
          .eq('verification_status', 'missing');

        if (itemsErr) throw itemsErr;

        if (missingItems && missingItems.length > 0) {
          const assetIds = missingItems.map((item) => item.asset_id);

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
