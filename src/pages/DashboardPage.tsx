import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Plus, Search } from "lucide-react"
import { sitesApi } from "@/services/api/sites"
import type { SiteAggregateStatus, SiteListItem } from "@/types/site"
import { Button } from "@/components/ui-domain/Button"
import { PageHeader } from "@/components/ui-domain/PageHeader"
import { EmptyState } from "@/components/ui-domain/EmptyState"
import { SiteCard } from "@/components/SiteCard"
import { cn } from "@/lib/utils"

type StatusFilter = "all" | SiteAggregateStatus | "archived"
type SortKey = "recent" | "name" | "inflation"

interface FilterMeta {
  key: StatusFilter
  label: string
}

const STATUS_FILTERS: FilterMeta[] = [
  { key: "all", label: "Все" },
  { key: "processing", label: "В работе" },
  { key: "ready", label: "Готовы" },
  { key: "attention", label: "Требуют внимания" },
  { key: "archived", label: "Архив" },
]

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: "recent", label: "По свежести" },
  { key: "name", label: "По названию" },
  { key: "inflation", label: "По удорожанию" },
]

export default function DashboardPage() {
  const sitesQuery = useQuery({
    queryKey: ["sites", "dashboard"],
    queryFn: sitesApi.listForDashboard,
  })

  const [filter, setFilter] = useState<StatusFilter>("all")
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortKey>("recent")

  // useMemo — стабильная ссылка для зависимостей нижестоящих хуков, иначе
  // дефолт `[]` каждый рендер пересоздаётся и валит useMemo.
  const sites = useMemo(() => sitesQuery.data ?? [], [sitesQuery.data])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return sites
      .filter((s) => {
        if (filter === "archived") return s.status === "archived"
        if (s.status === "archived") return false
        if (filter !== "all" && s.aggregate_status !== filter) return false
        if (
          query.length > 0 &&
          !s.name.toLowerCase().includes(query) &&
          !s.breadcrumbs.some((b) => b.toLowerCase().includes(query))
        ) {
          return false
        }
        return true
      })
      .sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name, "ru")
        if (sort === "inflation") {
          return (b.inflation_pct ?? -1) - (a.inflation_pct ?? -1)
        }
        return a.last_activity_at < b.last_activity_at ? 1 : -1
      })
  }, [sites, filter, search, sort])

  const counts = useMemo(() => countByFilter(sites), [sites])

  return (
    <div className="container-page py-8">
      <PageHeader
        serif
        title="Объекты"
        subtitle={
          sites.length > 0
            ? `${sites.length} проектов в портфеле`
            : "Здесь появится ваш портфель объектов"
        }
        actions={
          <Link to="/sites/new">
            <Button leftIcon={<Plus size={14} />}>Новый объект</Button>
          </Link>
        }
      />

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative min-w-50 flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-tertiary"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию объекта"
            className="w-full rounded-md border border-border-subtle bg-surface py-2 pl-9 pr-3 text-sm text-fg placeholder:text-fg-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((f) => (
            <FilterPill
              key={f.key}
              active={filter === f.key}
              label={f.label}
              count={counts[f.key]}
              onClick={() => setFilter(f.key)}
              tone={f.key === "attention" ? "warning" : "default"}
            />
          ))}
        </div>
        <div className="ml-auto">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-md border border-border-subtle bg-surface px-3 py-2 text-sm text-fg-secondary hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6">
        {sitesQuery.isLoading ? (
          <DashboardSkeleton />
        ) : sitesQuery.isError ? (
          <EmptyState
            title="Не удалось загрузить объекты"
            description="Проверьте соединение и попробуйте обновить страницу."
          />
        ) : sites.length === 0 ? (
          <EmptyState
            title="Создайте первый объект"
            description="Объект — это контейнер для договоров и параметров. С него начинается работа в Tender Analysis."
            action={
              <Link to="/sites/new">
                <Button leftIcon={<Plus size={14} />}>Новый объект</Button>
              </Link>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Ничего не найдено"
            description="Попробуйте изменить фильтр или строку поиска."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((site) => (
              <SiteCard key={site.id} site={site} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface FilterPillProps {
  active: boolean
  label: string
  count: number
  onClick: () => void
  tone?: "default" | "warning"
}

function FilterPill({
  active,
  label,
  count,
  onClick,
  tone = "default",
}: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors duration-150",
        active
          ? tone === "warning"
            ? "border-warning-border bg-warning-soft text-warning-text"
            : "border-accent-border bg-accent-soft text-accent-text"
          : "border-border-subtle bg-transparent text-fg-secondary hover:bg-surface-hover hover:text-fg",
      )}
    >
      {label}
      <span className="ml-1.5 text-fg-tertiary">· {count}</span>
    </button>
  )
}

function countByFilter(sites: SiteListItem[]): Record<StatusFilter, number> {
  const result: Record<StatusFilter, number> = {
    all: 0,
    ready: 0,
    processing: 0,
    attention: 0,
    empty: 0,
    archived: 0,
  }
  sites.forEach((s) => {
    if (s.status === "archived") {
      result.archived += 1
      return
    }
    result.all += 1
    result[s.aggregate_status] += 1
  })
  return result
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div
          key={idx}
          className="h-41 animate-pulse rounded-lg border border-border-subtle bg-surface"
        />
      ))}
    </div>
  )
}
