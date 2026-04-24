import { useRef, useState, useCallback } from "react"
import { Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Upload, File, Trash2, CloudUpload, Download, Eye, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { documentsApi } from "@/services/api/documents"
import type { Document } from "@/types/document"
import { logger } from "@/lib/logger"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number | null): string {
  if (bytes === null) return "—"
  if (bytes === 0) return "0 B"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getRussianFileWord(n: number): string {
  const rule = new Intl.PluralRules("ru").select(n)
  const words: Record<string, string> = { one: "файл", few: "файла", many: "файлов", other: "файлов" }
  return words[rule] ?? "файлов"
}

// ---------------------------------------------------------------------------
// StagedFile — entry in the pre-upload queue
// ---------------------------------------------------------------------------

interface StagedFile {
  id: string
  file: File
}

// ---------------------------------------------------------------------------
// DeleteConfirmDialog
// ---------------------------------------------------------------------------

function DeleteConfirmDialog({
  doc,
  isDeleting,
  onConfirm,
  onClose,
}: {
  doc: Document | null
  isDeleting: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Dialog open={doc !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="border-white/10 bg-[#0d1424] text-white sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">Удалить файл?</DialogTitle>
          <DialogDescription className="text-white/50">
            Файл{" "}
            <span className="font-medium text-white/80">«{doc?.file_name}»</span>{" "}
            будет удалён без возможности восстановления.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="-mx-4 -mb-4 border-white/8 bg-white/3">
          <Button
            variant="ghost"
            className="text-white/60 hover:text-white hover:bg-white/8"
            onClick={onClose}
            disabled={isDeleting}
          >
            Отмена
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600/80 text-white hover:bg-red-600 disabled:opacity-50"
          >
            {isDeleting ? "Удаление…" : "Удалить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// FileRow — uploaded document row
// ---------------------------------------------------------------------------

function FileRow({
  doc,
  onRequestDelete,
  isDeleting,
}: {
  doc: Document
  onRequestDelete: (doc: Document) => void
  isDeleting: boolean
}) {
  const viewMutation = useMutation({
    mutationFn: () => documentsApi.getPresignedUrl(doc.id, false),
    onSuccess: (url) => window.open(url, "_blank", "noopener,noreferrer"),
    onError: () => toast.error(`Не удалось открыть «${doc.file_name}»`),
  })

  const downloadMutation = useMutation({
    mutationFn: () => documentsApi.getPresignedUrl(doc.id, true),
    onSuccess: (url) => {
      const a = document.createElement("a")
      a.href = url
      a.download = doc.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    },
    onError: () => toast.error(`Не удалось скачать «${doc.file_name}»`),
  })

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-white/8 bg-white/4 px-4 py-3 transition-colors hover:border-white/15 hover:bg-white/6">
      {/* File icon */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15">
        <File className="h-4 w-4 text-indigo-400" />
      </div>

      {/* Name + meta */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{doc.file_name}</p>
        <p className="mt-0.5 text-xs text-white/30">
          {formatBytes(doc.file_size_bytes)} · {formatDate(doc.created_at)}
        </p>
      </div>

      {/* MIME badge */}
      {doc.mime_type && (
        <span className="hidden shrink-0 rounded-md border border-white/8 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/25 sm:block">
          {doc.mime_type.split("/")[1] ?? doc.mime_type}
        </span>
      )}

      {/* Actions — visible on hover and when focused within */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
        {/* View in browser */}
        <button
          onClick={() => viewMutation.mutate()}
          disabled={viewMutation.isPending || downloadMutation.isPending}
          title="Просмотреть в браузере"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-indigo-500/15 hover:text-indigo-400 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Просмотреть файл"
        >
          {viewMutation.isPending ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-indigo-400" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>

        {/* Download */}
        <button
          onClick={() => downloadMutation.mutate()}
          disabled={viewMutation.isPending || downloadMutation.isPending}
          title="Скачать файл"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-violet-500/15 hover:text-violet-400 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Скачать файл"
        >
          {downloadMutation.isPending ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-violet-400" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </button>

        {/* Delete */}
        <button
          onClick={() => onRequestDelete(doc)}
          disabled={isDeleting}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-red-500/15 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Удалить файл"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// StagedFileRow — file queued for upload (not yet sent)
// ---------------------------------------------------------------------------

function StagedFileRow({ entry, onRemove }: { entry: StagedFile; onRemove: (id: string) => void }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/3 px-4 py-2.5">
      <File className="h-4 w-4 shrink-0 text-indigo-400/60" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-white/70">{entry.file.name}</p>
        <p className="text-xs text-white/25">{formatBytes(entry.file.size)}</p>
      </div>
      <button
        onClick={() => onRemove(entry.id)}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/25 transition-colors hover:bg-white/8 hover:text-white/60"
        aria-label="Убрать из очереди"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// DropZone — drag-and-drop area (stages files, does NOT upload immediately)
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100 MB

function DropZone({ onStage }: { onStage: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const filterBySize = useCallback(
    (files: File[]): File[] => {
      const valid: File[] = []
      for (const f of files) {
        if (f.size > MAX_FILE_SIZE) {
          toast.error(`«${f.name}» превышает лимит 100 МБ`)
        } else {
          valid.push(f)
        }
      }
      return valid
    },
    [],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const files = filterBySize(Array.from(e.dataTransfer.files))
      if (files.length > 0) onStage(files)
    },
    [onStage, filterBySize],
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = filterBySize(Array.from(e.target.files ?? []))
      if (files.length > 0) onStage(files)
      e.target.value = ""
    },
    [onStage, filterBySize],
  )

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all duration-200 ${
        isDragging
          ? "border-indigo-400/60 bg-indigo-500/8"
          : "border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5"
      }`}
    >
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${
          isDragging ? "bg-indigo-500/20" : "bg-white/8"
        }`}
      >
        <CloudUpload
          className={`h-7 w-7 transition-colors ${isDragging ? "text-indigo-400" : "text-white/40"}`}
        />
      </div>

      <div>
        <p className="text-sm font-medium text-white/70">Перетащите файлы или нажмите для выбора</p>
        <p className="mt-1 text-xs text-white/30">Максимум 100 МБ на файл</p>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="mt-1 border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10 hover:text-white"
        onClick={(e) => {
          e.stopPropagation()
          inputRef.current?.click()
        }}
      >
        <Upload className="mr-2 h-3.5 w-3.5" />
        Выбрать файлы
      </Button>

      <input ref={inputRef} type="file" multiple className="sr-only" onChange={handleChange} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// DocumentsPage
// ---------------------------------------------------------------------------

function DocumentsPage() {
  const queryClient = useQueryClient()

  // Pre-upload queue — files shown before the user confirms the upload
  const [staged, setStaged] = useState<StagedFile[]>([])
  // Document pending delete confirmation
  const [docToDelete, setDocToDelete] = useState<Document | null>(null)

  const {
    data: documents = [],
    isLoading,
    isError,
  } = useQuery<Document[]>({
    queryKey: ["documents"],
    queryFn: documentsApi.list,
  })

  const [isUploading, setIsUploading] = useState(false)

  const deleteMutation = useMutation({
    mutationFn: documentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] })
      toast.success("Файл удалён")
      setDocToDelete(null)
    },
    onError: (err) => {
      logger.error("Delete failed", { err })
      toast.error("Не удалось удалить файл")
      setDocToDelete(null)
    },
  })

  const handleStage = useCallback((files: File[]) => {
    setStaged((prev) => [
      ...prev,
      ...files.map((file) => ({ id: crypto.randomUUID(), file })),
    ])
  }, [])

  const handleRemoveStaged = useCallback((id: string) => {
    setStaged((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const handleUploadConfirm = useCallback(async () => {
    setIsUploading(true)
    const results = await Promise.allSettled(staged.map((e) => documentsApi.upload(e.file)))
    const failed: StagedFile[] = []
    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        toast.success(`Файл «${result.value.file_name}» загружен`)
      } else {
        logger.error("Upload failed", { err: result.reason })
        toast.error(`Не удалось загрузить «${staged[i].file.name}»`)
        failed.push(staged[i])
      }
    })
    await queryClient.invalidateQueries({ queryKey: ["documents"] })
    setStaged(failed)
    setIsUploading(false)
  }, [staged, queryClient])

  const handleRequestDelete = useCallback((doc: Document) => {
    setDocToDelete(doc)
  }, [])

  const handleDeleteConfirm = useCallback(() => {
    if (docToDelete) deleteMutation.mutate(docToDelete.id)
  }, [docToDelete, deleteMutation])

  return (
    <div className="min-h-screen bg-[#020617]">
      {/* Ambient spheres */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-100 w-100 rounded-full bg-indigo-700/12 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-75 w-75 rounded-full bg-violet-600/12 blur-[120px]" />
      </div>

      {/* Top navigation */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-4 px-6">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-white/40 transition-colors hover:text-white/80"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Назад</span>
          </Link>

          <div className="h-4 w-px bg-white/10" />

          <div className="flex items-center gap-2 text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-indigo-400">
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-sm font-medium">Tender Analysis</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 mx-auto max-w-4xl px-6 py-12">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white">Загрузка документов</h1>
          <p className="mt-1.5 text-sm text-white/40">
            Загружайте тендерную документацию для последующей обработки модулями анализа
          </p>
        </div>

        {/* Drop zone */}
        <DropZone onStage={handleStage} />

        {/* Staged queue */}
        {staged.length > 0 && (
          <div className="mt-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-indigo-400/70">
              Ожидает загрузки — {staged.length}{" "}
              {getRussianFileWord(staged.length)}
            </p>

            <div className="flex flex-col gap-2">
              {staged.map((entry) => (
                <StagedFileRow key={entry.id} entry={entry} onRemove={handleRemoveStaged} />
              ))}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white/40 hover:text-white/70 hover:bg-white/8"
                onClick={() => setStaged([])}
                disabled={isUploading}
              >
                Очистить
              </Button>
              <Button
                size="sm"
                className="bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
                onClick={handleUploadConfirm}
                disabled={isUploading}
              >
                <Upload className="mr-2 h-3.5 w-3.5" />
                {isUploading
                  ? "Загрузка…"
                  : `Загрузить ${staged.length > 1 ? `${staged.length} ` : ""}${getRussianFileWord(staged.length)}`}
              </Button>
            </div>
          </div>
        )}

        {/* Uploaded documents list */}
        <div className="mt-8">
          <div className="mb-4">
            <h2 className="text-sm font-medium text-white/60">
              Загруженные файлы
              {documents.length > 0 && (
                <span className="ml-2 rounded-full bg-white/8 px-2 py-0.5 text-xs text-white/40">
                  {documents.length}
                </span>
              )}
            </h2>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-indigo-500" />
            </div>
          )}

          {isError && (
            <div className="flex items-center justify-center rounded-xl border border-red-500/15 bg-red-500/5 py-10">
              <p className="text-sm text-red-400/70">Не удалось загрузить список файлов</p>
            </div>
          )}

          {!isLoading && !isError && documents.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-white/2 py-16">
              <File className="mb-3 h-8 w-8 text-white/15" />
              <p className="text-sm text-white/25">Файлов пока нет</p>
            </div>
          )}

          {!isLoading && !isError && documents.length > 0 && (
            <div className="flex flex-col gap-2">
              {documents.map((doc) => (
                <FileRow
                  key={doc.id}
                  doc={doc}
                  onRequestDelete={handleRequestDelete}
                  isDeleting={deleteMutation.isPending && deleteMutation.variables === doc.id}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        doc={docToDelete}
        isDeleting={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDocToDelete(null)}
      />
    </div>
  )
}

export default DocumentsPage
