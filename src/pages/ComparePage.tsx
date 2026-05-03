import { useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Download, Save, Search } from "lucide-react"
import { documentsApi } from "@/services/api/documents"
import { extractionApi } from "@/services/api/extraction"
import { sitesApi } from "@/services/api/sites"
import {
  CONTRACT_KINDS,
  CONTRACT_KINDS_ORDER,
  type ContractKind,
} from "@/types/contract"
import type { Document } from "@/types/document"
import type { ExtractionKey } from "@/types/extraction-key"
import { Button } from "@/components/ui-domain/Button"
import { PageHeader } from "@/components/ui-domain/PageHeader"
import { EmptyState } from "@/components/ui-domain/EmptyState"
import { ContractKindChip } from "@/components/ui-domain/ContractKindChip"
import { cn } from "@/lib/utils"

export default function ComparePage() {
  const [searchParams] = useSearchParams()
  const baseDocId = searchParams.get("baseDocId") ?? null
  const initialKind =
    (searchParams.get("kind") as ContractKind | null) ?? "gp"

  const [contractKind, setContractKind] = useState<ContractKind>(initialKind)
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(
    () => new Set(baseDocId ? [baseDocId] : []),
  )
  const [search, setSearch] = useState("")
  const [showAll, setShowAll] = useState(false)

  const docsQuery = useQuery({
    queryKey: ["documents", "all"],
    queryFn: () => documentsApi.list(),
  })
  const sitesQuery = useQuery({
    queryKey: ["sites", "list"],
    queryFn: () => sitesApi.list(),
  })

  // Кандидаты — корневые documents выбранного contract_kind
  const candidates = useMemo(() => {
    const docs = docsQuery.data ?? []
    return docs
      .filter((d) => d.contract_kind === contractKind && d.bundle_id === d.id)
      .filter((d) => {
        if (search.trim().length === 0) return true
        const q = search.toLowerCase()
        const site = sitesQuery.data?.find((s) => s.id === d.site_id)
        return (
          d.file_name.toLowerCase().includes(q) ||
          (d.display_name ?? "").toLowerCase().includes(q) ||
          (site?.name ?? "").toLowerCase().includes(q)
        )
      })
  }, [docsQuery.data, contractKind, search, sitesQuery.data])

  // При смене contract_kind документы из других типов автоматически выпадают —
  // фильтруем выбор на лету по списку допустимых документов вместо useEffect-resync.
  const selectedIds = useMemo(() => {
    const allowed = new Set(
      (docsQuery.data ?? [])
        .filter((d) => d.contract_kind === contractKind)
        .map((d) => d.id),
    )
    return Array.from(selectedDocs).filter((id) => allowed.has(id))
  }, [selectedDocs, docsQuery.data, contractKind])

  // Тянем answers по выбранным документам параллельно
  const answersQueries = useQuery({
    queryKey: ["compare", "answers", selectedIds.sort().join(",")],
    queryFn: async () => {
      const all = await Promise.all(
        selectedIds.map((id) => extractionApi.answersForDocument(id)),
      )
      return all
    },
    enabled: selectedIds.length > 0,
  })

  // Сводим answers в матрицу: keyId × docId → value
  const matrix = useMemo(() => {
    if (!answersQueries.data) return null
    const keyMap = new Map<string, ExtractionKey>()
    const cell = new Map<string, Map<string, string | null>>()
    answersQueries.data.forEach((items, idx) => {
      const docId = selectedIds[idx]
      const docCell = cell.get(docId) ?? new Map<string, string | null>()
      items.forEach((item) => {
        keyMap.set(item.key.id, item.key)
        docCell.set(item.key.id, item.extracted_value)
      })
      cell.set(docId, docCell)
    })

    const intersectionKeys = Array.from(keyMap.values()).filter((key) => {
      if (showAll) return true
      return selectedIds.every((id) => cell.get(id)?.has(key.id))
    })

    return { keys: intersectionKeys, cell }
  }, [answersQueries.data, selectedIds, showAll])

  return (
    <div className="container-page py-8">
      <PageHeader
        serif
        title="Сравнение договоров"
        subtitle="Сопоставление параметров двух и более документов одного типа."
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              leftIcon={<Save size={14} />}
              disabled={selectedIds.length < 2}
            >
              Сохранить сравнение
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Download size={14} />}
              disabled={selectedIds.length < 2}
            >
              В Excel
            </Button>
          </div>
        }
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Левая панель — выбор */}
        <aside className="space-y-4">
          <div>
            <div className="mb-1 text-xs text-fg-tertiary">Тип договора</div>
            <select
              value={contractKind}
              onChange={(e) => setContractKind(e.target.value as ContractKind)}
              className="block w-full rounded-md border border-border-default bg-surface px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              {CONTRACT_KINDS_ORDER.map((k) => (
                <option key={k} value={k}>
                  {CONTRACT_KINDS[k].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-tertiary"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по объекту или договору"
                className="w-full rounded-md border border-border-subtle bg-surface py-2 pl-9 pr-3 text-sm text-fg placeholder:text-fg-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface">
            <div className="border-b border-border-subtle px-3 py-2 text-2xs uppercase tracking-wider text-fg-tertiary">
              Договоры в этом типе ({candidates.length})
            </div>
            {candidates.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-fg-tertiary">
                Нет документов выбранного типа.
              </div>
            ) : (
              <ul className="max-h-[480px] overflow-y-auto">
                {candidates.map((doc) => {
                  const site = sitesQuery.data?.find(
                    (s) => s.id === doc.site_id,
                  )
                  const checked = selectedDocs.has(doc.id)
                  return (
                    <li key={doc.id}>
                      <label
                        className={cn(
                          "flex cursor-pointer items-start gap-2 border-b border-border-subtle px-3 py-2 last:border-b-0 transition-colors",
                          checked
                            ? "bg-accent-soft/40"
                            : "hover:bg-surface-hover",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            setSelectedDocs((prev) => {
                              const next = new Set(prev)
                              if (e.target.checked) next.add(doc.id)
                              else next.delete(doc.id)
                              return next
                            })
                          }}
                          className="mt-0.5 h-3.5 w-3.5 rounded-sm border-border-default text-accent focus:ring-accent/30"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm text-fg">
                            {doc.display_name ?? doc.file_name}
                          </div>
                          {site && (
                            <div className="truncate text-2xs text-fg-tertiary">
                              {site.name}
                            </div>
                          )}
                        </div>
                      </label>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <label className="flex items-center gap-2 text-xs text-fg-secondary">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
              className="h-3.5 w-3.5 rounded-sm border-border-default text-accent focus:ring-accent/30"
            />
            Показать все ключи (включая пропуски)
          </label>
        </aside>

        {/* Правая панель — таблица сравнения */}
        <section>
          {selectedIds.length < 2 ? (
            <EmptyState
              title="Выберите 2–5 договоров для сравнения"
              description="В IA Tender Analysis сравнение работает на уровне договора одного типа. Подсветка минимума и максимума включается автоматически по числовым значениям."
            />
          ) : (
            <CompareTable
              keys={matrix?.keys ?? []}
              cell={matrix?.cell ?? new Map()}
              docIds={selectedIds}
              docs={docsQuery.data ?? []}
              sites={sitesQuery.data ?? []}
              contractKind={contractKind}
              loading={answersQueries.isLoading}
            />
          )}
        </section>
      </div>
    </div>
  )
}

interface CompareTableProps {
  keys: ExtractionKey[]
  cell: Map<string, Map<string, string | null>>
  docIds: string[]
  docs: Document[]
  sites: Array<{ id: string; name: string }>
  contractKind: ContractKind
  loading: boolean
}

function CompareTable({
  keys,
  cell,
  docIds,
  docs,
  sites,
  contractKind,
  loading,
}: CompareTableProps) {
  if (loading)
    return (
      <div className="h-64 animate-pulse rounded-lg border border-border-subtle bg-surface" />
    )

  if (keys.length === 0)
    return (
      <EmptyState
        title="Нет общих параметров"
        description="У выбранных договоров нет ни одного пересекающегося ключа. Включите «Показать все ключи», чтобы увидеть пропуски."
      />
    )

  return (
    <div className="overflow-x-auto rounded-lg border border-border-subtle bg-surface">
      <table className="w-full">
        <thead className="bg-section-header">
          <tr className="border-b border-border-subtle">
            <th className="sticky left-0 z-10 min-w-[200px] bg-section-header px-4 py-3 text-left text-2xs uppercase tracking-wider text-fg-tertiary">
              Параметр
            </th>
            {docIds.map((id) => {
              const doc = docs.find((d) => d.id === id)
              const site = sites.find((s) => s.id === doc?.site_id)
              return (
                <th
                  key={id}
                  className="min-w-[180px] border-l border-border-subtle px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-1.5">
                    <ContractKindChip kind={contractKind} />
                  </div>
                  <div className="mt-1 truncate text-sm font-medium text-fg">
                    {doc?.display_name ?? doc?.file_name}
                  </div>
                  {site && (
                    <div className="truncate text-2xs text-fg-tertiary">
                      {site.name}
                    </div>
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {keys.map((key) => {
            // Для числовых типов вычисляем min/max по выбранным документам
            const numericValues: Array<{ id: string; n: number }> = []
            const isNumeric = key.data_type === "number"
            if (isNumeric) {
              docIds.forEach((id) => {
                const v = cell.get(id)?.get(key.id) ?? null
                const n = parseNumeric(v)
                if (n !== null) numericValues.push({ id, n })
              })
            }
            const min = numericValues.reduce(
              (a, b) => (a === null || b.n < a ? b.n : a),
              null as number | null,
            )
            const max = numericValues.reduce(
              (a, b) => (a === null || b.n > a ? b.n : a),
              null as number | null,
            )

            return (
              <tr key={key.id} className="border-b border-border-subtle last:border-b-0">
                <td className="sticky left-0 z-10 bg-surface px-4 py-2.5 text-sm text-fg-secondary">
                  {key.display_name ?? key.key_name}
                </td>
                {docIds.map((id) => {
                  const value = cell.get(id)?.get(key.id) ?? null
                  const n = parseNumeric(value)
                  let tone: "min" | "max" | null = null
                  if (
                    isNumeric &&
                    n !== null &&
                    numericValues.length > 1 &&
                    min !== max
                  ) {
                    if (n === min) tone = "min"
                    else if (n === max) tone = "max"
                  }
                  return (
                    <td
                      key={id}
                      className={cn(
                        "border-l border-border-subtle px-4 py-2.5 text-sm",
                        tone === "min" &&
                          "bg-accent-soft font-medium text-accent-text",
                        tone === "max" &&
                          "bg-warning-soft font-medium text-warning",
                        !tone && "font-medium text-fg",
                      )}
                    >
                      {value ?? (
                        <button
                          type="button"
                          className="text-2xs text-accent underline underline-offset-2 hover:text-accent-hover"
                          title="Запустить точечное извлечение для этой ячейки"
                        >
                          извлечь
                        </button>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// Извлекает число из значений вида «20%», «18», «1 240 000 ₽» — для подсветки min/max.
function parseNumeric(value: string | null): number | null {
  if (!value) return null
  const cleaned = value.replace(/[\s\u00a0\u202f]/g, "").replace(",", ".")
  const match = cleaned.match(/-?\d+(?:\.\d+)?/)
  if (!match) return null
  const n = Number(match[0])
  return isNaN(n) ? null : n
}
