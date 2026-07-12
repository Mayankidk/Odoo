import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { queryKeys } from '@/config/queryKeys';

/**
 * Fetch all departments with optional filters.
 *
 * @param {{ status?: string, search?: string }} [filters={}]
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useDepartments(filters = {}) {
  return useQuery({
    queryKey: queryKeys.departments.list(filters),
    queryFn: async () => {
      let query = supabase
        .from('departments')
        .select(`
          *,
          head:users!departments_department_head_id_fkey ( id, name, email ),
          parent:departments!departments_parent_department_id_fkey ( id, name )
        `)
        .order('name');

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Fetch a single department by ID.
 *
 * @param {string} id
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useDepartment(id) {
  return useQuery({
    queryKey: queryKeys.departments.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select(`
          *,
          head:users!departments_department_head_id_fkey ( id, name, email ),
          parent:departments!departments_parent_department_id_fkey ( id, name ),
          employees:users!users_department_id_fkey ( id, name, email, role, status )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}
