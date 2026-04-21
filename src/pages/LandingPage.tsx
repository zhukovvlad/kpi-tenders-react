import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { Header } from "@/components/Header"
import { Hero } from "@/components/Hero"
import { LoginModal } from "@/components/LoginModal"
import { RegisterModal } from "@/components/RegisterModal"

export default function LandingPage() {
  const [loginOpen, setLoginOpen] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [loginWarning, setLoginWarning] = useState<string | null>(null)
  const location = useLocation()

  useEffect(() => {
    if ((location.state as { loginRequired?: boolean })?.loginRequired) {
      setLoginWarning("Please sign in to access this page")
      setLoginOpen(true)
      // Clear state so refresh doesn't re-trigger
      window.history.replaceState({}, "")
    }
  }, [location.state])

  function handleLoginClick() {
    setRegisterOpen(false)
    setLoginWarning(null)
    setLoginOpen(true)
  }

  function handleRegisterClick() {
    setLoginOpen(false)
    setRegisterOpen(true)
  }

  return (
    <div className="bg-[#020617]">
      <Header onLoginClick={handleLoginClick} onRegisterClick={handleRegisterClick} />
      <Hero onGetStarted={handleRegisterClick} />
      <LoginModal
        open={loginOpen}
        onOpenChange={(open) => {
          setLoginOpen(open)
          if (!open) setLoginWarning(null)
        }}
        warning={loginWarning}
        onSwitchToRegister={handleRegisterClick}
      />
      <RegisterModal
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onSwitchToLogin={handleLoginClick}
      />
    </div>
  )
}
