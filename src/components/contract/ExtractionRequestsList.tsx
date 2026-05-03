import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ChevronRight, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { extractionApi } from "@/services/api/extraction"
import type { ExtractionRequestStatus } from "@/types/extraction"
import { formatRelative } from "@/lib/format"

interface ExtractionRequestsListProps {
  documentId: string
  siteId: string
}

const STATUS_LABEL: Record<ExtractionRequestStatus, string> = {
  pending: "ожидает",
  running: "выполняется",
  completed: "готов",
  failed: "ошибка",
}

function StatusIcon({ status }: { status: ExtractionRequestStatus }) {
  if (status === "completed")
    return <CheckCircle2 size={14} className="text-accent" />
  if (status === "failed")
    return <AlertCircle size={14} className="text-warning" />
  return <Loader2 size={14} className="animate-spin text-fg-tertiary" />
}

export function ExtractionRequestsList({
  documentId,
  siteId,
}: ExtractionRequestsListProps) {
  const requestsQuery = useQuery({
    queryKey: ["documents", documentId, "extraction-requests"],
    queryFn: () => extractionApi.listForDocument(documentId),
    refetchInterval: (query) => {
      const data = query.state.data ?? []
      const hasActive = data.some(
        (r) => r.status === "pending" || r.status === "running",
      )
      return hasActive ? 1500 : false
    },
  })

  if (requestsQuery.isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-md border border-border-subtle bg-surface"
          />
        ))}
      </div>
    )
  }

  const requests = requestsQuery.data ?? []
  if (requests.length === 0) {
    return (
      <div className="rounded-lg hairline-dashed bg-surface-sunken px-4 py-6 text-center text-sm text-fg-tertiary">
        История запросов пуста.
      </div>
    )
  }

  return (
    <ul className="divide-y divide-border-subtle overflow-hidden rounded-lg border border-border-subtle bg-surface">
      {requests.map((req) => (
        <li key={req.id}>
          <Link
            to={`/sites/${siteId}/documents/${documentId}/extractions/${req.id}`}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-hover"
          >
            <StatusIcon status={req.status} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm text-fg">
                Запрос от {formatRelative(req.created_at)} ·{" "}
                {req.questions.length} параметр
                {plural(req.questions.length, ["", "а", "ов"])} ·{" "}
                <span className="text-fg-secondary">
                  {STATUS_LABEL[req.status]}
                </span>
              </div>
              {req.error_message && (
                <div className="mt-0.5 truncate text-2xs text-warning-text">
                  {req.error_message}
                </div>
              )}
            </div>
            <ChevronRight size={14} className="shrink-0 text-fg-tertiary" />
          </Link>
        </li>
      ))}
    </ul>
  )
}

function plural(n: number, forms: [string, string, string]): string {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return forms[0]
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return forms[1]
  return forms[2]
}
