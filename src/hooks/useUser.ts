import { useQuery } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { authApi } from "@/services/api/auth"

const FIVE_MINUTES = 5 * 60 * 1000

export function useUser() {
  return useQuery({
    queryKey: ["user", "me"],
    queryFn: authApi.fetchMe,
    staleTime: FIVE_MINUTES,
    retry: (failureCount, error) => {
      // Never retry on 401 — session is definitively invalid
      if (isAxiosError(error) && error.response?.status === 401) return false
      return failureCount < 2
    },
  })
}
