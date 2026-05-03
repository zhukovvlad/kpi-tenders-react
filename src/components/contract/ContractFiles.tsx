import { Download, Eye, FileSpreadsheet, FileText, FileType, Plus } from "lucide-react"
import type { Document, ContractBundle } from "@/types/document"
import { CONTRACT_KINDS } from "@/types/contract"
import { Button } from "@/components/ui-domain/Button"
import { documentsApi } from "@/services/api/documents"
import { formatBytes } from "@/lib/format"

interface ContractFilesProps {
  bundle: ContractBundle
  onAddFile?: () => void
}

function iconFor(doc: Document) {
  if (doc.contract_kind === "estimate") return FileSpreadsheet
  if (doc.contract_kind === "tz") return FileText
  return FileType
}

function fileLabel(doc: Document): string {
  if (doc.display_name) return doc.display_name
  if (doc.contract_kind && doc.contract_kind !== "gp") {
    return CONTRACT_KINDS[doc.contract_kind].label
  }
  return doc.file_name
}

export function ContractFiles({ bundle, onAddFile }: ContractFilesProps) {
  const ordered: Document[] = [bundle.root, ...bundle.children]

  async function downloadDoc(doc: Document) {
    const url = await documentsApi.getPresignedUrl(doc.id, true)
    const a = document.createElement("a")
    a.href = url
    a.download = doc.file_name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  async function previewDoc(doc: Document) {
    const url = await documentsApi.getPresignedUrl(doc.id, false)
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
      <div className="border-b border-border-subtle bg-section-header px-4 py-2 text-2xs uppercase tracking-wider text-fg-tertiary">
        Файлы договора
      </div>
      <ul>
        {ordered.map((doc) => {
          const Icon = iconFor(doc)
          return (
            <li
              key={doc.id}
              className="flex items-center gap-3 border-b border-border-subtle px-4 py-2.5 last:border-b-0"
            >
              <Icon size={16} className="shrink-0 text-fg-tertiary" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-fg">{fileLabel(doc)}</div>
                <div className="truncate text-2xs text-fg-tertiary">
                  {doc.file_name} · {formatBytes(doc.file_size_bytes)}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Eye size={12} />}
                  onClick={() => previewDoc(doc)}
                >
                  Просмотр
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Download size={12} />}
                  onClick={() => downloadDoc(doc)}
                >
                  Скачать
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
      <div className="border-t border-border-subtle bg-surface-sunken px-4 py-2">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Plus size={12} />}
          onClick={onAddFile}
          disabled={!onAddFile}
        >
          Добавить файл
        </Button>
      </div>
    </div>
  )
}
