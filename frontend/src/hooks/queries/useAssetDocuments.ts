import { useQuery } from "@tanstack/react-query"
import { throwIfError } from "@/lib/errors"
import { supabase } from "@/lib/supabase"

export function useAssetDocuments(assetId: string | null) {
  return useQuery({
    queryKey: ["asset-documents", assetId],
    enabled: !!assetId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_documents")
        .select("*")
        .eq("asset_id", assetId!)
        .order("created_at", { ascending: false })
      throwIfError(error)
      return data ?? []
    },
  })
}
