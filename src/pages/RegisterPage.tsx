import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { isAxiosError } from "axios"
import { useAuth } from "@/hooks/useAuth"
import { Logo } from "@/components/layout/Logo"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { Button } from "@/components/ui-domain/Button"

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [orgName, setOrgName] = useState("")
  const [inn, setInn] = useState("")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await register({
        name: orgName,
        inn: inn || undefined,
        full_name: fullName,
        email,
        password,
      })
      navigate("/dashboard", { replace: true })
    } catch (caught) {
      const message =
        isAxiosError(caught) && caught.response?.data?.message
          ? caught.response.data.message
          : "Не удалось зарегистрировать организацию."
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
        <div className="w-full max-w-md">
          <div className="mb-6">
            <h1 className="font-serif text-3xl text-fg">Новая организация</h1>
            <p className="mt-1 text-sm text-fg-secondary">
              Заведите тенант — туда лягут все ваши объекты, договоры и
              извлечённые параметры.
            </p>
          </div>
          <form
            onSubmit={handleSubmit}
            className="grid gap-4 rounded-lg border border-border-subtle bg-surface p-5 sm:grid-cols-2"
          >
            <Field
              label="Название организации"
              value={orgName}
              onChange={setOrgName}
              required
              className="sm:col-span-2"
            />
            <Field label="ИНН" value={inn} onChange={setInn} />
            <Field
              label="Имя ответственного"
              value={fullName}
              onChange={setFullName}
              required
            />
            <Field
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={setEmail}
              required
              className="sm:col-span-2"
            />
            <Field
              label="Пароль"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={setPassword}
              required
              className="sm:col-span-2"
            />
            {error && (
              <div className="rounded-md border border-danger-border bg-danger-soft px-3 py-2 text-xs text-danger-text sm:col-span-2">
                {error}
              </div>
            )}
            <Button
              type="submit"
              loading={submitting}
              className="w-full sm:col-span-2"
            >
              Зарегистрировать
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-fg-tertiary">
            Уже есть аккаунт?{" "}
            <Link to="/login" className="text-accent hover:text-accent-hover underline underline-offset-2">
              Войти
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
  className?: string
}

function Field({
  label,
  type = "text",
  value,
  autoComplete,
  required,
  onChange,
  className,
}: FieldProps) {
  return (
    <label className={`block ${className ?? ""}`}>
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
