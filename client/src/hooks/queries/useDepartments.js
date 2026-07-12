import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { queryKeys } from '@/config/queryKeys';
import { mockDepartments, delay } from '@/config/mockData';

const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';

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
      if (useMock) {
        await delay();
        let list = [...mockDepartments];
        if (filters.status) {
          list = list.filter((d) => d.status === filters.status);
        }
        if (filters.search) {
          list = list.filter((d) =>
            d.name.toLowerCase().includes(filters.search.toLowerCase()),
          );
        }
        return list.map((d) => ({
          ...d,
          head: { id: d.department_head_id, name: d.department_head_id === 'emp-2' ? 'Mayank Kumar' : 'Other Head', email: 'head@assetflow.com' },
          parent: d.parent_department_id ? { id: d.parent_department_id, name: 'Parent Dept' } : null,
        }));
      }

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
      if (useMock) {
        await delay();
        const dept = mockDepartments.find((d) => d.id === id);
        if (!dept) throw new Error('Department not found');
        return {
          ...dept,
          head: { id: dept.department_head_id, name: 'Mayank Kumar', email: 'mayank@assetflow.com' },
          parent: dept.parent_department_id ? { id: dept.parent_department_id, name: 'Parent Dept' } : null,
          employees: [],
        };
      }

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

