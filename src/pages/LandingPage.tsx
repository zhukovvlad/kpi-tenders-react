import { Link, useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { ArrowRight, Files, GitCompare, TrendingUp } from "lucide-react"
import { Logo } from "@/components/layout/Logo"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { Button } from "@/components/ui-domain/Button"
import { useAuth } from "@/hooks/useAuth"

const SCENARIOS = [
  {
    icon: Files,
    title: "Извлечение параметров",
    description:
      "Загружаете договор подряда — получаете срок, аванс, объёмы и стоимость в виде таблицы. Без ручного выписывания и без потери в стилях формулировок.",
  },
  {
    icon: GitCompare,
    title: "Сравнение договоров",
    description:
      "Сопоставление двух и более ГП-договоров одного типа: общие параметры, подсветка минимума и максимума, экспорт в Excel.",
  },
  {
    icon: TrendingUp,
    title: "Мониторинг удорожания",
    description:
      "Сводка по ценам поставщиков и базовому листу материалов из договора. Когда цена арматуры или бетона уезжает — узнаёте сразу.",
    soon: true,
  },
] as const

export default function LandingPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true })
  }, [isAuthenticated, navigate])

  return (
    <div className="flex min-h-screen flex-col bg-page text-fg">
      <header className="border-b border-border-subtle bg-page/85 backdrop-blur-md">
        <div className="container-page flex h-14 items-center justify-between">
          <Logo to="/" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login">
              <Button variant="secondary" size="sm">
                Войти
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="container-page py-20 md:py-32">
          <div className="max-w-3xl">
            <div className="mb-3 text-2xs uppercase tracking-wider text-fg-tertiary">
              Tender Analysis · для тендерных дирекций
            </div>
            <h1 className="font-serif text-4xl leading-tight text-fg md:text-6xl">
              Анализ генподрядных договоров и удорожания проектов
            </h1>
            <p className="mt-6 max-w-2xl text-md leading-relaxed text-fg-secondary md:text-lg">
              Семантическое извлечение параметров договоров, сравнение
              генподрядных оферт по объектам и контроль удорожания материалов
              на базе сметы. Спокойный, плотный язык — без визарда из десяти
              шагов.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/login">
                <Button size="lg" rightIcon={<ArrowRight size={16} />}>
                  Войти
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="secondary" size="lg">
                  Запросить демо
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Сценарии */}
        <section className="border-t border-border-subtle bg-surface-sunken">
          <div className="container-page py-16 md:py-24">
            <div className="mb-10 max-w-2xl">
              <div className="mb-2 text-2xs uppercase tracking-wider text-fg-tertiary">
                Что внутри
              </div>
              <h2 className="text-2xl font-medium text-fg">
                Три сценария, выстроенные вокруг объекта строительства
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {SCENARIOS.map(({ icon: Icon, title, description, ...rest }) => (
                <div
                  key={title}
                  className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface p-5"
                >
                  <div className="grid h-9 w-9 place-items-center rounded-md bg-accent-soft text-accent-text">
                    <Icon size={16} />
                  </div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-md font-medium text-fg">{title}</h3>
                    {"soon" in rest && rest.soon && (
                      <span className="rounded-sm bg-neutral-soft px-1.5 py-0.5 text-2xs uppercase tracking-wider text-neutral-text">
                        Скоро
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-fg-secondary">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border-subtle">
        <div className="container-page flex h-14 items-center justify-between text-xs text-fg-tertiary">
          <span>© Tender Analysis · KPI Tenders</span>
          <span>Multi-tenant SaaS</span>
        </div>
      </footer>
    </div>
  )
}
