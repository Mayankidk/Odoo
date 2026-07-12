import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { queryKeys } from '@/config/queryKeys';
import { mockMaintenanceRequests, mockAssets, mockEmployees, mockCategories, mockDepartments, delay } from '@/config/mockData';

const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';

/**
 * Fetch maintenance requests with optional filters.
 *
 * @param {{
 *   status?: string,
 *   priority?: string,
 *   assetId?: string,
 *   raisedById?: string,
 *   technicianId?: string,
 * }} [filters={}]
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useMaintenanceRequests(filters = {}) {
  return useQuery({
    queryKey: queryKeys.maintenance.list(filters),
    queryFn: async () => {
      if (useMock) {
        await delay();
        let list = [...mockMaintenanceRequests];
        if (filters.status) {
          list = list.filter((m) => m.status === filters.status);
        }
        if (filters.priority) {
          list = list.filter((m) => m.priority === filters.priority);
        }
        if (filters.assetId) {
          list = list.filter((m) => m.asset_id === filters.assetId);
        }
        if (filters.raisedById) {
          list = list.filter((m) => m.raised_by_id === filters.raisedById);
        }
        if (filters.technicianId) {
          list = list.filter((m) => m.assigned_technician_id === filters.technicianId);
        }
        return list.map((m) => ({
          ...m,
          asset: mockAssets.find((a) => a.id === m.asset_id) || null,
          raised_by: mockEmployees.find((e) => e.id === m.raised_by_id) || null,
          approved_by: mockEmployees.find((e) => e.id === m.approved_by_id) || null,
          technician: mockEmployees.find((e) => e.id === m.assigned_technician_id) || null,
        }));
      }

      let query = supabase
        .from('maintenance_requests')
        .select(`
          *,
          asset:assets ( id, asset_tag, name, status ),
          raised_by:users!maintenance_requests_raised_by_id_fkey ( id, name, email ),
          approved_by:users!maintenance_requests_approved_by_id_fkey ( id, name ),
          technician:users!maintenance_requests_assigned_technician_id_fkey ( id, name )
        `)
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters.assetId) {
        query = query.eq('asset_id', filters.assetId);
      }

      if (filters.raisedById) {
        query = query.eq('raised_by_id', filters.raisedById);
      }

      if (filters.technicianId) {
        query = query.eq('assigned_technician_id', filters.technicianId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Fetch a single maintenance request by ID.
 *
 * @param {string} id
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useMaintenanceRequest(id) {
  return useQuery({
    queryKey: queryKeys.maintenance.detail(id),
    queryFn: async () => {
      if (useMock) {
        await delay();
        const m = mockMaintenanceRequests.find((mr) => mr.id === id);
        if (!m) throw new Error('Request not found');
        const asset = mockAssets.find((a) => a.id === m.asset_id) || null;
        return {
          ...m,
          asset: asset
            ? {
                ...asset,
                category: mockCategories.find((c) => c.id === asset.category_id) || null,
                department: mockDepartments.find((d) => d.id === asset.department_id) || null,
              }
            : null,
          raised_by: mockEmployees.find((e) => e.id === m.raised_by_id) || null,
          approved_by: mockEmployees.find((e) => e.id === m.approved_by_id) || null,
          technician: mockEmployees.find((e) => e.id === m.assigned_technician_id) || null,
        };
      }

      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          asset:assets (
            id, asset_tag, name, status, location,
            category:asset_categories ( id, name ),
            department:departments ( id, name )
          ),
          raised_by:users!maintenance_requests_raised_by_id_fkey ( id, name, email ),
          approved_by:users!maintenance_requests_approved_by_id_fkey ( id, name ),
          technician:users!maintenance_requests_assigned_technician_id_fkey ( id, name, email )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

