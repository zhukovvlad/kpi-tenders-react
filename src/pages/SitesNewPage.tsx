import { useState, type FormEvent } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useDropzone } from "react-dropzone"
import { ArrowLeft, ImagePlus, X } from "lucide-react"
import { sitesApi } from "@/services/api/sites"
import { Button } from "@/components/ui-domain/Button"
import { PageHeader } from "@/components/ui-domain/PageHeader"
import { logger } from "@/lib/logger"

export default function SitesNewPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Альтернативный вход с промежуточного экрана родителя — поле «Родитель»
  // предзаполняется из ?parentId= в URL.
  const [searchParams] = useSearchParams()
  const initialParentId = searchParams.get("parentId") ?? ""

  const [name, setName] = useState("")
  const [parentId, setParentId] = useState<string>(initialParentId)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sitesQuery = useQuery({
    queryKey: ["sites", "list"],
    queryFn: sitesApi.list,
  })

  const createMutation = useMutation({
    mutationFn: sitesApi.create,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["sites"] })
      logger.info("Site created", { id: created.id })
      navigate(`/sites/${created.id}`, { replace: true })
    },
    onError: () => setError("Не удалось создать объект. Попробуйте ещё раз."),
  })

  const dropzone = useDropzone({
    accept: { "image/*": [] },
    maxFiles: 1,
    onDrop: (files) => {
      const file = files[0]
      if (!file) return
      // Заглушка: показываем local preview через ObjectURL.
      // В реальном API будет отдельный upload endpoint, возвращающий storage_path.
      const url = URL.createObjectURL(file)
      setCoverPreview(url)
    },
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      setError("Укажите название объекта")
      return
    }
    setError(null)
    createMutation.mutate({
      name: name.trim(),
      parent_id: parentId || null,
      cover_image_path: coverPreview,
    })
  }

  return (
    <div className="container-page py-8">
      <Link
        to="/dashboard"
        className="mb-4 inline-flex items-center gap-1 text-sm text-fg-tertiary transition-colors hover:text-fg"
      >
        <ArrowLeft size={14} /> К списку объектов
      </Link>

      <PageHeader
        serif
        title="Новый объект"
        subtitle="Заведите карточку — потом туда лягут договоры и параметры."
      />

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid max-w-3xl gap-5 rounded-lg border border-border-subtle bg-surface p-5"
      >
        <Field label="Название" required>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например, ЖК Сити Бей · 6-я очередь"
            className="block w-full rounded-md border border-border-default bg-surface-sunken px-3 py-2 text-sm text-fg placeholder:text-fg-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </Field>

        <Field label="Родительский объект" hint="Опционально — для иерархии ЖК → очередь → корпус.">
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="block w-full rounded-md border border-border-default bg-surface-sunken px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            <option value="">— нет родителя —</option>
            {(sitesQuery.data ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Обложка" hint="JPG / PNG, опционально.">
          {coverPreview ? (
            <div className="relative h-40 w-full overflow-hidden rounded-md border border-border-subtle bg-surface-sunken">
              <img
                src={coverPreview}
                alt="Превью обложки"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => setCoverPreview(null)}
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full border border-border-subtle bg-surface text-fg-secondary transition-colors hover:bg-surface-hover hover:text-fg"
                aria-label="Убрать обложку"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div
              {...dropzone.getRootProps()}
              className={`flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-md hairline-dashed bg-surface-sunken text-center transition-colors ${
                dropzone.isDragActive ? "border-accent bg-accent-soft" : ""
              }`}
            >
              <input {...dropzone.getInputProps()} />
              <ImagePlus size={20} className="text-fg-tertiary" />
              <div className="text-sm text-fg-secondary">
                Перетащите изображение или кликните, чтобы выбрать
              </div>
            </div>
          )}
        </Field>

        {error && (
          <div className="rounded-md border border-danger-border bg-danger-soft px-3 py-2 text-xs text-danger-text">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <Link to="/dashboard">
            <Button variant="secondary">Отмена</Button>
          </Link>
          <Button type="submit" loading={createMutation.isPending}>
            Создать объект
          </Button>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs text-fg-tertiary">
          {label}
          {required && <span className="text-warning"> *</span>}
        </span>
        {hint && <span className="text-2xs text-fg-tertiary">{hint}</span>}
      </div>
      {children}
    </label>
  )
}
