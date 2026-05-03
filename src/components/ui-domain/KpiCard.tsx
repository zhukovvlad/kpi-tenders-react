import { cn } from "@/lib/utils"

interface KpiCardProps {
  label: string
  value: string
  trend?: "neutral" | "warning" | "accent"
  hint?: string
  className?: string
}

export function KpiCard({
  label,
  value,
  trend = "neutral",
  hint,
  className,
}: KpiCardProps) {
  const valueClass =
    trend === "warning"
      ? "text-warning"
      : trend === "accent"
        ? "text-accent-text"
        : "text-fg"

  const borderClass =
    trend === "warning" ? "border-warning-border" : "border-border-subtle"

  return (
    <div
      className={cn(
        "rounded-md border bg-surface px-3.5 py-3",
        borderClass,
        className,
      )}
    >
      <div className="mb-1 text-2xs uppercase tracking-wider text-fg-tertiary">
        {label}
      </div>
      <div className={cn("text-xl font-medium", valueClass)}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-fg-tertiary">{hint}</div>}
    </div>
  )
}
