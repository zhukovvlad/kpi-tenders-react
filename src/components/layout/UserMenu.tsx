import { useState } from "react"
import { Link } from "react-router-dom"
import { LogOut, Settings, User as UserIcon } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"

function initials(fullName: string | undefined): string {
  if (!fullName) return "—"
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "—"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)

  if (!user) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        className={cn(
          "flex items-center gap-2 rounded-md border border-border-subtle bg-surface px-2 py-1 transition-colors duration-150 hover:bg-surface-hover",
          open && "bg-surface-hover",
        )}
      >
        <span className="grid h-6 w-6 place-items-center rounded-full bg-accent-soft text-2xs font-medium text-accent-text">
          {initials(user.full_name)}
        </span>
        <span className="hidden text-sm text-fg sm:inline">
          {user.full_name}
        </span>
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-popover mt-2 w-56 overflow-hidden rounded-md border border-border-subtle bg-surface shadow-popover"
          role="menu"
        >
          <div className="border-b border-border-subtle px-3 py-2.5">
            <div className="text-sm font-medium text-fg">{user.full_name}</div>
            <div className="text-xs text-fg-tertiary">{user.email}</div>
          </div>
          <Link
            to="/profile"
            className="flex items-center gap-2 px-3 py-2 text-sm text-fg-secondary transition-colors hover:bg-surface-hover hover:text-fg"
          >
            <UserIcon size={14} /> Профиль
          </Link>
          {user.role === "admin" && (
            <Link
              to="/settings"
              className="flex items-center gap-2 px-3 py-2 text-sm text-fg-secondary transition-colors hover:bg-surface-hover hover:text-fg"
            >
              <Settings size={14} /> Настройки организации
            </Link>
          )}
          <button
            type="button"
            onClick={() => logout()}
            className="flex w-full items-center gap-2 border-t border-border-subtle px-3 py-2 text-left text-sm text-fg-secondary transition-colors hover:bg-surface-hover hover:text-fg"
          >
            <LogOut size={14} /> Выйти
          </button>
        </div>
      )}
    </div>
  )
}
