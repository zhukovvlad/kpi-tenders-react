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

  listForSite: (siteId: string): Promise<ComparisonSession[]> => {
    // Бекенд не поддерживает фильтрацию по site_id в /comparison-sessions.
    // Оставляем мок-слой до появления серверной фильтрации.
    return mockDelay(MOCK_COMPARISONS.filter(() => Boolean(siteId)))
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
