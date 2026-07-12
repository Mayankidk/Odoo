import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { queryKeys } from '@/config/queryKeys';

/**
 * Fetch employees (users) with optional filters.
 *
 * @param {{
 *   status?: string,
 *   role?: string,
 *   departmentId?: string,
 *   search?: string,
 * }} [filters={}]
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useEmployees(filters = {}) {
  return useQuery({
    queryKey: queryKeys.employees.list(filters),
    queryFn: async () => {
      let query = supabase
        .from('users')
        .select(`
          *,
          department:departments ( id, name )
        `)
        .order('name');

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.role) {
        query = query.eq('role', filters.role);
      }

      if (filters.departmentId) {
        query = query.eq('department_id', filters.departmentId);
      }

      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`,
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Fetch a single employee by ID.
 *
 * @param {string} id
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useEmployee(id) {
  return useQuery({
    queryKey: queryKeys.employees.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          department:departments ( id, name )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}
