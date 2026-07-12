import { useMutation, useQueryClient } from "@tanstack/react-query"
import { throwIfError } from "@/lib/errors"
import { supabase } from "@/lib/supabase"
import { uploadAssetDocument } from "@/lib/storage"

export function useUploadAssetDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file, assetId }: { file: File; assetId: string }) => {
      return uploadAssetDocument({ assetId, file })
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["asset-documents", variables.assetId] })
    },
  })
}

export function useDeleteAssetDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ documentId, assetId }: { documentId: string; assetId: string }) => {
      const { error } = await supabase
        .from("asset_documents")
        .delete()
        .eq("id", documentId)
      throwIfError(error)
      return { documentId, assetId }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["asset-documents", variables.assetId] })
    },
  })
}
