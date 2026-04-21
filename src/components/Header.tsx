import { useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"

interface HeaderProps {
  onLoginClick: () => void
  onRegisterClick: () => void
}

export function Header({ onLoginClick, onRegisterClick }: HeaderProps) {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  function handleLoginClick() {
    if (isAuthenticated) {
      navigate("/dashboard")
    } else {
      onLoginClick()
    }
  }
  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-transparent backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-white">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-indigo-400">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-sm font-medium tracking-wide">Tender Analysis</span>
        </Link>

        {/* Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          <a href="#product" className="text-sm text-white/60 transition-colors hover:text-white">Product</a>
          <a href="#pricing" className="text-sm text-white/60 transition-colors hover:text-white">Pricing</a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={handleLoginClick}
          >
            Login
          </Button>
          {!isAuthenticated && (
            <Button
              className="bg-indigo-600 text-white hover:bg-indigo-500"
              onClick={onRegisterClick}
            >
              Register
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
