import { type HTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/utils"

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  tone?: "surface" | "sunken"
  padded?: boolean
}

export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(
  function Surface({ className, tone = "surface", padded = false, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border border-border-subtle",
          tone === "surface" ? "bg-surface" : "bg-surface-sunken",
          padded && "p-5",
          className,
        )}
        {...props}
      />
    )
  },
)
