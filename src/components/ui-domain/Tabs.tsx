import { useId, type ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface TabItem<T extends string> {
  key: T
  label: string
  count?: number
  disabled?: boolean
}

interface TabsProps<T extends string> {
  items: TabItem<T>[]
  active: T
  onChange: (next: T) => void
  className?: string
  rightSlot?: ReactNode
}

export function Tabs<T extends string>({
  items,
  active,
  onChange,
  className,
  rightSlot,
}: TabsProps<T>) {
  const groupId = useId()
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-border-subtle",
        className,
      )}
      role="tablist"
    >
      <div className="flex items-end gap-1">
        {items.map((item) => {
          const isActive = item.key === active
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`${groupId}-${item.key}`}
              disabled={item.disabled}
              onClick={() => onChange(item.key)}
              className={cn(
                "relative -mb-px border-b-2 px-3 py-2.5 text-sm transition-colors duration-150",
                isActive
                  ? "border-accent text-fg"
                  : "border-transparent text-fg-secondary hover:text-fg",
                item.disabled && "cursor-not-allowed opacity-50",
              )}
            >
              {item.label}
              {typeof item.count === "number" && (
                <span className="ml-1.5 text-2xs text-fg-tertiary">
                  · {item.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
      {rightSlot && <div className="pb-2">{rightSlot}</div>}
    </div>
  )
}
