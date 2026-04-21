import apiClient from "./client"

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

export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiClient.post("/api/v1/auth/login", credentials),

  logout: () =>
    apiClient.post("/api/v1/auth/logout"),

  register: (credentials: RegisterCredentials) =>
    apiClient.post<RegisterResponse>("/api/v1/auth/register", credentials),

  // Checks session validity — replace with GET /api/v1/auth/me when available
  checkSession: () =>
    apiClient.get("/api/v1/documents"),
}
