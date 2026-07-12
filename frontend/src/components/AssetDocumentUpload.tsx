import { useId, useState, useRef } from "react"
import { Upload, X, FileText, Image, Trash2, ExternalLink, CloudUpload } from "lucide-react"
import type { AssetDocument } from "@/lib/database.types"

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes)) return ""
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function validateUpload(file: File): string | null {
  if (!file) return "Choose a file to upload."
  if (file.size > MAX_UPLOAD_SIZE_BYTES) return "Files must be 10 MB or smaller."
  return null
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/")) return <Image className="w-4 h-4 text-blue-500" />
  return <FileText className="w-4 h-4 text-slate-500" />
}

interface AssetDocumentUploadProps {
  assetId: string
  documents: AssetDocument[]
  isUploading: boolean
  isDeleting: boolean
  onUpload: (file: File, assetId: string) => Promise<void>
  onRemove: (document: AssetDocument) => Promise<void>
}

export function AssetDocumentUpload({
  assetId,
  documents,
  isUploading,
  isDeleting,
  onUpload,
  onRemove,
}: AssetDocumentUploadProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [error, setError] = useState("")
  const [isDragging, setIsDragging] = useState(false)

  function selectFiles(files: File[]) {
    const invalidFile = files.find((file) => validateUpload(file))
    if (invalidFile) {
      setSelectedFiles([])
      setError(`${invalidFile.name}: files must be 10 MB or smaller.`)
      if (inputRef.current) inputRef.current.value = ""
      return
    }
    setError("")
    setSelectedFiles(files)
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    selectFiles(Array.from(event.target.files ?? []))
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave() {
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    selectFiles(Array.from(e.dataTransfer.files))
  }

  async function uploadSelectedFiles() {
    if (selectedFiles.length === 0) {
      setError("Choose at least one file to upload.")
      return
    }
    setError("")
    try {
      for (const file of selectedFiles) {
        await onUpload(file, assetId)
      }
      setSelectedFiles([])
      if (inputRef.current) inputRef.current.value = ""
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed. Please try again.")
    }
  }

  const busy = isUploading || isDeleting

  return (
    <section className="space-y-5">
      {/* Header */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <CloudUpload className="w-4 h-4 text-blue-500" />
          Photos &amp; Documents
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Upload photos, receipts, warranties, or manuals. Max {formatFileSize(MAX_UPLOAD_SIZE_BYTES)} per file.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-xl border-2 border-dashed transition-colors cursor-pointer
          ${isDragging
            ? "border-blue-400 bg-blue-50"
            : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100/50"
          }`}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
          onChange={handleInputChange}
          disabled={busy}
          className="sr-only"
        />
        <div className="flex flex-col items-center justify-center py-6 gap-2 pointer-events-none">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
            <Upload className="w-5 h-5 text-slate-400" />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-700">
              {isDragging ? "Drop files here" : "Click or drag files to upload"}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Images, PDF, Word, Excel — up to {formatFileSize(MAX_UPLOAD_SIZE_BYTES)}
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
          <X className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* Selected files pending upload */}
      {selectedFiles.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 space-y-3" aria-live="polite">
          <h4 className="text-xs font-bold text-blue-900">Ready to upload</h4>
          <ul className="space-y-1.5">
            {selectedFiles.map((file) => (
              <li key={`${file.name}-${file.lastModified}`} className="flex items-center gap-2 text-xs text-slate-700">
                <FileIcon mimeType={file.type} />
                <span className="flex-1 truncate font-medium">{file.name}</span>
                <span className="text-slate-400 shrink-0">{formatFileSize(file.size)}</span>
              </li>
            ))}
          </ul>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={uploadSelectedFiles}
              disabled={busy}
              className="flex-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-60 transition-colors"
            >
              {isUploading
                ? "Uploading…"
                : `Upload ${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"}`}
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedFiles([])
                if (inputRef.current) inputRef.current.value = ""
              }}
              disabled={busy}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Uploaded files list */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 mb-2">
          Uploaded files{" "}
          {documents.length > 0 && (
            <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
              {documents.length}
            </span>
          )}
        </h4>
        {documents.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No files uploaded yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 shadow-sm hover:border-slate-200 transition-colors"
              >
                <FileIcon mimeType={doc.file_type} />
                <span className="flex-1 min-w-0">
                  {doc.file_url ? (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-blue-600 hover:text-blue-500 truncate flex items-center gap-1"
                    >
                      <span className="truncate">{doc.file_name}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-xs font-medium text-slate-700 truncate block">{doc.file_name}</span>
                  )}
                  {doc.file_size && (
                    <span className="text-[10px] text-slate-400">{formatFileSize(doc.file_size)}</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(doc)}
                  disabled={busy}
                  title="Remove file"
                  className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
