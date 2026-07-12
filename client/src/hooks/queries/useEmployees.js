import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { queryKeys } from '@/config/queryKeys';
import { mockEmployees, mockDepartments, delay } from '@/config/mockData';

const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';

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
      if (useMock) {
        await delay();
        let list = [...mockEmployees];
        if (filters.status) {
          list = list.filter((e) => e.status === filters.status);
        }
        if (filters.role) {
          list = list.filter((e) => e.role === filters.role);
        }
        if (filters.departmentId) {
          list = list.filter((e) => e.department_id === filters.departmentId);
        }
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          list = list.filter(
            (e) =>
              e.name.toLowerCase().includes(searchLower) ||
              e.email.toLowerCase().includes(searchLower),
          );
        }
        return list.map((e) => ({
          ...e,
          department: mockDepartments.find((d) => d.id === e.department_id) || null,
        }));
      }

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
      if (useMock) {
        await delay();
        const emp = mockEmployees.find((e) => e.id === id);
        if (!emp) throw new Error('Employee not found');
        return {
          ...emp,
          department: mockDepartments.find((d) => d.id === emp.department_id) || null,
        };
      }

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

