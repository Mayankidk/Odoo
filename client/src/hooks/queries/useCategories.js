import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { queryKeys } from '@/config/queryKeys';
import { mockCategories, delay } from '@/config/mockData';

const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';

/**
 * Fetch all asset categories with optional filters.
 *
 * @param {{ status?: string, search?: string }} [filters={}]
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useCategories(filters = {}) {
  return useQuery({
    queryKey: queryKeys.categories.list(filters),
    queryFn: async () => {
      if (useMock) {
        await delay();
        let list = [...mockCategories];
        if (filters.status) {
          list = list.filter((c) => c.status === filters.status);
        }
        if (filters.search) {
          list = list.filter((c) =>
            c.name.toLowerCase().includes(filters.search.toLowerCase()),
          );
        }
        return list;
      }

      let query = supabase
        .from('asset_categories')
        .select('*')
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
 * Fetch a single category by ID.
 *
 * @param {string} id
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useCategory(id) {
  return useQuery({
    queryKey: queryKeys.categories.detail(id),
    queryFn: async () => {
      if (useMock) {
        await delay();
        const cat = mockCategories.find((c) => c.id === id);
        if (!cat) throw new Error('Category not found');
        return cat;
      }

      const { data, error } = await supabase
        .from('asset_categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

