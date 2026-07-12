import { supabase } from '@/config/supabase';

/**
 * Uploads a file to Supabase Storage bucket 'asset-documents'.
 *
 * Automatically generates a unique path to prevent filename collisions
 * and returns metadata formatted directly for database insertion.
 *
 * Allowed MIME Types (per DB constraints):
 * - image/png, image/jpeg, image/webp, application/pdf
 * - Max file size: 10MB (10,485,760 bytes)
 *
 * @param {File} file - The file object from file input
 * @param {string} [customDirectory='assets'] - Subdirectory folder name in the bucket
 * @returns {Promise<{
 *   file_name: string,
 *   file_url: string,
 *   file_type: string,
 *   file_size: number
 * }>}
 */
export async function uploadAssetDocument(file, customDirectory = 'assets') {
  if (!file) {
    throw new Error('No file provided for upload');
  }

  // 1. Client-side size limit validation (10MB)
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error('File size exceeds the 10MB limit');
  }

  // 2. Client-side MIME type validation
  const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(
      `Invalid file type (${file.type}). Only PNG, JPEG, WebP, and PDF are allowed.`,
    );
  }

  // 3. Generate unique file path in the bucket: directory/timestamp-random-filename
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniqueId = Math.random().toString(36).substring(2, 10);
  const filePath = `${customDirectory}/${Date.now()}-${uniqueId}-${cleanFileName}`;

  // 4. Upload file to Supabase Storage
  const { data, error } = await supabase.storage
    .from('asset-documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw error;
  }

  // 5. Retrieve Public URL (bucket is public, so no signing needed)
  const { data: urlData } = supabase.storage
    .from('asset-documents')
    .getPublicUrl(data.path);

  if (!urlData || !urlData.publicUrl) {
    throw new Error('Failed to retrieve public URL for uploaded file');
  }

  // 6. Return metadata payload matching the asset_documents schema exactly
  return {
    file_name: file.name,
    file_url: urlData.publicUrl,
    file_type: file.type,
    file_size: file.size,
  };
}
