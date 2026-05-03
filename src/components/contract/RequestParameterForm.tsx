import { useState, type FormEvent } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Send, ShieldCheck } from "lucide-react"
import { extractionApi } from "@/services/api/extraction"
import { Button } from "@/components/ui-domain/Button"
import { logger } from "@/lib/logger"

interface RequestParameterFormProps {
  documentId: string
}

export function RequestParameterForm({ documentId }: RequestParameterFormProps) {
  const queryClient = useQueryClient()
  const [question, setQuestion] = useState("")
  const [anonymize, setAnonymize] = useState(true)
  const [success, setSuccess] = useState(false)

  const initiateMutation = useMutation({
    mutationFn: () =>
      extractionApi.initiate(documentId, {
        questions: [question.trim()],
        anonymize,
      }),
    onSuccess: () => {
      setQuestion("")
      setSuccess(true)
      queryClient.invalidateQueries({
        queryKey: ["documents", documentId, "answers"],
      })
      queryClient.invalidateQueries({
        queryKey: ["documents", documentId, "extraction-requests"],
      })
      logger.info("Extraction request initiated", { documentId })
      window.setTimeout(() => setSuccess(false), 3000)
    },
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (question.trim().length < 5) return
    initiateMutation.mutate()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-border-subtle bg-surface p-4"
    >
      <div className="mb-2 text-sm font-medium text-fg">
        Запросить новый параметр
      </div>
      <div className="text-xs text-fg-tertiary">
        Сформулируйте вопрос на естественном языке — система подберёт ключ и
        извлечёт значение из документа.
      </div>
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        rows={2}
        placeholder="Например: какова длина свайного поля в метрах?"
        className="mt-3 block w-full resize-y rounded-md border border-border-default bg-surface-sunken px-3 py-2 text-sm text-fg placeholder:text-fg-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs text-fg-secondary">
          <input
            type="checkbox"
            checked={anonymize}
            onChange={(e) => setAnonymize(e.target.checked)}
            className="h-3.5 w-3.5 rounded-sm border-border-default text-accent focus:ring-accent/30"
          />
          <span className="inline-flex items-center gap-1">
            <ShieldCheck size={12} className="text-fg-tertiary" />С анонимизацией перед отправкой во внешнюю LLM
          </span>
        </label>
        <Button
          type="submit"
          size="sm"
          loading={initiateMutation.isPending}
          leftIcon={<Send size={12} />}
          disabled={question.trim().length < 5}
        >
          Отправить
        </Button>
      </div>
      {success && (
        <div className="mt-3 rounded-md border border-accent-border bg-accent-soft px-3 py-2 text-xs text-accent-text">
          Запрос принят. Значение появится в таблице параметров автоматически.
        </div>
      )}
      {initiateMutation.isError && (
        <div className="mt-3 rounded-md border border-danger-border bg-danger-soft px-3 py-2 text-xs text-danger-text">
          Не удалось запустить извлечение. Попробуйте ещё раз.
        </div>
      )}
    </form>
  )
}
