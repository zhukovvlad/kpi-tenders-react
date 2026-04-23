import { createContext, useCallback, useEffect, useRef, type ReactNode } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { toast } from "sonner"
import { authApi, type LoginCredentials, type RegisterCredentials } from "@/services/api/auth"
import { useUser } from "@/hooks/useUser"
import { logger } from "@/lib/logger"
import type { User } from "@/types/auth"

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  const { data: user, isLoading, error } = useUser()

  const handled401Ref = useRef(false)

  useEffect(() => {
    if (!error) {
      handled401Ref.current = false
      return
    }
    if (!isAxiosError(error) || error.response?.status !== 401) return
    if (location.pathname === "/") return
    if (handled401Ref.current) return

    handled401Ref.current = true

    const message: string = error.response?.data?.message ?? ""
    if (message.toLowerCase().includes("unavailable")) {
      toast.error("Аккаунт или организация недоступны")
    }

    logger.warn("Session expired or unauthorized", { status: 401 })
    navigate("/")
  }, [error, navigate, location.pathname])

  useEffect(() => {
    if (user) {
      logger.info("Auth session initialized", { userId: user.id })
    }
  }, [user])

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      await authApi.login(credentials)
      await queryClient.invalidateQueries({ queryKey: ["user", "me"] })
      logger.info("User logged in", { email: credentials.email })
    },
    [queryClient],
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      queryClient.clear()
      logger.info("User logged out")
      navigate("/")
    }
  }, [queryClient, navigate])

  const register = useCallback(
    async (credentials: RegisterCredentials) => {
      const { data } = await authApi.register(credentials)
      if (!data.warning) {
        await queryClient.invalidateQueries({ queryKey: ["user", "me"] })
      }
    },
    [queryClient],
  )

  // TanStack Query keeps previous data on error — must override when session is invalid
  const isSessionInvalid = isAxiosError(error) && error.response?.status === 401
  const resolvedUser = isSessionInvalid ? null : (user ?? null)

  return (
    <AuthContext.Provider
      value={{
        user: resolvedUser,
        isAuthenticated: !!resolvedUser,
        isLoading,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
