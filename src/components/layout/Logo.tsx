import { Link } from "react-router-dom"

export function Logo({ to = "/dashboard" }: { to?: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 transition-opacity hover:opacity-80"
    >
      <span className="grid h-7 w-7 place-items-center rounded-md bg-action text-action-text">
        <span className="font-serif text-base leading-none">T</span>
      </span>
      <span className="font-serif text-lg leading-none text-fg">
        Tender Analysis
      </span>
    </Link>
  )
}
