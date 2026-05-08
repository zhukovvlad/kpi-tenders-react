import axios, { type InternalAxiosRequestConfig } from "axios"
import { toast } from "sonner"

// Extend config type to track whether a request has already been retried after
// a token refresh, so we don't enter an infinite refresh loop.
interface RetryableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "",
  withCredentials: true, // automatically send cookies with every request
  headers: {
    "Content-Type": "application/json",
  },
})

// ── Token refresh state ──────────────────────────────────────────────────────
// When multiple requests fail with 401 simultaneously, only one refresh attempt
// is made. The rest are queued and retried once the refresh resolves.
let isRefreshing = false
let refreshSubscribers: Array<(success: boolean) => void> = []

function notifyRefreshDone(success: boolean) {
  refreshSubscribers.forEach((cb) => cb(success))
  refreshSubscribers = []
}

// ── Response interceptor ─────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as RetryableConfig | undefined
    const status: number | undefined = error.response?.status
    const message: string = error.response?.data?.message ?? ""
    const url: string = config?.url ?? ""

    // Interactive auth endpoints handle errors inline — skip global toast.
    // /auth/me is NOT in this list; only its 401 is handled by AuthContext
    // (redirect to /). Its 400/403/5xx errors still surface as global toasts.
    const isInteractiveAuthEndpoint = [
      "/auth/login",
      "/auth/register",
      "/auth/logout",
    ].some((ep) => url.includes(ep))

    // ── Auto-refresh on 401 ──────────────────────────────────────────────────
    // Skipped for: auth endpoints, the refresh endpoint itself, and requests
    // that already went through one refresh cycle (_retried flag).
    const isRefreshEndpoint = url.includes("/auth/refresh")
    if (
      status === 401 &&
      !isInteractiveAuthEndpoint &&
      !isRefreshEndpoint &&
      !config?._retried
    ) {
      if (isRefreshing) {
        // Wait for the in-flight refresh, then retry this request.
        return new Promise((resolve, reject) => {
          refreshSubscribers.push((success) => {
            if (success && config) {
              config._retried = true
              resolve(apiClient(config))
            } else {
              reject(error)
            }
          })
        })
      }

      isRefreshing = true
      try {
        await apiClient.post("/api/v1/auth/refresh")
        isRefreshing = false
        notifyRefreshDone(true)
        // Retry the original request with the new access_token cookie.
        if (config) {
          config._retried = true
          return apiClient(config)
        }
      } catch {
        isRefreshing = false
        notifyRefreshDone(false)
        // Let the original 401 propagate — AuthContext will redirect to login.
        return Promise.reject(error)
      }
    }

    // ── Global error toasts ──────────────────────────────────────────────────
    // 401 is handled per-feature (AuthContext) to avoid redirect loops.
    if (!isInteractiveAuthEndpoint) {
      if (status === 403) {
        toast.error("Доступ запрещён")
      } else if (status === 400) {
        toast.error(message || "Некорректный запрос")
      } else if (status !== undefined && status >= 500) {
        toast.error("Ошибка сервера. Попробуйте позже.")
      }
    }

    return Promise.reject(error)
  },
)

export default apiClient
