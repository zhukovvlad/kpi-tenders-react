import { Link, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, RotateCw, ShieldCheck } from "lucide-react"
import { extractionApi } from "@/services/api/extraction"
import type { ExtractionRequestStatus } from "@/types/extraction"
import { Button } from "@/components/ui-domain/Button"
import { PageHeader } from "@/components/ui-domain/PageHeader"
import { Surface } from "@/components/ui-domain/Surface"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

const STATUS_META: Record<
  ExtractionRequestStatus,
  { label: string; tone: string; Icon: typeof Loader2 }
> = {
  pending: {
    label: "Ждёт подготовки",
    tone: "text-fg-secondary",
    Icon: Loader2,
  },
  running: {
    label: "Извлечение в работе",
    tone: "text-fg-secondary",
    Icon: Loader2,
  },
  completed: {
    label: "Готов",
    tone: "text-accent-text",
    Icon: CheckCircle2,
  },
  failed: {
    label: "Ошибка",
    tone: "text-warning-text",
    Icon: AlertCircle,
  },
}

export default function ExtractionRequestPage() {
  const { siteId, docId, requestId } = useParams<{
    siteId: string
    docId: string
    requestId: string
  }>()

  const queryClient = useQueryClient()

  const requestQuery = useQuery({
    queryKey: ["extraction-requests", requestId],
    queryFn: () => extractionApi.get(requestId!),
    enabled: !!requestId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === "pending" || status === "running" ? 1500 : false
    },
  })

  const repeatMutation = useMutation({
    mutationFn: () => {
      const original = requestQuery.data
      if (!original) return Promise.reject(new Error("no request"))
      return extractionApi.initiate(original.document_id, {
        questions: original.questions,
        anonymize: original.anonymize,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["documents", docId, "extraction-requests"],
      })
    },
  })

  if (!siteId || !docId || !requestId) return null

  const request = requestQuery.data
  const meta = request ? STATUS_META[request.status] : null
  const isPending =
    request?.status === "pending" || request?.status === "running"

  return (
    <div className="container-page py-8">
      <Link
        to={`/sites/${siteId}/documents/${docId}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-fg-tertiary transition-colors hover:text-fg"
      >
        <ArrowLeft size={14} /> К договору
      </Link>

      {requestQuery.isLoading || !request || !meta ? (
        <div className="h-32 animate-pulse rounded-lg border border-border-subtle bg-surface" />
      ) : (
        <>
          <PageHeader
            serif
            title={`Запрос от ${formatDate(request.created_at)}`}
            subtitle={
              <span className={cn("inline-flex items-center gap-1.5", meta.tone)}>
                <meta.Icon
                  size={14}
                  className={isPending ? "animate-spin" : ""}
                />
                {meta.label}
              </span>
            }
            meta={
              <span>
                Документ {request.document_id.slice(0, 8)}… ·{" "}
                {request.anonymize ? (
                  <span className="inline-flex items-center gap-1 text-accent-text">
                    <ShieldCheck size={12} /> С анонимизацией
                  </span>
                ) : (
                  <span>Без анонимизации</span>
                )}
              </span>
            }
            actions={
              <Button
                variant="secondary"
                leftIcon={<RotateCw size={14} />}
                loading={repeatMutation.isPending}
                onClick={() => repeatMutation.mutate()}
              >
                Повторить запрос
              </Button>
            }
          />

          {request.error_message && (
            <div className="mt-4 rounded-md border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger-text">
              <div className="font-medium">Ошибка обработки</div>
              <div className="mt-1 text-xs">{request.error_message}</div>
            </div>
          )}

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <Surface padded>
              <h2 className="mb-3 text-2xs font-medium uppercase tracking-wider text-fg-tertiary">
                Заданные вопросы
              </h2>
              <ul className="space-y-2">
                {request.questions.map((q, i) => (
                  <li
                    key={i}
                    className="rounded-md bg-surface-sunken px-3 py-2 text-sm text-fg"
                  >
                    {q}
                  </li>
                ))}
              </ul>
            </Surface>

            <Surface padded>
              <h2 className="mb-3 text-2xs font-medium uppercase tracking-wider text-fg-tertiary">
                Полученные значения
              </h2>
              {request.answers && request.answers.length > 0 ? (
                <ul className="space-y-2">
                  {request.answers.map((a) => (
                    <li
                      key={a.key_name}
                      className="flex items-baseline justify-between gap-3 rounded-md bg-surface-sunken px-3 py-2"
                    >
                      <span className="text-xs text-fg-tertiary">
                        {a.key_name}
                      </span>
                      <span className="text-sm font-medium text-fg">
                        {a.extracted_value ?? "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-md hairline-dashed bg-surface-sunken px-3 py-4 text-center text-xs text-fg-tertiary">
                  {isPending
                    ? "Подождите — значения появятся, когда воркер закончит обработку."
                    : "Нет значений."}
                </div>
              )}
            </Surface>

            {request.resolved_schema && request.resolved_schema.length > 0 && (
              <Surface padded className="lg:col-span-2">
                <h2 className="mb-3 text-2xs font-medium uppercase tracking-wider text-fg-tertiary">
                  Схема ключей (resolved_schema)
                </h2>
                <div className="overflow-hidden rounded-md border border-border-subtle">
                  <table className="w-full text-sm">
                    <thead className="bg-section-header text-2xs uppercase tracking-wider text-fg-tertiary">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Ключ</th>
                        <th className="px-3 py-2 text-left font-medium">Тип</th>
                      </tr>
                    </thead>
                    <tbody>
                      {request.resolved_schema.map((s) => (
                        <tr
                          key={s.key_name}
                          className="border-t border-border-subtle"
                        >
                          <td className="px-3 py-2 text-fg">{s.key_name}</td>
                          <td className="px-3 py-2 text-fg-tertiary">
                            {s.data_type}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Surface>
            )}
          </div>
        </>
      )}
    </div>
  )
}
