import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useDropzone } from "react-dropzone"
import { FileUp, Loader2, X } from "lucide-react"
import { documentsApi } from "@/services/api/documents"
import {
  CONTRACT_KINDS,
  CONTRACT_KINDS_ORDER,
  type ContractKind,
} from "@/types/contract"
import { Button } from "@/components/ui-domain/Button"
import { formatBytes } from "@/lib/format"

interface UploadDocumentDialogProps {
  siteId: string
  initialKind?: ContractKind
  bundleId?: string
  onClose: () => void
}

// Компонент монтируется родителем только при открытии — стейт инициализируется
// свежим initialKind при каждом монтировании, без useEffect-резета.
export function UploadDocumentDialog({
  siteId,
  initialKind,
  bundleId,
  onClose,
}: UploadDocumentDialogProps) {
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [kind, setKind] = useState<ContractKind>(initialKind ?? "gp")

  const dropzone = useDropzone({
    multiple: false,
    onDrop: (files) => {
      if (files[0]) setFile(files[0])
    },
  })

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!file) return Promise.reject(new Error("no file"))
      return documentsApi.upload({
        file,
        siteId,
        contractKind: kind,
        bundleId,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites", siteId] })
      queryClient.invalidateQueries({ queryKey: ["sites", "dashboard"] })
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/40 px-4 py-8">
      <div className="w-full max-w-md overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-modal">
        <header className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
          <h3 className="text-md font-medium text-fg">Загрузить документ</h3>
          <button
            type="button"
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-md text-fg-tertiary transition-colors hover:bg-surface-hover hover:text-fg"
            aria-label="Закрыть"
          >
            <X size={14} />
          </button>
        </header>
        <div className="space-y-4 p-5">
          <div>
            <div className="mb-1 text-xs text-fg-tertiary">Тип документа</div>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as ContractKind)}
              className="block w-full rounded-md border border-border-default bg-surface-sunken px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              <optgroup label="Договоры">
                {CONTRACT_KINDS_ORDER.map((k) => (
                  <option key={k} value={k}>
                    {CONTRACT_KINDS[k].label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Приложения">
                {(["estimate", "tz", "responsibility_matrix"] as ContractKind[]).map(
                  (k) => (
                    <option key={k} value={k}>
                      {CONTRACT_KINDS[k].label}
                    </option>
                  ),
                )}
              </optgroup>
            </select>
          </div>

          <div>
            <div className="mb-1 text-xs text-fg-tertiary">Файл</div>
            {file ? (
              <div className="flex items-center justify-between rounded-md border border-border-default bg-surface-sunken px-3 py-2 text-sm">
                <div className="min-w-0 flex-1 truncate text-fg">
                  {file.name}
                </div>
                <span className="ml-2 shrink-0 text-2xs text-fg-tertiary">
                  {formatBytes(file.size)}
                </span>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="ml-2 grid h-6 w-6 place-items-center rounded-md text-fg-tertiary transition-colors hover:bg-surface-hover hover:text-fg"
                  aria-label="Убрать файл"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div
                {...dropzone.getRootProps()}
                className={`flex h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-md hairline-dashed bg-surface-sunken text-center transition-colors ${
                  dropzone.isDragActive ? "border-accent bg-accent-soft" : ""
                }`}
              >
                <input {...dropzone.getInputProps()} />
                <FileUp size={16} className="text-fg-tertiary" />
                <div className="text-xs text-fg-secondary">
                  Перетащите файл или кликните для выбора
                </div>
              </div>
            )}
          </div>
        </div>
        <footer className="flex items-center justify-end gap-2 border-t border-border-subtle px-5 py-3">
          <Button variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button
            disabled={!file}
            loading={uploadMutation.isPending}
            onClick={() => uploadMutation.mutate()}
            leftIcon={uploadMutation.isPending ? <Loader2 size={14} /> : undefined}
          >
            Загрузить
          </Button>
        </footer>
      </div>
    </div>
  )
}
