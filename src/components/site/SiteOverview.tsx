import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Building2, GitCompare, Plus } from "lucide-react"
import { sitesApi } from "@/services/api/sites"
import type { ConstructionSite, SiteListItem } from "@/types/site"
import { KpiCard } from "@/components/ui-domain/KpiCard"
import { StatusPill } from "@/components/ui-domain/StatusPill"
import { Button } from "@/components/ui-domain/Button"
import { ContractKindChip } from "@/components/ui-domain/ContractKindChip"
import { EmptyState } from "@/components/ui-domain/EmptyState"
import { aggregateStatusToPill } from "@/lib/site-status"
import { formatPercent, formatRelative } from "@/lib/format"
import { cn } from "@/lib/utils"

interface SiteOverviewProps {
  site: ConstructionSite
}

// Промежуточный экран для объекта с дочерними (ЖК → очереди / очередь → корпуса).
// Тот же роут /sites/:siteId, что и карточка конечного объекта; SitePage решает
// по наличию дочерних, что рендерить.
export function SiteOverview({ site }: SiteOverviewProps) {
  const childrenQuery = useQuery({
    queryKey: ["sites", site.id, "children"],
    queryFn: () => sitesApi.listChildren(site.id),
  })

  const children = childrenQuery.data ?? []
  const kpis = computeKpis(children)

  const subtitle =
    childrenQuery.isError
      ? "Ошибка загрузки дочерних объектов"
      : children.length > 0
        ? `${children.length} ${pluralize(children.length, ["дочерний объект", "дочерних объекта", "дочерних объектов"])} · ${kpis.totalExtracted} параметр${pluralize(kpis.totalExtracted, ["", "а", "ов"])}`
        : "Нет дочерних объектов"

  return (
    <>
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-4">
          <div
            className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent-text"
            aria-hidden
          >
            {site.cover_image_path ? (
              <img
                src={site.cover_image_path}
                alt=""
                className="h-full w-full rounded-lg object-cover"
              />
            ) : (
              <Building2 size={26} />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-2xs uppercase tracking-wider text-fg-tertiary">
              Проект
            </div>
            <h1 className="mt-1 font-serif text-3xl leading-tight text-fg">
              {site.name}
            </h1>
            <div className="mt-1 text-sm text-fg-tertiary">
              {subtitle}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/sites/${site.id}/edit`}>
            <Button variant="ghost">Редактировать</Button>
          </Link>
          <Link to={`/compare?parentSiteId=${site.id}`}>
            <Button variant="secondary" leftIcon={<GitCompare size={14} />}>
              Сравнить очереди
            </Button>
          </Link>
          <Link to={`/sites/new?parentId=${site.id}`}>
            <Button leftIcon={<Plus size={14} />}>Новый объект</Button>
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Готовы" value={String(kpis.ready)} trend="accent" />
        <KpiCard
          label="Требуют внимания"
          value={String(kpis.attention)}
          trend={kpis.attention > 0 ? "warning" : "neutral"}
        />
        <KpiCard
          label="Среднее удорожание"
          value={
            kpis.avgInflation === null ? "—" : formatPercent(kpis.avgInflation)
          }
        />
        <KpiCard
          label="Худшее удорожание"
          value={
            kpis.worstInflation === null
              ? "—"
              : formatPercent(kpis.worstInflation)
          }
          trend={
            kpis.worstInflation !== null && kpis.worstInflation >= 5
              ? "warning"
              : "neutral"
          }
        />
      </div>

      <div className="mt-6">
        {childrenQuery.isLoading ? (
          <div className="h-40 animate-pulse rounded-lg border border-border-subtle bg-surface" />
        ) : childrenQuery.isError ? (
          <EmptyState
            title="Не удалось загрузить объекты"
            description="Проверьте соединение и попробуйте обновить страницу."
          />
        ) : children.length === 0 ? (
          <EmptyState
            title="У объекта нет дочерних"
            description="Создайте очередь, корпус или другой подобъект, чтобы начать работу."
            action={
              <Link to={`/sites/new?parentId=${site.id}`}>
                <Button leftIcon={<Plus size={14} />}>Новый объект</Button>
              </Link>
            }
          />
        ) : (
          <ChildrenTable items={children} />
        )}
      </div>
    </>
  )
}

interface ChildrenTableProps {
  items: SiteListItem[]
}

function ChildrenTable({ items }: ChildrenTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-section-header text-2xs uppercase tracking-wider text-fg-tertiary">
            <th className="px-4 py-2 text-left font-medium">Объект</th>
            <th className="px-4 py-2 text-left font-medium">Договоры</th>
            <th className="px-4 py-2 text-right font-medium">Параметры</th>
            <th className="px-4 py-2 text-right font-medium">Удорожание</th>
            <th className="px-4 py-2 text-left font-medium">Статус</th>
            <th className="px-4 py-2 text-right font-medium">Изменён</th>
          </tr>
        </thead>
        <tbody>
          {items.map((child) => {
            const status = aggregateStatusToPill(child.aggregate_status)
            const isAttention = child.aggregate_status === "attention"
            return (
              <tr
                key={child.id}
                className={cn(
                  "border-t border-border-subtle transition-colors hover:bg-surface-hover",
                  isAttention && "bg-warning-soft/40",
                )}
              >
                <td className="px-4 py-3">
                  <Link
                    to={`/sites/${child.id}`}
                    className="flex items-center gap-2.5 text-fg hover:text-accent-text"
                  >
                    <span
                      className={cn(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-md bg-accent-soft text-accent-text",
                        isAttention &&
                          "bg-warning-soft text-warning-text ring-1 ring-warning-border",
                      )}
                      aria-hidden
                    >
                      <Building2 size={14} />
                    </span>
                    <span className="truncate font-medium">{child.name}</span>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {child.contract_kinds.length === 0 ? (
                      <span className="text-fg-tertiary">—</span>
                    ) : (
                      child.contract_kinds.map((kind) => (
                        <ContractKindChip key={kind} kind={kind} short />
                      ))
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-fg-secondary">
                  {child.extracted_count}
                </td>
                <td
                  className={cn(
                    "px-4 py-3 text-right tabular-nums",
                    child.inflation_pct !== null && child.inflation_pct >= 5
                      ? "text-warning"
                      : "text-fg",
                  )}
                >
                  {child.inflation_pct === null
                    ? "—"
                    : formatPercent(child.inflation_pct)}
                </td>
                <td className="px-4 py-3">
                  <StatusPill {...status} />
                </td>
                <td className="px-4 py-3 text-right text-fg-tertiary">
                  {formatRelative(child.last_activity_at)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

interface ChildrenKpis {
  ready: number
  attention: number
  totalExtracted: number
  avgInflation: number | null
  worstInflation: number | null
}

function computeKpis(items: SiteListItem[]): ChildrenKpis {
  let ready = 0
  let attention = 0
  let totalExtracted = 0
  const inflations: number[] = []
  for (const item of items) {
    if (item.aggregate_status === "ready") ready += 1
    if (item.aggregate_status === "attention") attention += 1
    totalExtracted += item.extracted_count
    if (item.inflation_pct !== null) inflations.push(item.inflation_pct)
  }
  const avg =
    inflations.length === 0
      ? null
      : inflations.reduce((acc, x) => acc + x, 0) / inflations.length
  const worst =
    inflations.length === 0 ? null : inflations.reduce((a, b) => (a > b ? a : b))
  return {
    ready,
    attention,
    totalExtracted,
    avgInflation: avg,
    worstInflation: worst,
  }
}

function pluralize<T extends string>(n: number, forms: [T, T, T]): T {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
  return forms[2]
}
