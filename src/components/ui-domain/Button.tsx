import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from "react"
import { cn } from "@/lib/utils"

type Variant = "primary" | "secondary" | "ghost" | "link" | "danger"
type Size = "sm" | "md" | "lg"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  loading?: boolean
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-action text-action-text hover:bg-action-hover disabled:opacity-50",
  secondary:
    "border border-border-default bg-transparent text-fg-secondary hover:bg-surface-hover hover:text-fg disabled:opacity-50",
  ghost:
    "text-fg-secondary hover:bg-surface-hover hover:text-fg disabled:opacity-50",
  link: "text-accent underline underline-offset-2 hover:text-accent-hover",
  danger:
    "border border-danger-border bg-danger-soft text-danger-text hover:bg-danger-soft/80",
}

const SIZES: Record<Size, string> = {
  sm: "px-2.5 py-1 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      leftIcon,
      rightIcon,
      loading,
      className,
      disabled,
      children,
      type,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-page",
          VARIANTS[variant],
          variant !== "link" && SIZES[size],
          loading && "cursor-progress",
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
        ) : (
          leftIcon
        )}
        {children}
        {rightIcon}
      </button>
    )
  },
)
