import apiClient from "./client"
import type { User } from "@/types/auth"
import { mockDelay, USE_MOCKS } from "@/services/mocks"
import { MOCK_USER } from "@/services/mocks/data"

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  name: string
  inn?: string
  email: string
  password: string
  full_name: string
}

export interface RegisterResponse {
  org_id: string
  user_id: string
  warning?: string
}

// Shape returned by GET /api/v1/auth/me — differs from the frontend User type
// only in the field name for the org identifier.
interface MeResponse {
  id: string
  organization_id: string
  email: string
  full_name: string
  role: "admin" | "member"
  is_active: boolean
}

const MOCK_SESSION_KEY = "mock-auth-session"

function readMockSession(): User | null {
  try {
    const raw = localStorage.getItem(MOCK_SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

function writeMockSession(user: User | null) {
  if (user) localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(user))
  else localStorage.removeItem(MOCK_SESSION_KEY)
}

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    if (USE_MOCKS) {
      writeMockSession({ ...MOCK_USER, email: credentials.email })
      return mockDelay({ ok: true })
    }
    return apiClient.post("/api/v1/auth/login", credentials)
  },

  logout: async () => {
    if (USE_MOCKS) {
      writeMockSession(null)
      return mockDelay({ ok: true })
    }
    return apiClient.post("/api/v1/auth/logout")
  },

  register: async (credentials: RegisterCredentials) => {
    if (USE_MOCKS) {
      writeMockSession({ ...MOCK_USER, email: credentials.email })
      const data: RegisterResponse = {
        org_id: MOCK_USER.org_id,
        user_id: MOCK_USER.id,
      }
      return mockDelay({ data })
    }
    return apiClient.post<RegisterResponse>(
      "/api/v1/auth/register",
      credentials,
    )
  },

  fetchMe: (): Promise<User> => {
    if (USE_MOCKS) {
      const session = readMockSession()
      if (!session) {
        // 401 эквивалент в mock-режиме — создаём AxiosError-подобное отклонение,
        // которое обработает существующий handler в AuthContext.
        const err = new Error("Unauthorized") as Error & {
          response?: { status: number; data?: { message?: string } }
          isAxiosError?: boolean
        }
        err.response = { status: 401 }
        err.isAxiosError = true
        return Promise.reject(err)
      }
      return mockDelay(session, 80)
    }
    return apiClient
      .get<MeResponse>("/api/v1/auth/me")
      .then((r) => ({
        id: r.data.id,
        org_id: r.data.organization_id,
        email: r.data.email,
        full_name: r.data.full_name,
        role: r.data.role,
        is_active: r.data.is_active,
      }))
  },
}
