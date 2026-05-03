import { useQuery } from "@tanstack/react-query"
import {
  AlertCircle,
  CheckCircle2,
  FileUp,
  PencilLine,
  Play,
  Plus,
} from "lucide-react"
import { siteEventsApi } from "@/services/api/site-events"
import type { SiteEventKind } from "@/types/site-event"
import { EmptyState } from "@/components/ui-domain/EmptyState"
import { formatDate } from "@/lib/format"

const ICONS: Record<SiteEventKind, typeof Plus> = {
  site_created: Plus,
  metadata_updated: PencilLine,
  document_uploaded: FileUp,
  document_deleted: AlertCircle,
  extraction_started: Play,
  extraction_completed: CheckCircle2,
  extraction_failed: AlertCircle,
}

const TONES: Record<SiteEventKind, string> = {
  site_created: "text-fg-secondary",
  metadata_updated: "text-fg-secondary",
  document_uploaded: "text-accent-text",
  document_deleted: "text-warning-text",
  extraction_started: "text-fg-secondary",
  extraction_completed: "text-accent-text",
  extraction_failed: "text-warning-text",
}

export function HistoryTab({ siteId }: { siteId: string }) {
  const eventsQuery = useQuery({
    queryKey: ["sites", siteId, "events"],
    queryFn: () => siteEventsApi.listForSite(siteId),
  })

  if (eventsQuery.isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-md border border-border-subtle bg-surface"
          />
        ))}
      </div>
    )
  }

  const events = eventsQuery.data ?? []
  if (events.length === 0) {
    return (
      <EmptyState
        title="Истории пока нет"
        description="Здесь появятся события объекта: загрузки, запросы извлечения, изменения метаданных."
      />
    )
  }

  return (
    <ol className="space-y-1.5">
      {events.map((ev) => {
        const Icon = ICONS[ev.kind] ?? Plus
        return (
          <li
            key={ev.id}
            className="flex gap-3 rounded-md border border-border-subtle bg-surface px-3.5 py-2.5"
          >
            <div className={`mt-0.5 ${TONES[ev.kind]}`}>
              <Icon size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm text-fg">{ev.message}</div>
              <div className="mt-0.5 text-2xs text-fg-tertiary">
                {ev.actor_name} · {formatDate(ev.occurred_at)}
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
