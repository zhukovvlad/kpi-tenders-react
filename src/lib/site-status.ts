import type { SiteAggregateStatus } from "@/types/site"
import type { StatusTone } from "@/components/ui-domain/StatusPill"

export function aggregateStatusToPill(status: SiteAggregateStatus): {
  tone: StatusTone
  label: string
} {
  switch (status) {
    case "ready":
      return { tone: "ready", label: "Готов" }
    case "processing":
      return { tone: "processing", label: "В работе" }
    case "attention":
      return { tone: "attention", label: "Требует внимания" }
    case "empty":
      return { tone: "empty", label: "Документы не загружены" }
  }
}
