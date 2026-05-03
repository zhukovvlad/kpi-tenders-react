import apiClient from "./client"
import type {
  ExtractionKey,
  ExtractionDataType,
} from "@/types/extraction-key"
import { mockDelay, USE_MOCKS } from "@/services/mocks"
import { MOCK_KEYS, ORG_ID } from "@/services/mocks/data"

export interface CreateKeyPayload {
  key_name: string
  source_query: string
  data_type: ExtractionDataType
  display_name?: string | null
}

export interface UpdateKeyPayload {
  source_query?: string
  display_name?: string | null
  data_type?: ExtractionDataType
}

export const keysApi = {
  list: (): Promise<ExtractionKey[]> =>
    USE_MOCKS
      ? mockDelay([...MOCK_KEYS])
      : apiClient
          .get<ExtractionKey[]>("/api/v1/extraction-keys")
          .then((r) => r.data),

  create: (payload: CreateKeyPayload): Promise<ExtractionKey> => {
    if (USE_MOCKS) {
      const created: ExtractionKey = {
        id: `mock-key-${Date.now()}`,
        organization_id: ORG_ID,
        key_name: payload.key_name,
        source_query: payload.source_query,
        data_type: payload.data_type,
        display_name: payload.display_name ?? null,
        created_at: new Date().toISOString(),
        document_count: 0,
      }
      MOCK_KEYS.push(created)
      return mockDelay(created)
    }
    return apiClient
      .post<ExtractionKey>("/api/v1/extraction-keys", payload)
      .then((r) => r.data)
  },

  update: (id: string, payload: UpdateKeyPayload): Promise<ExtractionKey> => {
    if (USE_MOCKS) {
      const key = MOCK_KEYS.find((k) => k.id === id)
      if (!key) return Promise.reject(new Error("Ключ не найден"))
      Object.assign(key, payload)
      return mockDelay({ ...key })
    }
    return apiClient
      .patch<ExtractionKey>(`/api/v1/extraction-keys/${id}`, payload)
      .then((r) => r.data)
  },

  delete: (id: string): Promise<void> => {
    if (USE_MOCKS) {
      const idx = MOCK_KEYS.findIndex((k) => k.id === id)
      if (idx >= 0) MOCK_KEYS.splice(idx, 1)
      return mockDelay(undefined)
    }
    return apiClient
      .delete(`/api/v1/extraction-keys/${id}`)
      .then(() => undefined)
  },
}
