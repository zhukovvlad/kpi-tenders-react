import { Lock, Settings as SettingsIcon, Users } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { Surface } from "@/components/ui-domain/Surface"
import { PageHeader } from "@/components/ui-domain/PageHeader"
import { EmptyState } from "@/components/ui-domain/EmptyState"

export default function SettingsPage() {
  const { user } = useAuth()

  if (user?.role !== "admin") {
    return (
      <div className="container-page py-8">
        <EmptyState
          icon={<Lock size={20} />}
          title="Раздел доступен только администраторам"
          description="Настройки тенанта может изменять пользователь с ролью admin вашей организации."
        />
      </div>
    )
  }

  return (
    <div className="container-page py-8">
      <PageHeader
        serif
        title="Настройки организации"
        subtitle="Реквизиты, пользователи и пороги для всей организации."
      />

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Surface padded>
          <div className="mb-3 flex items-center gap-2 text-2xs font-medium uppercase tracking-wider text-fg-tertiary">
            <SettingsIcon size={12} /> Реквизиты
          </div>
          <dl className="space-y-3 text-sm">
            <Row label="Название организации" value="Мок Демо ГК" />
            <Row label="ИНН" value="—" />
            <Row label="Идентификатор тенанта" value={user.org_id} mono />
          </dl>
          <p className="mt-4 text-xs text-fg-tertiary">
            Редактирование реквизитов появится, когда бекенд начнёт принимать
            PATCH /api/v1/organizations/me. Сейчас раздел работает в read-only.
          </p>
        </Surface>

        <Surface padded>
          <div className="mb-3 flex items-center gap-2 text-2xs font-medium uppercase tracking-wider text-fg-tertiary">
            <Users size={12} /> Пользователи
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between rounded-md bg-surface-sunken px-3 py-2">
              <div>
                <div className="text-fg">{user.full_name}</div>
                <div className="text-2xs text-fg-tertiary">{user.email}</div>
              </div>
              <span className="rounded-sm bg-accent-soft px-2 py-0.5 text-2xs uppercase tracking-wider text-accent-text">
                admin
              </span>
            </li>
          </ul>
          <p className="mt-3 text-xs text-fg-tertiary">
            Приглашение участников и смена ролей подключатся вместе с
            эндпоинтами /api/v1/users.
          </p>
        </Surface>

        <Surface padded className="lg:col-span-2">
          <div className="mb-3 text-2xs font-medium uppercase tracking-wider text-fg-tertiary">
            Пороги
          </div>
          <ul className="space-y-3 text-sm">
            <li className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-fg">Удорожание, при котором объект попадает в «Требуют внимания»</div>
                <div className="text-2xs text-fg-tertiary">organizations.settings.attention_inflation_pct</div>
              </div>
              <span className="rounded-md border border-border-subtle bg-surface-sunken px-3 py-1.5 text-sm text-fg">
                +5,0%
              </span>
            </li>
          </ul>
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
