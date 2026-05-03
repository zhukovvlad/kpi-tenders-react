import { NavLink } from "react-router-dom"
import { Logo } from "./Logo"
import { ThemeToggle } from "./ThemeToggle"
import { UserMenu } from "./UserMenu"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"

interface NavItem {
  to: string
  label: string
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Объекты" },
  { to: "/compare", label: "Сравнение" },
  { to: "/keys", label: "Ключи" },
]

export function TopNav() {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-sticky border-b border-border-subtle bg-page/85 backdrop-blur-md">
      <div className="container-page flex h-14 items-center gap-6">
        <Logo to="/dashboard" />
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) =>
            item.adminOnly && user?.role !== "admin" ? null : (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-1.5 text-sm transition-colors duration-150",
                    isActive
                      ? "bg-surface text-fg"
                      : "text-fg-secondary hover:bg-surface-hover hover:text-fg",
                  )
                }
              >
                {item.label}
              </NavLink>
            ),
          )}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
