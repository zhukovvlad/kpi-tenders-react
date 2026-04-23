import { Navigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { type ReactNode } from "react"

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return null

  return isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate to="/" replace state={{ loginRequired: true }} />
  )
}
