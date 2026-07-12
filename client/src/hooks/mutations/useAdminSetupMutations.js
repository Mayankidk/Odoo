import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { queryKeys } from '@/config/queryKeys';
import { addMockDepartment, updateMockDepartment, addMockCategory, updateMockCategory, updateMockEmployee, delay } from '@/config/mockData';

const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';

/**
 * Mutation to create a new department.
 */
export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (departmentData) => {
      if (useMock) {
        await delay();
        return addMockDepartment(departmentData);
      }

      const { data, error } = await supabase
        .from('departments')
        .insert([departmentData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
    },
  });
}

/**
 * Mutation to update an existing department.
 */
export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      if (useMock) {
        await delay();
        return updateMockDepartment(id, updates);
      }

      const { data, error } = await supabase
        .from('departments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
      if (data?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.departments.detail(data.id),
        });
      }
    },
  });
}

/**
 * Mutation to create an asset category.
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryData) => {
      if (useMock) {
        await delay();
        return addMockCategory(categoryData);
      }

      const { data, error } = await supabase
        .from('asset_categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

/**
 * Mutation to update an asset category.
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      if (useMock) {
        await delay();
        return updateMockCategory(id, updates);
      }

      const { data, error } = await supabase
        .from('asset_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      if (data?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.categories.detail(data.id),
        });
      }
    },
  });
}

/**
 * Mutation to update user/employee role or status (admin promotions/deactivations).
 */
export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      if (useMock) {
        await delay();
        return updateMockEmployee(id, updates);
      }

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      if (data?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.employees.detail(data.id),
        });
      }
      // If role changed, it might affect department heads, so refresh departments too
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
    },
  });
}

