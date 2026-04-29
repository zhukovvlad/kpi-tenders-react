import { useState } from "react"
import type { ReactNode } from "react"
import axios from "axios"
import { Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  ShieldCheck,
  Play,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  XCircle,
  File,
  ChevronRight,
  FileText,
  Download,
  Map,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { documentsApi } from "@/services/api/documents"
import { tasksApi } from "@/services/api/tasks"
import type { Document } from "@/types/document"
import type { Task, TaskModule, TaskStatus } from "@/types/task"
import { logger } from "@/lib/logger"
import { formatBytes, formatDate } from "@/lib/format"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getEntityWord(n: number): string {
  const rule = new Intl.PluralRules("ru").select(n)
  const map: Record<string, string> = {
    one: "сущность",
    few: "сущности",
    many: "сущностей",
    other: "сущностей",
  }
  return map[rule] ?? "сущностей"
}

function getDocumentWord(n: number): string {
  const rule = new Intl.PluralRules("ru").select(n)
  const map: Record<string, string> = {
    one: "документ",
    few: "документа",
    many: "документов",
    other: "документов",
  }
  return map[rule] ?? "документов"
}

// Inserts a suffix before the file extension so the user gets a meaningful
// filename: buildDownloadName("contract.docx", "anonymized") → "contract_anonymized.docx"
function buildDownloadName(originalName: string, suffix: string): string {
  const dot = originalName.lastIndexOf(".")
  if (dot === -1) return `${originalName}_${suffix}`
  return `${originalName.slice(0, dot)}_${suffix}${originalName.slice(dot)}`
}

// ---------------------------------------------------------------------------
// StageChip — single pipeline stage with status indicator
// ---------------------------------------------------------------------------

type StageStatus = "idle" | TaskStatus

interface StageChipProps {
  label: string
  status: StageStatus
}

function StageChip({ label, status }: StageChipProps) {
  const styles: Record<StageStatus, { chip: string; icon: ReactNode }> = {
    idle: {
      chip: "border-white/8 bg-white/3 text-white/25",
      icon: <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/15" />,
    },
    pending: {
      chip: "border-amber-500/20 bg-amber-500/8 text-amber-300",
      icon: <Clock className="h-3 w-3 text-amber-400" />,
    },
    processing: {
      chip: "border-sky-500/20 bg-sky-500/8 text-sky-300",
      icon: <Zap className="h-3 w-3 animate-pulse text-sky-400" />,
    },
    completed: {
      chip: "border-emerald-500/20 bg-emerald-500/8 text-emerald-300",
      icon: <CheckCircle2 className="h-3 w-3 text-emerald-400" />,
    },
    failed: {
      chip: "border-red-500/20 bg-red-500/8 text-red-300",
      icon: <XCircle className="h-3 w-3 text-red-400" />,
    },
  }

  const { chip, icon } = styles[status]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${chip}`}
    >
      {icon}
      {label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// EntityBadge — entities found/hidden counter or zero-entity warning
// ---------------------------------------------------------------------------

interface EntityBadgeProps {
  count: number
}

function EntityBadge({ count }: EntityBadgeProps) {
  if (count === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/8 px-2.5 py-1 text-xs font-medium text-amber-300">
        <AlertTriangle className="h-3 w-3" />
        Сущности не найдены
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/8 px-2.5 py-1 text-xs font-medium text-violet-300">
      <ShieldCheck className="h-3 w-3" />
      {count} {getEntityWord(count)} скрыто
    </span>
  )
}

// ---------------------------------------------------------------------------
// ResultDialog — shows anonymization result metadata
// ---------------------------------------------------------------------------

interface ResultDialogProps {
  doc: Document
  anonymizeTask: Task
  isOpen: boolean
  onClose: () => void
}

interface DownloadButtonProps {
  documentId: string
  fileName: string
  label: string
  icon: ReactNode
}

function DownloadButton({ documentId, fileName, label, icon }: DownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDownload = async () => {
    setIsLoading(true)
    try {
      const url = await documentsApi.getPresignedUrl(documentId, true)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (err) {
      logger.error("Failed to fetch presigned URL", { documentId, err })
      // The global Axios interceptor (client.ts) only shows toasts for
      // 400, 403, and 5xx. Show a local toast for everything else so no
      // download failure is ever silent to the user.
      const status = axios.isAxiosError(err) ? err.response?.status : undefined
      const handledByInterceptor =
        status === 400 || status === 403 || (status != null && status >= 500)
      if (!handledByInterceptor) {
        toast.error("Не удалось скачать файл")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 gap-1.5 border border-white/10 bg-white/5 px-3 text-white/60 hover:border-white/20 hover:bg-white/8 hover:text-white disabled:opacity-40"
      onClick={handleDownload}
      disabled={isLoading}
    >
      {isLoading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
      ) : (
        icon
      )}
      {label}
    </Button>
  )
}

function ResultDialog({ doc, anonymizeTask, isOpen, onClose }: ResultDialogProps) {
  const payload = anonymizeTask.result_payload
  const entityCount = payload?.entity_count ?? null
  const anonDocId = payload?.anonymized_document_id ?? null
  const entitiesMapDocId = payload?.entities_map_document_id ?? null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-white/10 bg-[#0d1424] text-white sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <ShieldCheck className="h-4 w-4 text-violet-400" />
            Результат анонимизации
          </DialogTitle>
          <DialogDescription className="text-white/40">
            Итог обработки файла
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex flex-col gap-4">
          {/* Original file */}
          <div className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15">
              <File className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-white/30 mb-1">Исходный файл</p>
              <p className="break-all text-sm font-medium text-white">{doc.file_name}</p>
              <p className="mt-0.5 text-xs text-white/30">
                {formatBytes(doc.file_size_bytes)} · {formatDate(doc.created_at)}
              </p>
            </div>
          </div>

          {/* Pipeline status */}
          <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/2 px-4 py-3">
            <StageChip label="Конвертация" status="completed" />
            <ChevronRight className="h-3 w-3 text-white/15" />
            <StageChip label="Анонимизация" status="completed" />
          </div>

          {/* Entity count */}
          {entityCount !== null && (
            <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 px-4 py-3">
              <ShieldCheck className="h-4 w-4 shrink-0 text-violet-400" />
              <div>
                <p className="text-xs text-white/30">Обнаружено и скрыто сущностей</p>
                <p className="mt-0.5 text-sm font-semibold text-white">{entityCount}</p>
              </div>
              {entityCount === 0 && (
                <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/8 px-2.5 py-1 text-xs text-amber-300">
                  <AlertTriangle className="h-3 w-3" />
                  Не найдено
                </span>
              )}
            </div>
          )}

          {/* Download buttons */}
          {(anonDocId || entitiesMapDocId) && (
            <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-white/2 px-4 py-3">
              <p className="text-xs text-white/30 mb-1">Скачать результаты</p>
              <div className="flex flex-wrap gap-2">
                {anonDocId && (
                  <DownloadButton
                    documentId={anonDocId}
                    fileName={buildDownloadName(doc.file_name, "anonymized")}
                    label="Анонимизированный файл"
                    icon={<Download className="h-3.5 w-3.5" />}
                  />
                )}
                {entitiesMapDocId && (
                  <DownloadButton
                    documentId={entitiesMapDocId}
                    fileName={buildDownloadName(doc.file_name, "entities")}
                    label="Карта сущностей"
                    icon={<Map className="h-3.5 w-3.5" />}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface DocumentAnonymizationRowProps {
  doc: Document
  tasks: Task[]
  isLoadingTasks: boolean
  onPreview: (doc: Document, anonymizeTask: Task) => void
}

function DocumentAnonymizationRow({ doc, tasks, isLoadingTasks, onPreview }: DocumentAnonymizationRowProps) {
  const queryClient = useQueryClient()

  const getModuleLabel = (module: TaskModule) =>
    module === "convert" ? "Конвертация" : "Анонимизация"

  const startMutation = useMutation({
    mutationFn: (module: TaskModule) => tasksApi.start(doc.id, module),
    onSuccess: (_data, module) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "batch"] })
      toast.success(`${getModuleLabel(module)} «${doc.file_name}» запущена`)
    },
    onError: (err, module) => {
      logger.error(`Failed to start ${module}`, { docId: doc.id, err })
      // Show fallback toast for statuses not covered by the global interceptor
      // (interceptor handles 400/403/5xx) and for network/non-Axios errors.
      const status = axios.isAxiosError(err) ? err.response?.status : undefined
      const handledByInterceptor =
        status === 400 || status === 403 || (status != null && status >= 500)
      if (!handledByInterceptor) {
        toast.error(`Не удалось запустить ${getModuleLabel(module).toLowerCase()} «${doc.file_name}»`)
      }
    },
  })

  const latestByModule = (m: TaskModule) =>
    tasks
      .filter((t) => t.module_name === m)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0]

  const convertTask = latestByModule("convert")
  const anonymizeTask = latestByModule("anonymize")

  const convertStatus: StageStatus = convertTask?.status ?? "idle"
  const anonymizeStatus: StageStatus = anonymizeTask?.status ?? "idle"

  const isRunning =
    convertStatus === "pending" ||
    convertStatus === "processing" ||
    anonymizeStatus === "pending" ||
    anonymizeStatus === "processing"

  const isFullyCompleted = anonymizeStatus === "completed"
  const hasFailed = convertStatus === "failed" || anonymizeStatus === "failed"
  const hasStarted = tasks.length > 0
  const failedModule: TaskModule | null =
    convertStatus === "failed" ? "convert" :
    anonymizeStatus === "failed" ? "anonymize" :
    null

  const entitiesCount = anonymizeTask?.result_payload?.entity_count ?? null

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/8 bg-white/4 p-4 transition-colors hover:border-white/12 hover:bg-white/5 sm:flex-row sm:items-center sm:gap-4">
      {/* File icon + name */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15">
          <File className="h-4 w-4 text-violet-400" />
        </div>
        <div className="min-w-0">
          <p className="break-all text-sm font-medium text-white">{doc.file_name}</p>
          <p className="mt-0.5 text-xs text-white/30">
            {formatBytes(doc.file_size_bytes)} · {formatDate(doc.created_at)}
          </p>
        </div>
      </div>

      {/* Pipeline stages */}
      <div className="flex shrink-0 items-center gap-2">
        {isLoadingTasks ? (
          <span className="text-xs text-white/20">Загрузка…</span>
        ) : (
          <>
            <StageChip label="Конвертация" status={convertStatus} />
            <ChevronRight className="h-3 w-3 text-white/15" />
            <StageChip label="Анонимизация" status={anonymizeStatus} />
          </>
        )}
      </div>

      {/* Entity count badge — only shown after full completion */}
      {isFullyCompleted && entitiesCount !== null && (
        <div className="shrink-0">
          <EntityBadge count={entitiesCount} />
        </div>
      )}

      {/* Action area */}
      <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
        {isFullyCompleted && anonymizeTask && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 border border-violet-500/20 bg-violet-500/8 px-3 text-violet-300 hover:bg-violet-500/15 hover:text-violet-200"
            onClick={() => onPreview(doc, anonymizeTask)}
          >
            <Eye className="h-3.5 w-3.5" />
            Предпросмотр
          </Button>
        )}

        {!hasStarted && !isLoadingTasks && (
          <Button
            size="sm"
            className="h-8 gap-1.5 bg-violet-600/80 px-3 text-white hover:bg-violet-600 disabled:opacity-50"
            onClick={() => startMutation.mutate("convert")}
            disabled={startMutation.isPending || isLoadingTasks}
          >
            {startMutation.isPending ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            Запустить
          </Button>
        )}

        {isRunning && (
          <span className="inline-flex items-center gap-1.5 text-xs text-sky-400/80">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-sky-500/30 border-t-sky-400" />
            В процессе…
          </span>
        )}

        {hasFailed && !isRunning && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1.5 border border-red-500/20 px-3 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            onClick={() => failedModule && startMutation.mutate(failedModule)}
            disabled={startMutation.isPending || !failedModule}
          >
            <Play className="h-3.5 w-3.5" />
            Повторить
          </Button>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AnonymizationPage
// ---------------------------------------------------------------------------

interface PreviewState {
  doc: Document
  anonymizeTask: Task
}

function AnonymizationPage() {
  const [preview, setPreview] = useState<PreviewState | null>(null)

  const {
    data: documents = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["documents"],
    queryFn: documentsApi.list,
  })

  const { data: allTasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ["tasks", "batch", documents.map((d) => d.id).join(",")],
    queryFn: () => tasksApi.getByDocuments(documents.map((d) => d.id)),
    enabled: documents.length > 0,
    staleTime: 0,
    // Poll at 3 s while any task is active, or while convert is done but
    // anonymize hasn't been created yet (backend creates it asynchronously).
    refetchInterval: (query) => {
      const data = query.state.data as Task[] | undefined
      if (!data || data.length === 0) return false
      const hasActive = data.some(
        (t) => t.status === "pending" || t.status === "processing",
      )
      if (hasActive) return 3000
      const docsWithConvertDone = new Set(
        data
          .filter((t) => t.module_name === "convert" && t.status === "completed")
          .map((t) => t.document_id),
      )
      const docsWithAnonymize = new Set(
        data.filter((t) => t.module_name === "anonymize").map((t) => t.document_id),
      )
      if ([...docsWithConvertDone].some((id) => !docsWithAnonymize.has(id))) return 3000
      return false
    },
  })

  const handlePreview = (doc: Document, anonymizeTask: Task) => {
    setPreview({ doc, anonymizeTask })
  }

  return (
    <div className="min-h-screen bg-[#020617]">
      {/* Ambient spheres */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-100 w-100 rounded-full bg-violet-700/12 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-75 w-75 rounded-full bg-purple-600/12 blur-[120px]" />
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
        <div className="mb-8 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 backdrop-blur-sm">
            <ShieldCheck className="h-6 w-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Деперсонализация</h1>
            <p className="mt-1 text-sm text-white/40">
              Автоматическое удаление персональных данных (ФИО, СНИЛС, ИНН) из тендерной документации
            </p>
          </div>
        </div>

        {/* Pipeline legend */}
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-white/2 px-4 py-3">
          <span className="text-xs text-white/30">Этапы обработки:</span>
          <StageChip label="Конвертация" status="idle" />
          <ChevronRight className="h-3 w-3 text-white/15" />
          <StageChip label="Анонимизация" status="idle" />
          <span className="ml-auto hidden text-xs text-white/20 sm:block">
            Нажмите «Запустить» для начала обработки
          </span>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-violet-400" />
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            Не удалось загрузить список документов. Попробуйте обновить страницу.
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && documents.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
              <File className="h-6 w-6 text-white/20" />
            </div>
            <p className="text-sm text-white/40">Нет загруженных документов</p>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <Link to="/documents">Загрузить документы</Link>
            </Button>
          </div>
        )}

        {/* Document list */}
        {!isLoading && !isError && documents.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/30">
                {documents.length} {getDocumentWord(documents.length)}
              </p>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 border border-white/8 bg-white/3 px-3 text-xs text-white/40 hover:border-white/15 hover:bg-white/6 hover:text-white/70"
              >
                <Link to="/documents">
                  <FileText className="h-3 w-3" />
                  Загрузить документы
                </Link>
              </Button>
            </div>
            {documents.map((doc) => (
              <DocumentAnonymizationRow
                key={doc.id}
                doc={doc}
                tasks={allTasks.filter((t) => t.document_id === doc.id)}
                isLoadingTasks={isLoadingTasks}
                onPreview={handlePreview}
              />
            ))}
          </div>
        )}
      </main>

      {/* Result dialog */}
      {preview && (
        <ResultDialog
          doc={preview.doc}
          anonymizeTask={preview.anonymizeTask}
          isOpen={preview !== null}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  )
}

export default AnonymizationPage
