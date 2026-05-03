import { type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  eyebrow?: string
  title: string
  subtitle?: ReactNode
  meta?: ReactNode
  actions?: ReactNode
  serif?: boolean
  className?: string
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  meta,
  actions,
  serif = false,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-1 text-2xs uppercase tracking-wider text-fg-tertiary">
            {eyebrow}
          </div>
        )}
        <h1
          className={cn(
            "leading-tight text-fg",
            serif ? "font-serif text-3xl" : "text-2xl font-medium",
          )}
        >
          {title}
        </h1>
        {subtitle && (
          <div className="mt-1 text-sm text-fg-secondary">{subtitle}</div>
        )}
        {meta && (
          <div className="mt-2 text-sm text-fg-tertiary">{meta}</div>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}
