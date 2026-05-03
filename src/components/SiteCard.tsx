import { Link } from "react-router-dom"
import { Building2 } from "lucide-react"
import type { SiteListItem } from "@/types/site"
import { ContractKindChip } from "@/components/ui-domain/ContractKindChip"
import { StatusPill } from "@/components/ui-domain/StatusPill"
import { aggregateStatusToPill } from "@/lib/site-status"
import { formatPercent, formatRelative } from "@/lib/format"
import { cn } from "@/lib/utils"

interface SiteCardProps {
  site: SiteListItem
}

export function SiteCard({ site }: SiteCardProps) {
  const status = aggregateStatusToPill(site.aggregate_status)
  const breadcrumb = site.breadcrumbs.length > 0
    ? site.breadcrumbs.join(" → ")
    : null

  const inflationLabel =
    site.inflation_pct === null
      ? "не подключено"
      : formatPercent(site.inflation_pct)
  const inflationTone =
    site.inflation_pct !== null && site.inflation_pct >= 5
      ? "text-warning"
      : "text-fg"

  return (
    <Link
      to={`/sites/${site.id}`}
      className="group flex flex-col rounded-lg border border-border-subtle bg-surface p-4 transition-colors duration-150 hover:border-border-default hover:bg-surface-hover"
    >
      <div className="flex gap-3">
        <div
          className="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-accent-soft text-accent-text"
          aria-hidden
        >
          {site.cover_image_path ? (
            <img
              src={site.cover_image_path}
              alt=""
              className="h-full w-full rounded-md object-cover"
            />
          ) : (
            <Building2 size={22} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          {breadcrumb && (
            <div className="mb-0.5 truncate text-2xs uppercase tracking-wider text-fg-tertiary">
              {breadcrumb}
            </div>
          )}
          <div className="truncate text-md font-medium text-fg">
            {site.name}
          </div>
          <div className="mt-0.5 truncate text-xs text-fg-secondary">
            {site.contract_kinds.length > 0
              ? `${site.contract_kinds.length} тип${pluralize(site.contract_kinds.length, ["", "а", "ов"])} договоров · ${site.extracted_count} параметров`
              : "Документы не загружены"}
          </div>
        </div>
        <StatusPill {...status} className="shrink-0 self-start" />
      </div>

      {site.contract_kinds.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {site.contract_kinds.map((kind) => (
            <ContractKindChip key={kind} kind={kind} short />
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-3 text-xs">
        <div>
          <div className="text-fg-tertiary">Удорожание</div>
          <div className={cn("text-sm font-medium", inflationTone)}>
            {site.inflation_pct === null
              ? <span className="text-fg-tertiary">{inflationLabel}</span>
              : inflationLabel}
          </div>
        </div>
        <div className="text-right">
          <div className="text-fg-tertiary">Изменён</div>
          <div className="text-sm text-fg-secondary">
            {formatRelative(site.last_activity_at)}
          </div>
        </div>
      </div>
    </Link>
  )
}

function pluralize(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
  return forms[2]
}
