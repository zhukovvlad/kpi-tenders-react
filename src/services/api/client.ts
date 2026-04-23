import axios from "axios"
import { toast } from "sonner"

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "",
  withCredentials: true, // automatically send cookies with every request
  headers: {
    "Content-Type": "application/json",
  },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status: number | undefined = error.response?.status
    const message: string = error.response?.data?.message ?? ""

    // Interactive auth endpoints handle errors inline — skip global toast for them.
    // /auth/me is NOT skipped so its 4xx/5xx errors surface via global handlers.
    const url: string = error.config?.url ?? ""
    const isInteractiveAuthEndpoint = ["/auth/login", "/auth/register", "/auth/logout"].some(
      (endpoint) => url.includes(endpoint),
    )

    if (!isInteractiveAuthEndpoint) {
      if (status === 403) {
        toast.error("Доступ запрещён")
      } else if (status === 400) {
        toast.error(message || "Некорректный запрос")
      } else if (status !== undefined && status >= 500) {
        toast.error("Ошибка сервера. Попробуйте позже.")
      }
    }
    // 401 is handled per-feature (AuthContext) to avoid redirect loops

    return Promise.reject(error)
  },
)

export default apiClient
