import { type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
  icon?: ReactNode
}

export function EmptyState({
  title,
  description,
  action,
  className,
  icon,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg hairline-dashed bg-surface-sunken px-6 py-12 text-center",
        className,
      )}
    >
      {icon && <div className="text-fg-tertiary">{icon}</div>}
      <div className="font-serif text-xl text-fg">{title}</div>
      {description && (
        <div className="max-w-md text-sm text-fg-secondary">{description}</div>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
