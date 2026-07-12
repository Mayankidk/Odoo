import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { queryKeys } from '@/config/queryKeys';

/**
 * Mutation to register/create a new asset.
 */
export function useRegisterAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assetData) => {
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
 * Mutation to associate documents to an asset (metadata record, storage upload is handled separately).
 */
export function useAddAssetDocuments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documents) => {
      // documents: Array of { asset_id, file_name, file_url, file_type, file_size }
      const { data, error } = await supabase
        .from('asset_documents')
        .insert(documents)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data && data.length > 0) {
        // Invalidate the detail view of the asset that received the document
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
