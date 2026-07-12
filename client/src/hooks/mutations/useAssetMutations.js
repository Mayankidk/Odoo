import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { queryKeys } from '@/config/queryKeys';
import { addMockAsset, updateMockAsset, deleteMockAsset, delay } from '@/config/mockData';

const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';

/**
 * Mutation to register/create a new asset.
 */
export function useRegisterAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assetData) => {
      if (useMock) {
        await delay();
        return addMockAsset(assetData);
      }

      const { data, error } = await supabase
        .from('assets')
        .insert([assetData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

/**
 * Mutation to update an asset's details.
 */
export function useUpdateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      if (useMock) {
        await delay();
        return updateMockAsset(id, updates);
      }

      const { data, error } = await supabase
        .from('assets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
      if (data?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.assets.detail(data.id),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

/**
 * Mutation to delete an asset (Admins only).
 */
export function useDeleteAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      if (useMock) {
        await delay();
        return deleteMockAsset(id);
      }

      const { error } = await supabase.from('assets').delete().eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
      queryClient.removeQueries({ queryKey: queryKeys.assets.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

/**
 * Mutation to associate documents to an asset.
 */
export function useAddAssetDocuments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documents) => {
      if (useMock) {
        await delay();
        return documents.map((doc) => ({ id: `doc-${Date.now()}`, ...doc }));
      }

      const { data, error } = await supabase
        .from('asset_documents')
        .insert(documents)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data && data.length > 0) {
        const assetId = data[0].asset_id;
        queryClient.invalidateQueries({
          queryKey: queryKeys.assets.detail(assetId),
        });
      }
    },
  });
}

/**
 * Mutation to delete an asset document.
 */
export function useDeleteAssetDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentId, assetId }) => {
      if (useMock) {
        await delay();
        return { documentId, assetId };
      }

      const { error } = await supabase
        .from('asset_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;
      return { documentId, assetId };
    },
    onSuccess: ({ assetId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.assets.detail(assetId),
      });
    },
  });
}

