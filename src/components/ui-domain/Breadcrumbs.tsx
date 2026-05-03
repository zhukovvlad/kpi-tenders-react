import { Fragment } from "react"
import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
  label: string
  to?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

// Хлебные крошки для иерархии «Объекты › ЖК › Очередь › Корпус».
// Последний элемент — текущий (без ссылки).
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) return null
  return (
    <nav
      aria-label="Хлебные крошки"
      className={cn(
        "flex flex-wrap items-center gap-1 text-sm text-fg-tertiary",
        className,
      )}
    >
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1
        return (
          <Fragment key={`${item.label}-${idx}`}>
            {item.to && !isLast ? (
              <Link
                to={item.to}
                className="transition-colors hover:text-fg"
              >
                {item.label}
              </Link>
            ) : (
              <span className={cn(isLast && "text-fg-secondary")}>
                {item.label}
              </span>
            )}
            {!isLast && (
              <ChevronRight
                size={12}
                className="text-fg-tertiary"
                aria-hidden
              />
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}
