import { useState, type FormEvent } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { GlassCard } from "@/components/GlassCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [orgName, setOrgName] = useState("")
  const [inn, setInn] = useState("")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await register({
        name: orgName,
        inn: inn || undefined,
        full_name: fullName,
        email,
        password,
      })
      navigate("/dashboard", { replace: true })
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Registration failed. Please try again."
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020617]">
      {/* Ambient spheres */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-1/4 h-[400px] w-[400px] rounded-full bg-purple-700/30 blur-[120px]" />
        <div className="absolute -right-10 bottom-1/4 h-[400px] w-[400px] rounded-full bg-indigo-600/30 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm px-4 py-10">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-indigo-400">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-lg font-medium text-white">Tender Analysis</span>
        </div>

        <GlassCard className="p-8">
          <h1 className="mb-1 text-xl font-semibold text-white">Create account</h1>
          <p className="mb-6 text-sm text-white/40">Register your organisation</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="org-name" className="text-white/60">Organisation name</Label>
              <Input
                id="org-name"
                type="text"
                autoComplete="organization"
                placeholder="Acme LLC"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
                className="border-white/10 bg-white/5 text-white placeholder:text-white/20 focus-visible:ring-indigo-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="inn" className="text-white/60">
                INN{" "}
                <span className="text-white/30">(optional)</span>
              </Label>
              <Input
                id="inn"
                type="text"
                inputMode="numeric"
                placeholder="1234567890"
                value={inn}
                onChange={(e) => setInn(e.target.value)}
                maxLength={12}
                className="border-white/10 bg-white/5 text-white placeholder:text-white/20 focus-visible:ring-indigo-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="full-name" className="text-white/60">Full name</Label>
              <Input
                id="full-name"
                type="text"
                autoComplete="name"
                placeholder="Ivan Ivanov"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="border-white/10 bg-white/5 text-white placeholder:text-white/20 focus-visible:ring-indigo-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-white/60">Email</Label>
              <Input
                id="email"
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
              <Label htmlFor="password" className="text-white/60">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
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
              className="mt-2 bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isSubmitting ? "Creating account…" : "Create account"}
            </Button>
          </form>
        </GlassCard>

        <p className="mt-6 text-center text-sm text-white/30">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
