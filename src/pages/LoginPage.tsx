import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { isAxiosError } from "axios"
import { useAuth } from "@/hooks/useAuth"
import { Logo } from "@/components/layout/Logo"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { Button } from "@/components/ui-domain/Button"

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login({ email, password })
      navigate("/dashboard", { replace: true })
    } catch (caught) {
      const message =
        isAxiosError(caught) && caught.response?.data?.message
          ? caught.response.data.message
          : "Не удалось войти. Проверьте email и пароль."
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <header className="border-b border-border-subtle">
        <div className="container-page flex h-14 items-center justify-between">
          <Logo to="/" />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-6">
            <h1 className="font-serif text-3xl text-fg">Вход</h1>
            <p className="mt-1 text-sm text-fg-secondary">
              Учётная запись тендерной дирекции
            </p>
          </div>
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-lg border border-border-subtle bg-surface p-5"
          >
            <Field
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={setEmail}
              required
            />
            <Field
              label="Пароль"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={setPassword}
              required
            />
            {error && (
              <div className="rounded-md border border-danger-border bg-danger-soft px-3 py-2 text-xs text-danger-text">
                {error}
              </div>
            )}
            <Button type="submit" loading={submitting} className="w-full">
              Войти
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-fg-tertiary">
            Ещё нет аккаунта?{" "}
            <Link to="/register" className="text-accent hover:text-accent-hover underline underline-offset-2">
              Зарегистрировать организацию
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

interface FieldProps {
  label: string
  type?: string
  value: string
  autoComplete?: string
  required?: boolean
  onChange: (next: string) => void
}

function Field({ label, type = "text", value, autoComplete, required, onChange }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-fg-tertiary">{label}</span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-md border border-border-default bg-surface-sunken px-3 py-2 text-sm text-fg placeholder:text-fg-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
      />
    </label>
  )
}
