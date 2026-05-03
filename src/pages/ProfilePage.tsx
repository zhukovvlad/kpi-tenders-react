import { LogOut } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui-domain/Button"
import { Surface } from "@/components/ui-domain/Surface"
import { PageHeader } from "@/components/ui-domain/PageHeader"

export default function ProfilePage() {
  const { user, logout } = useAuth()

  if (!user) return null

  return (
    <div className="container-page py-8">
      <PageHeader
        serif
        title="Профиль"
        subtitle="Личные данные и сессия."
      />

      <div className="mt-6 grid max-w-2xl gap-5">
        <Surface padded>
          <div className="mb-3 text-2xs font-medium uppercase tracking-wider text-fg-tertiary">
            Учётная запись
          </div>
          <dl className="space-y-3 text-sm">
            <Row label="Имя" value={user.full_name} />
            <Row label="Email" value={user.email} />
            <Row
              label="Роль"
              value={user.role === "admin" ? "Администратор" : "Участник"}
            />
            <Row label="Идентификатор" value={user.id} mono />
          </dl>
        </Surface>

        <Surface padded>
          <div className="mb-3 text-2xs font-medium uppercase tracking-wider text-fg-tertiary">
            Безопасность
          </div>
          <p className="text-sm text-fg-secondary">
            Смена пароля будет доступна, как только бекенд предоставит endpoint
            POST /api/v1/auth/change-password.
          </p>
          <Button variant="secondary" className="mt-3" disabled>
            Сменить пароль
          </Button>
        </Surface>

        <Surface padded>
          <div className="mb-3 text-2xs font-medium uppercase tracking-wider text-fg-tertiary">
            Сессия
          </div>
          <Button
            variant="secondary"
            leftIcon={<LogOut size={14} />}
            onClick={() => logout()}
          >
            Выйти
          </Button>
        </Surface>
      </div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-xs text-fg-tertiary">{label}</dt>
      <dd className={mono ? "font-mono text-xs text-fg-secondary" : "text-fg"}>
        {value}
      </dd>
    </div>
  )
}
