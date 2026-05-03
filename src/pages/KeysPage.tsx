import { useMemo, useState, type FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Pencil, Plus, Search, Trash2, X } from "lucide-react"
import { keysApi } from "@/services/api/keys"
import type { ExtractionKey, ExtractionDataType } from "@/types/extraction-key"
import { Button } from "@/components/ui-domain/Button"
import { PageHeader } from "@/components/ui-domain/PageHeader"
import { useAuth } from "@/hooks/useAuth"
import { formatDateShort } from "@/lib/format"
import { cn } from "@/lib/utils"

type Filter = "all" | "system" | "tenant"

const DATA_TYPE_LABEL: Record<ExtractionDataType, string> = {
  string: "строка",
  number: "число",
  date: "дата",
  boolean: "логический",
}

export default function KeysPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  const queryClient = useQueryClient()

  const keysQuery = useQuery({ queryKey: ["keys"], queryFn: keysApi.list })
  const [filter, setFilter] = useState<Filter>("all")
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<ExtractionKey | null>(null)
  const [creating, setCreating] = useState(false)

  const filtered = useMemo(() => {
    const list = keysQuery.data ?? []
    return list.filter((k) => {
      if (filter === "system" && k.organization_id !== null) return false
      if (filter === "tenant" && k.organization_id === null) return false
      if (search.trim().length === 0) return true
      const q = search.toLowerCase()
      return (
        (k.display_name ?? "").toLowerCase().includes(q) ||
        k.key_name.toLowerCase().includes(q) ||
        k.source_query.toLowerCase().includes(q)
      )
    })
  }, [keysQuery.data, filter, search])

  return (
    <div className="container-page py-8">
      <PageHeader
        serif
        title="Справочник ключей"
        subtitle="Параметры, по которым извлекаются данные из договоров. Системные ключи общие для всех тенантов; тенантные — ваши."
        actions={
          isAdmin && (
            <Button leftIcon={<Plus size={14} />} onClick={() => setCreating(true)}>
              Создать ключ
            </Button>
          )
        }
      />

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-tertiary"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию или вопросу"
            className="w-full rounded-md border border-border-subtle bg-surface py-2 pl-9 pr-3 text-sm text-fg placeholder:text-fg-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
        <div className="flex gap-1">
          {[
            { key: "all" as const, label: "Все" },
            { key: "system" as const, label: "Системные" },
            { key: "tenant" as const, label: "Моей организации" },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors duration-150",
                filter === f.key
                  ? "border-accent-border bg-accent-soft text-accent-text"
                  : "border-border-subtle bg-transparent text-fg-secondary hover:bg-surface-hover hover:text-fg",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-border-subtle bg-surface">
        <table className="w-full">
          <thead className="bg-section-header text-2xs uppercase tracking-wider text-fg-tertiary">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Параметр</th>
              <th className="px-4 py-2.5 text-left font-medium">Источник</th>
              <th className="px-4 py-2.5 text-left font-medium">Тип</th>
              <th className="px-4 py-2.5 text-right font-medium">Документов</th>
              <th className="px-4 py-2.5 text-left font-medium">Создан</th>
              <th className="w-1 px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {keysQuery.isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-fg-tertiary">
                  Загрузка ключей…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-fg-tertiary">
                  Ничего не найдено.
                </td>
              </tr>
            ) : (
              filtered.map((key) => {
                const isSystem = key.organization_id === null
                return (
                  <tr
                    key={key.id}
                    className="border-t border-border-subtle hover:bg-surface-hover"
                  >
                    <td className="px-4 py-2.5 text-sm">
                      <div className="font-medium text-fg">
                        {key.display_name ?? key.key_name}
                      </div>
                      {key.display_name && (
                        <div className="text-2xs text-fg-tertiary">
                          {key.key_name}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-fg-secondary">
                      <div className="line-clamp-2 max-w-md">{key.source_query}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="rounded-sm bg-surface-sunken px-1.5 py-0.5 text-2xs uppercase tracking-wider text-fg-tertiary">
                        {DATA_TYPE_LABEL[key.data_type]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm text-fg-secondary">
                      {key.document_count ?? 0}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-fg-tertiary">
                      {formatDateShort(key.created_at)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {!isSystem && isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Pencil size={12} />}
                          onClick={() => setEditing(key)}
                        >
                          Изменить
                        </Button>
                      )}
                      {isSystem && (
                        <span className="text-2xs text-fg-tertiary">Системный</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <KeyEditDialog
          keyEntry={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["keys"] })
            setEditing(null)
          }}
        />
      )}
      {creating && (
        <KeyCreateDialog
          onClose={() => setCreating(false)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["keys"] })
            setCreating(false)
          }}
        />
      )}
    </div>
  )
}

