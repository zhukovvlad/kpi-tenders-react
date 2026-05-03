import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // next-themes требует монтажа, чтобы знать актуальную тему — иначе SSR-style mismatch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  const current = (mounted ? (theme === "system" ? resolvedTheme : theme) : "dark") ?? "dark"
  const isDark = current === "dark"

  return (
    <button
      type="button"
      aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md border border-border-subtle bg-surface text-fg-secondary transition-colors duration-150 hover:bg-surface-hover hover:text-fg",
        className,
      )}
    >
      {isDark ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  )
}
