import { LogOut, Bell, User, ShieldCheck, BarChart3, TrendingUp, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"

interface Module {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  accent: string
  glow: string
  orb: string
  available: boolean
}

const MODULES: Module[] = [
  {
    id: "depersonalization",
    title: "Деперсонализация",
    description: "Автоматическое удаление персональных данных из тендерной документации перед анализом",
    icon: <ShieldCheck className="h-7 w-7" />,
    accent: "from-violet-500/20 to-purple-600/10",
    glow: "bg-violet-500/30",
    orb: "bg-violet-600/20",
    available: true,
  },
  {
    id: "key-params",
    title: "Ключевые параметры",
    description: "Извлечение и структурирование ключевых условий, сроков и требований из тендера",
    icon: <BarChart3 className="h-7 w-7" />,
    accent: "from-sky-500/20 to-cyan-600/10",
    glow: "bg-sky-500/30",
    orb: "bg-sky-600/20",
    available: true,
  },
  {
    id: "cost-increase",
    title: "Удорожание",
    description: "Анализ факторов и рисков, которые могут привести к увеличению стоимости контракта",
    icon: <TrendingUp className="h-7 w-7" />,
    accent: "from-amber-500/20 to-orange-600/10",
    glow: "bg-amber-500/30",
    orb: "bg-amber-600/20",
    available: true,
  },
  {
    id: "todo-4",
    title: "Скоро",
    description: "Модуль в разработке",
    icon: <Plus className="h-7 w-7" />,
    accent: "from-white/5 to-white/0",
    glow: "bg-white/10",
    orb: "bg-white/5",
    available: false,
  },
  {
    id: "todo-5",
    title: "Скоро",
    description: "Модуль в разработке",
    icon: <Plus className="h-7 w-7" />,
    accent: "from-white/5 to-white/0",
    glow: "bg-white/10",
    orb: "bg-white/5",
    available: false,
  },
  {
    id: "todo-6",
    title: "Скоро",
    description: "Модуль в разработке",
    icon: <Plus className="h-7 w-7" />,
    accent: "from-white/5 to-white/0",
    glow: "bg-white/10",
    orb: "bg-white/5",
    available: false,
  },
]

function DashboardPage() {
  const { logout, user } = useAuth()

  return (
    <div className="min-h-screen bg-[#020617]">
      {/* Ambient spheres */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[400px] w-[400px] rounded-full bg-purple-700/15 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-indigo-600/15 blur-[120px]" />
        <div className="absolute top-1/2 left-3/4 h-[250px] w-[250px] rounded-full bg-sky-600/10 blur-[100px]" />
      </div>

      {/* Top navigation */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2 text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-indigo-400">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-sm font-medium">Tender Analysis</span>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <span className="text-xs text-white/30 hidden sm:block">{user.email}</span>
            )}
            <Button variant="ghost" size="icon" className="text-white/50 hover:text-white hover:bg-white/10">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white/50 hover:text-white hover:bg-white/10">
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white/50 hover:text-white hover:bg-white/10" onClick={logout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-white">
            {user ? `Добро пожаловать, ${user.full_name}` : "Dashboard"}
          </h1>
          <p className="mt-2 text-sm text-white/40">Выберите модуль для анализа тендера</p>
        </div>

        {/* Modules grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((module) => (
            <button
              key={module.id}
              disabled={!module.available}
              className={`group relative overflow-hidden rounded-2xl border text-left transition-all duration-300 ${
                module.available
                  ? "border-white/10 bg-white/5 backdrop-blur-md hover:border-white/20 hover:bg-white/8 hover:-translate-y-0.5 cursor-pointer"
                  : "border-white/5 bg-white/[0.02] cursor-default"
              }`}
            >
              {/* Gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${module.accent} pointer-events-none`} />

              {/* Decorative orb inside card */}
              <div className={`absolute -top-6 -right-6 h-24 w-24 rounded-full ${module.orb} blur-2xl pointer-events-none`} />

              <div className="relative p-6">
                {/* Icon container */}
                <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${module.glow} backdrop-blur-sm ${module.available ? "text-white" : "text-white/20"}`}>
                  {module.icon}
                </div>

                {/* Coming soon badge */}
                {!module.available && (
                  <span className="absolute top-5 right-5 rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/20">
                    Скоро
                  </span>
                )}

                <h2 className={`mb-2 text-base font-semibold ${module.available ? "text-white" : "text-white/20"}`}>
                  {module.title}
                </h2>
                <p className={`text-sm leading-relaxed ${module.available ? "text-white/50" : "text-white/15"}`}>
                  {module.description}
                </p>

                {/* Arrow hint on hover */}
                {module.available && (
                  <div className="mt-5 flex items-center gap-1.5 text-xs font-medium text-indigo-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    Открыть модуль
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
