import { ShieldCheck } from "lucide-react"
import { EmptyState } from "@/components/ui-domain/EmptyState"

export function AuditTab() {
  return (
    <EmptyState
      icon={<ShieldCheck size={20} />}
      title="Аудит обработки"
      description="Артефакты пайплайна (convert_md, anonymize_doc, anonymize_entities), карта замен и логи воркера document_tasks. Раздел подключим к API задач, как только бекенд станет доступен."
    />
  )
}
