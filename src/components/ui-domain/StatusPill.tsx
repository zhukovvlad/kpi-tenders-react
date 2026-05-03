import { cn } from "@/lib/utils"

export type StatusTone = "ready" | "processing" | "attention" | "empty" | "info"

interface StatusPillProps {
  tone: StatusTone
  label: string
  className?: string
}

// Стили задаются токенами темы — pill корректно меняется при light↔dark.
const TONE_STYLES: Record<
  StatusTone,
  { bg: string; border: string; text: string; dot: string }
> = {
  ready: {
    bg: "bg-accent-soft",
    border: "border-accent-border",
    text: "text-accent-text",
    dot: "bg-accent",
  },
  processing: {
    bg: "bg-neutral-soft",
    border: "border-neutral-border",
    text: "text-neutral-text",
    dot: "bg-neutral-dot",
  },
  attention: {
    bg: "bg-warning-soft",
    border: "border-warning-border",
    text: "text-warning-text",
    dot: "bg-warning",
  },
  empty: {
    bg: "bg-surface-sunken",
    border: "border-border-subtle",
    text: "text-fg-tertiary",
    dot: "bg-fg-tertiary",
  },
  info: {
    bg: "bg-info-soft",
    border: "border-info-border",
    text: "text-info-text",
    dot: "bg-info",
  },
}

export function StatusPill({ tone, label, className }: StatusPillProps) {
  const styles = TONE_STYLES[tone]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium",
        styles.bg,
        styles.border,
        styles.text,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} />
      {label}
    </span>
  )
}