interface KeyEditDialogProps {
  keyEntry: ExtractionKey
  onClose: () => void
  onSaved: () => void
}

function KeyEditDialog({ keyEntry, onClose, onSaved }: KeyEditDialogProps) {
  const [displayName, setDisplayName] = useState(keyEntry.display_name ?? "")
  const [sourceQuery, setSourceQuery] = useState(keyEntry.source_query)

  const updateMutation = useMutation({
    mutationFn: () =>
      keysApi.update(keyEntry.id, {
        display_name: displayName || null,
        source_query: sourceQuery,
      }),
    onSuccess: onSaved,
  })

  const deleteMutation = useMutation({
    mutationFn: () => keysApi.delete(keyEntry.id),
    onSuccess: onSaved,
  })

  return (
    <Dialog title={`Изменить ключ ${keyEntry.key_name}`} onClose={onClose}>
      <div className="space-y-4 p-5">
        <Field label="Человекочитаемое имя">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="block w-full rounded-md border border-border-default bg-surface-sunken px-3 py-2 text-sm text-fg placeholder:text-fg-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </Field>
        <Field label="Исходный вопрос">
          <textarea
            value={sourceQuery}
            onChange={(e) => setSourceQuery(e.target.value)}
            rows={3}
            className="block w-full resize-y rounded-md border border-border-default bg-surface-sunken px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </Field>
      </div>
      <footer className="flex items-center justify-between gap-2 border-t border-border-subtle px-5 py-3">
        <Button
          variant="danger"
          leftIcon={<Trash2 size={12} />}
          loading={deleteMutation.isPending}
          onClick={() => {
            if (confirm(`Удалить ключ ${keyEntry.key_name}? Это каскадно удалит значения из документов.`)) {
              deleteMutation.mutate()
            }
          }}
        >
          Удалить
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>Отмена</Button>
          <Button onClick={() => updateMutation.mutate()} loading={updateMutation.isPending}>
            Сохранить
          </Button>
        </div>
      </footer>
    </Dialog>
  )
}

interface KeyCreateDialogProps {
  onClose: () => void
  onSaved: () => void
}

function KeyCreateDialog({ onClose, onSaved }: KeyCreateDialogProps) {
  const [keyName, setKeyName] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [sourceQuery, setSourceQuery] = useState("")
  const [dataType, setDataType] = useState<ExtractionDataType>("string")

  const createMutation = useMutation({
    mutationFn: () =>
      keysApi.create({
        key_name: keyName,
        display_name: displayName || null,
        source_query: sourceQuery,
        data_type: dataType,
      }),
    onSuccess: onSaved,
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!keyName || !sourceQuery) return
    createMutation.mutate()
  }

  return (
    <Dialog title="Новый ключ" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 p-5">
        <Field label="Машинное имя (key_name)" hint="Латиница и подчёркивания, до 50 символов">
          <input
            type="text"
            value={keyName}
            onChange={(e) =>
              setKeyName(
                e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
              )
            }
            required
            className="block w-full rounded-md border border-border-default bg-surface-sunken px-3 py-2 font-mono text-sm text-fg focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </Field>
        <Field label="Человекочитаемое имя">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="block w-full rounded-md border border-border-default bg-surface-sunken px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </Field>
        <Field label="Исходный вопрос">
          <textarea
            value={sourceQuery}
            onChange={(e) => setSourceQuery(e.target.value)}
            rows={3}
            required
            className="block w-full resize-y rounded-md border border-border-default bg-surface-sunken px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </Field>
        <Field label="Тип данных">
          <select
            value={dataType}
            onChange={(e) => setDataType(e.target.value as ExtractionDataType)}
            className="block w-full rounded-md border border-border-default bg-surface-sunken px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            <option value="string">Строка</option>
            <option value="number">Число</option>
            <option value="date">Дата</option>
            <option value="boolean">Логический</option>
          </select>
        </Field>
        <div className="flex justify-end gap-2 border-t border-border-subtle pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" loading={createMutation.isPending}>
            Создать
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs text-fg-tertiary">{label}</span>
        {hint && <span className="text-2xs text-fg-tertiary">{hint}</span>}
      </div>
      {children}
    </label>
  )
}

function Dialog({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/40 px-4 py-8">
      <div className="w-full max-w-lg overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-modal">
        <header className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
          <h3 className="text-md font-medium text-fg">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-md text-fg-tertiary transition-colors hover:bg-surface-hover hover:text-fg"
            aria-label="Закрыть"
          >
            <X size={14} />
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}
