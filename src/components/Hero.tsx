import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"

interface HeroProps {
  onGetStarted: () => void
}

export function Hero({ onGetStarted }: HeroProps) {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  function handleGetStarted() {
    if (isAuthenticated) {
      navigate("/dashboard")
    } else {
      onGetStarted()
    }
  }
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020617]">
      {/* Ambient glowing spheres */}
      <div className="pointer-events-none absolute inset-0">
        {/* Left sphere */}
        <div className="absolute -left-20 top-1/3 h-125 w-125 rounded-full bg-purple-700/40 blur-[120px]" />
        {/* Bottom-left sphere */}
        <div className="absolute left-1/4 bottom-10 h-87.5 w-87.5 rounded-full bg-indigo-600/30 blur-[120px]" />
        {/* Right sphere */}
        <div className="absolute -right-10 top-1/4 h-150 rounded-full bg-violet-700/50 blur-[120px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
        <h1 className="text-6xl font-semibold tracking-tight text-white md:text-7xl lg:text-8xl">
          Constructing Life
        </h1>
        <p className="text-2xl font-light tracking-widest text-white/50 md:text-3xl">
          Space By Space
        </p>
        <Button
          size="lg"
          onClick={handleGetStarted}
          className="mt-6 bg-indigo-600 px-10 py-6 text-base font-medium text-white shadow-[0_0_40px_rgba(99,102,241,0.5)] transition-all hover:bg-indigo-500 hover:shadow-[0_0_60px_rgba(99,102,241,0.7)]"
        >
          Get Started
        </Button>
      </div>

    </section>
  )
}
