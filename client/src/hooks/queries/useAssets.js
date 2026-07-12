import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { queryKeys } from '@/config/queryKeys';
import { DEFAULT_PAGE_SIZE } from '@/config/constants';

/**
 * Fetch assets with optional filters and pagination.
 *
 * @param {{
 *   status?: string,
 *   categoryId?: string,
 *   departmentId?: string,
 *   condition?: string,
 *   isBookable?: boolean,
 *   search?: string,
 *   page?: number,
 *   pageSize?: number,
 * }} [filters={}]
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useAssets(filters = {}) {
  return useQuery({
    queryKey: queryKeys.assets.list(filters),
    queryFn: async () => {
      const page = filters.page ?? 0;
      const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
      const from = page * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('assets')
        .select(
          `
          *,
          category:asset_categories ( id, name ),
          department:departments ( id, name ),
          registered_by_user:users!assets_registered_by_fkey ( id, name )
        `,
          { count: 'exact' },
        )
        .order('created_at', { ascending: false })
        .range(from, to);

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      if (filters.departmentId) {
        query = query.eq('department_id', filters.departmentId);
      }

      if (filters.condition) {
        query = query.eq('condition', filters.condition);
      }

      if (filters.isBookable !== undefined) {
        query = query.eq('is_bookable', filters.isBookable);
      }

      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,asset_tag.ilike.%${filters.search}%,serial_number.ilike.%${filters.search}%`,
        );
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { data, count, page, pageSize };
    },
  });
}

/**
 * Fetch a single asset by ID with full details.
 *
 * @param {string} id
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useAsset(id) {
  return useQuery({
    queryKey: queryKeys.assets.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assets')
        .select(`
          *,
          category:asset_categories ( id, name, custom_fields_schema ),
          department:departments ( id, name ),
          registered_by_user:users!assets_registered_by_fkey ( id, name, email ),
          documents:asset_documents ( id, file_name, file_url, file_type, file_size, created_at ),
          allocations (
            id, status, created_at, expected_return_date, actual_return_date, return_notes, condition_on_return,
            holder:users!allocations_allocated_to_user_id_fkey ( id, name ),
            holder_dept:departments!allocations_allocated_to_dept_id_fkey ( id, name ),
            allocated_by:users!allocations_allocated_by_id_fkey ( id, name )
          ),
          maintenance_requests (
            id, priority, status, description, resolution_notes, created_at, resolved_at,
            raised_by:users!maintenance_requests_raised_by_id_fkey ( id, name ),
            technician:users!maintenance_requests_assigned_technician_id_fkey ( id, name )
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
