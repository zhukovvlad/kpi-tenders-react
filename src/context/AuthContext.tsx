import { createContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { authApi, type LoginCredentials, type RegisterCredentials } from "@/services/api/auth"

interface AuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // On mount: validate session via cookie (AuthMiddleware returns 401 if cookie is missing/expired)
  // TODO: replace checkSession with GET /api/v1/auth/me when available
  useEffect(() => {
    authApi
      .checkSession()
      .then(() => setIsAuthenticated(true))
      .catch(() => setIsAuthenticated(false))
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    await authApi.login(credentials)
    setIsAuthenticated(true)
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout()
    setIsAuthenticated(false)
  }, [])

  const register = useCallback(async (credentials: RegisterCredentials) => {
    const { data } = await authApi.register(credentials)
    // Backend issues auth cookies automatically unless token generation failed
    if (!data.warning) {
      setIsAuthenticated(true)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}
