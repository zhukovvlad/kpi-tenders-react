import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { ExtractedDataItem } from "@/types/extraction-key"
import { Button } from "@/components/ui-domain/Button"

interface ParametersTableProps {
  items: ExtractedDataItem[]
  initialLimit?: number
}

export function ParametersTable({
  items,
  initialLimit = 10,
}: ParametersTableProps) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? items : items.slice(0, initialLimit)
  const hidden = items.length - visible.length

  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border-subtle bg-section-header text-left text-2xs uppercase tracking-wider text-fg-tertiary">
            <th className="px-4 py-2.5 font-medium">Параметр</th>
            <th className="px-4 py-2.5 font-medium">Значение</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((item) => (
            <tr
              key={item.id}
              className="border-b border-border-subtle last:border-b-0 hover:bg-surface-hover"
            >
              <td className="w-1/2 px-4 py-2.5 text-sm text-fg-secondary">
                {item.key.display_name ?? item.key.key_name}
              </td>
              <td className="px-4 py-2.5 text-sm font-medium text-fg">
                {item.extracted_value ?? (
                  <span className="text-fg-tertiary">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length > initialLimit && (
        <div className="border-t border-border-subtle bg-surface-sunken px-4 py-2 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((v) => !v)}
            rightIcon={
              expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />
            }
          >
            {expanded ? "Свернуть" : `Показать ещё ${hidden}`}
          </Button>
        </div>
      )}
    </div>
  )
}
