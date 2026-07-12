import { supabase } from "./supabase"
import { throwIfError } from "./errors"

const ASSET_DOCUMENTS_BUCKET = "asset-documents"

type UploadAssetDocumentArgs = {
  assetId: string
  file: File
  folder?: "photos" | "documents"
}

export async function uploadAssetDocument({
  assetId,
  file,
  folder = "documents",
}: UploadAssetDocumentArgs) {
  const extension = file.name.split(".").pop()
  const safeName = `${assetId}-${crypto.randomUUID()}${extension ? `.${extension}` : ""}`
  const path = `${folder}/${safeName}`

  const { error: uploadError } = await supabase.storage
    .from(ASSET_DOCUMENTS_BUCKET)
    .upload(path, file)
  throwIfError(uploadError)

  const {
    data: { publicUrl },
  } = supabase.storage.from(ASSET_DOCUMENTS_BUCKET).getPublicUrl(path)

  const { data, error } = await supabase
    .from("asset_documents")
    .insert({
      asset_id: assetId,
      file_name: file.name,
      file_url: publicUrl,
      file_type: file.type,
      file_size: file.size,
    })
    .select()
    .single()

  throwIfError(error)
  return data
}
