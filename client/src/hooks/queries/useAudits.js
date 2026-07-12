import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { queryKeys } from '@/config/queryKeys';

/**
 * Fetch audit cycles with optional filters.
 *
 * @param {{ status?: string, scopeType?: string }} [filters={}]
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useAuditCycles(filters = {}) {
  return useQuery({
    queryKey: queryKeys.auditCycles.list(filters),
    queryFn: async () => {
      let query = supabase
        .from('audit_cycles')
        .select(`
          *,
          scope_department:departments!audit_cycles_scope_id_fkey ( id, name ),
          created_by:users!audit_cycles_created_by_id_fkey ( id, name ),
          auditors:audit_cycle_auditors (
            id,
            auditor:users!audit_cycle_auditors_auditor_id_fkey ( id, name, email )
          )
        `)
        .order('start_date', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.scopeType) {
        query = query.eq('scope_type', filters.scopeType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Fetch a single audit cycle by ID with items.
 *
 * @param {string} id
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useAuditCycle(id) {
  return useQuery({
    queryKey: queryKeys.auditCycles.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_cycles')
        .select(`
          *,
          scope_department:departments!audit_cycles_scope_id_fkey ( id, name ),
          created_by:users!audit_cycles_created_by_id_fkey ( id, name, email ),
          auditors:audit_cycle_auditors (
            id,
            auditor:users!audit_cycle_auditors_auditor_id_fkey ( id, name, email )
          ),
          items:audit_items (
            id, verification_status, notes, verified_at,
            asset:assets ( id, asset_tag, name, status, location ),
            verified_by:users!audit_items_verified_by_id_fkey ( id, name )
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
 * Fetch audit items for a specific cycle.
 *
 * @param {string} cycleId
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useAuditItems(cycleId) {
  return useQuery({
    queryKey: queryKeys.auditItems.list(cycleId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_items')
        .select(`
          *,
          asset:assets ( id, asset_tag, name, status, location, serial_number ),
          verified_by:users!audit_items_verified_by_id_fkey ( id, name )
        `)
        .eq('audit_cycle_id', cycleId)
        .order('created_at');

      if (error) throw error;
      return data;
    },
    enabled: !!cycleId,
  });
}
