import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ChevronRight, FileUp, Plus } from "lucide-react"
import { documentsApi } from "@/services/api/documents"
import {
  CONTRACT_KINDS,
  CONTRACT_KINDS_ORDER,
  type ContractKind,
} from "@/types/contract"
import type { ContractBundle } from "@/types/document"
import { Button } from "@/components/ui-domain/Button"
import { ContractKindChip } from "@/components/ui-domain/ContractKindChip"
import { formatRelative } from "@/lib/format"

interface ContractsTabProps {
  siteId: string
  onUpload?: (kind?: ContractKind) => void
}

export function ContractsTab({ siteId, onUpload }: ContractsTabProps) {
  const bundlesQuery = useQuery({
    queryKey: ["sites", siteId, "bundles"],
    queryFn: () => documentsApi.bundlesForSite(siteId),
  })

  if (bundlesQuery.isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-lg border border-border-subtle bg-surface"
          />
        ))}
      </div>
    )
  }

  const bundles = bundlesQuery.data ?? []
  const byKind = new Map<ContractKind, ContractBundle[]>()
  bundles.forEach((b) => {
    const list = byKind.get(b.contract_kind) ?? []
    list.push(b)
    byKind.set(b.contract_kind, list)
  })

  return (
    <div className="space-y-6">
      {CONTRACT_KINDS_ORDER.map((kind) => {
        const list = byKind.get(kind) ?? []
        const meta = CONTRACT_KINDS[kind]
        return (
          <section key={kind}>
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-2xs font-medium uppercase tracking-wider text-fg-tertiary">
                {meta.label}
              </h3>
              <span className="text-2xs text-fg-tertiary">· {list.length}</span>
            </div>
            {list.length > 0 ? (
              <div className="space-y-2">
                {list.map((bundle) => (
                  <BundleRow key={bundle.id} siteId={siteId} bundle={bundle} />
                ))}
                <button
                  type="button"
                  onClick={() => onUpload?.(kind)}
                  className="flex w-full items-center justify-center gap-1 rounded-lg hairline-dashed bg-surface-sunken px-3 py-2.5 text-xs text-fg-tertiary transition-colors hover:bg-surface-hover hover:text-fg"
                >
                  <Plus size={12} /> Добавить ещё один договор {meta.shortLabel.toLowerCase()}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-lg hairline-dashed bg-surface-sunken px-4 py-4">
                <span className="text-sm text-fg-tertiary">
                  Документы не загружены
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<FileUp size={12} />}
                  onClick={() => onUpload?.(kind)}
                >
                  Загрузить договор
                </Button>
              </div>
            )}
          </section>
        )
      })}

      <div className="border-t border-border-subtle pt-4">
        <Button
          variant="secondary"
          leftIcon={<Plus size={14} />}
          onClick={() => onUpload?.()}
        >
          Добавить документ
        </Button>
      </div>
    </div>
  )
}

function BundleRow({ bundle, siteId }: { bundle: ContractBundle; siteId: string }) {
  const filesCount = 1 + bundle.children.length
  return (
    <Link
      to={`/sites/${siteId}/documents/${bundle.root.id}`}
      className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface px-4 py-3 transition-colors hover:bg-surface-hover"
    >
      <ContractKindChip kind={bundle.contract_kind} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-fg">
          {bundle.root.display_name ?? bundle.root.file_name}
        </div>
        <div className="mt-0.5 truncate text-xs text-fg-tertiary">
          {filesCount} файл{plural(filesCount, ["", "а", "ов"])} ·{" "}
          {bundle.extracted_count} параметров · обновлён{" "}
          {formatRelative(bundle.last_activity_at)}
        </div>
      </div>
      <ChevronRight size={16} className="shrink-0 text-fg-tertiary" />
    </Link>
  )
}

function plural(n: number, forms: [string, string, string]): string {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return forms[0]
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return forms[1]
  return forms[2]
}
