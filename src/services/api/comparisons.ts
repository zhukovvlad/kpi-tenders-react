import apiClient from "./client"
import type { ComparisonSession } from "@/types/comparison"
import { mockDelay, USE_MOCKS } from "@/services/mocks"
import { MOCK_COMPARISONS } from "@/services/mocks/data"

export interface SaveComparisonPayload {
  name: string
  contract_kind: ComparisonSession["contract_kind"]
  document_ids: string[]
  document_labels: string[]
}

export const comparisonsApi = {
  list: (): Promise<ComparisonSession[]> =>
    USE_MOCKS
      ? mockDelay([...MOCK_COMPARISONS])
      : apiClient
          .get<ComparisonSession[]>("/api/v1/comparison-sessions")
          .then((r) => r.data),

  listForSite: (_siteId: string): Promise<ComparisonSession[]> => {
    // ComparisonSession не имеет поля site_id — корректная фильтрация невозможна.
    // Возвращаем пустой список до момента, когда бекенд добавит site_id
    // в схему и эндпоинт GET /comparison-sessions?site_id=.
    return mockDelay([])
  },

  save: (payload: SaveComparisonPayload): Promise<ComparisonSession> => {
    if (USE_MOCKS) {
      const created: ComparisonSession = {
        id: `mock-cmp-${Date.now()}`,
        name: payload.name,
        contract_kind: payload.contract_kind,
        document_ids: payload.document_ids,
        document_labels: payload.document_labels,
        created_at: new Date().toISOString(),
        created_by_name: "Алексей Демонстратор",
      }
      MOCK_COMPARISONS.push(created)
      return mockDelay(created)
    }
    return apiClient
      .post<ComparisonSession>("/api/v1/comparison-sessions", payload)
      .then((r) => r.data)
  },
}
