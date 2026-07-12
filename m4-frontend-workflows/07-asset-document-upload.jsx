import { useId, useState } from 'react';
import { MAX_UPLOAD_SIZE_BYTES, validateUpload } from './02-validation-schemas';

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) return '';
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * M4 Asset Document Upload
 *
 * Use after an asset has been created. M2 connects `onUpload(file, assetId)` to
 * the storage upload and document-record mutations. The component never sends a
 * file larger than 10 MB.
 */
export function AssetDocumentUpload({
  assetId,
  documents = [],
  isUploading = false,
  onUpload,
  onRemove,
}) {
  const inputId = useId();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState('');

  function selectFiles(event) {
    const files = Array.from(event.target.files ?? []);
    const invalidFile = files.find((file) => validateUpload(file));

    if (invalidFile) {
      setSelectedFiles([]);
      setError(`${invalidFile.name}: files must be 10 MB or smaller.`);
      event.target.value = '';
      return;
    }

    setError('');
    setSelectedFiles(files);
  }

  async function uploadSelectedFiles() {
    if (!assetId) {
      setError('Save the asset before uploading documents.');
      return;
    }
    if (selectedFiles.length === 0) {
      setError('Choose at least one file to upload.');
      return;
    }

    setError('');
    try {
      for (const file of selectedFiles) {
        await onUpload?.(file, assetId);
      }
      setSelectedFiles([]);
    } catch (uploadError) {
      setError(uploadError?.message ?? 'Upload failed. Please try again.');
    }
  }

  return (
    <section aria-labelledby="asset-documents-title">
      <div>
        <h2 id="asset-documents-title">Photos and documents</h2>
        <p>Upload photos, receipts, warranties, or manuals. Each file can be up to 10 MB.</p>
      </div>

      <div>
        <label htmlFor={inputId}>Choose files</label>
        <input
          id={inputId}
          type="file"
          multiple
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
          onChange={selectFiles}
          disabled={isUploading}
        />
        <p>Maximum file size: {formatFileSize(MAX_UPLOAD_SIZE_BYTES)}.</p>
      </div>

      {error && <p role="alert">{error}</p>}

      {selectedFiles.length > 0 && (
        <div aria-live="polite">
          <h3>Ready to upload</h3>
          <ul>
            {selectedFiles.map((file) => (
              <li key={`${file.name}-${file.lastModified}`}>
                {file.name} ({formatFileSize(file.size)})
              </li>
            ))}
          </ul>
          <button type="button" onClick={uploadSelectedFiles} disabled={isUploading}>
            {isUploading ? 'Uploading…' : `Upload ${selectedFiles.length} file${selectedFiles.length === 1 ? '' : 's'}`}
          </button>
          <button type="button" onClick={() => setSelectedFiles([])} disabled={isUploading}>
            Clear selection
          </button>
        </div>
      )}

      <div>
        <h3>Uploaded files</h3>
        {documents.length === 0 ? (
          <p>No files uploaded yet.</p>
        ) : (
          <ul>
            {documents.map((document) => (
              <li key={document.id}>
                {document.url ? (
                  <a href={document.url} target="_blank" rel="noreferrer">{document.file_name ?? 'View document'}</a>
                ) : (
                  <span>{document.file_name ?? 'Document'}</span>
                )}
                {document.file_size && <span> ({formatFileSize(document.file_size)})</span>}
                {onRemove && (
                  <button type="button" onClick={() => onRemove(document)} disabled={isUploading}>
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
