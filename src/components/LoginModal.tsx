import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface LoginModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  warning?: string | null
  onSwitchToRegister?: () => void
}

export function LoginModal({ open, onOpenChange, warning, onSwitchToRegister }: LoginModalProps) {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await login({ email, password })
      onOpenChange(false)
      navigate("/dashboard", { replace: true })
    } catch {
      setError("Invalid email or password")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#0a0f1e]/90 backdrop-blur-xl sm:max-w-sm">
        <DialogHeader>
          <div className="mb-2 flex justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-indigo-400">
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <DialogTitle className="text-center text-white">Welcome back</DialogTitle>
          <DialogDescription className="text-center text-white/40">
            Sign in to your account
          </DialogDescription>
        </DialogHeader>

        {warning && (
          <p className="rounded-lg bg-yellow-500/10 px-4 py-2 text-center text-sm text-yellow-400">
            {warning}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="modal-email" className="text-white/60">
              Email
            </Label>
            <Input
              id="modal-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-white/10 bg-white/5 text-white placeholder:text-white/20 focus-visible:ring-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="modal-password" className="text-white/60">
              Password
            </Label>
            <Input
              id="modal-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-white/10 bg-white/5 text-white placeholder:text-white/20 focus-visible:ring-indigo-500"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>

          {onSwitchToRegister && (
            <p className="text-center text-sm text-white/30">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-indigo-400 hover:text-indigo-300"
              >
                Register
              </button>
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
