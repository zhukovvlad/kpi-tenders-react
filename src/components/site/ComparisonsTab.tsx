import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ChevronRight, GitCompare } from "lucide-react"
import { comparisonsApi } from "@/services/api/comparisons"
import { CONTRACT_KINDS } from "@/types/contract"
import { EmptyState } from "@/components/ui-domain/EmptyState"
import { Button } from "@/components/ui-domain/Button"
import { formatRelative } from "@/lib/format"

export function ComparisonsTab({ siteId }: { siteId: string }) {
  const comparisonsQuery = useQuery({
    queryKey: ["sites", siteId, "comparisons"],
    queryFn: () => comparisonsApi.listForSite(siteId),
  })

  if (comparisonsQuery.isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-lg border border-border-subtle bg-surface"
          />
        ))}
      </div>
    )
  }

  const comparisons = comparisonsQuery.data ?? []
  if (comparisons.length === 0) {
    return (
      <EmptyState
        title="Сравнений ещё нет"
        description="Сохранённые сравнения появятся здесь автоматически. Запустить сравнение можно с карточки договора или с экрана «Сравнение»."
        action={
          <Link to="/compare">
            <Button variant="secondary" leftIcon={<GitCompare size={14} />}>
              К сравнениям
            </Button>
          </Link>
        }
      />
    )
  }

  return (
    <ul className="space-y-2">
      {comparisons.map((cmp) => (
        <li key={cmp.id}>
          <Link
            to={`/compare?session=${cmp.id}`}
            className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface px-4 py-3 transition-colors hover:bg-surface-hover"
          >
            <GitCompare size={16} className="text-fg-tertiary" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-fg">
                {cmp.name}
              </div>
              <div className="mt-0.5 truncate text-xs text-fg-tertiary">
                {CONTRACT_KINDS[cmp.contract_kind].label} ·{" "}
                {cmp.document_ids.length} договоров · сохранено{" "}
                {formatRelative(cmp.created_at)}
              </div>
            </div>
            <ChevronRight size={14} className="shrink-0 text-fg-tertiary" />
          </Link>
        </li>
      ))}
    </ul>
  )
}
