import apiClient from "./client"
import type { Document, ContractBundle } from "@/types/document"
import type { ContractKind } from "@/types/contract"
import { mockDelay, USE_MOCKS } from "@/services/mocks"
import {
  MOCK_DOCUMENTS,
  findDocumentById,
  listDocumentsForSite,
  listAnswersForDocument,
} from "@/services/mocks/data"

export interface UploadDocumentPayload {
  file: File
  siteId?: string
  contractKind?: ContractKind | null
  bundleId?: string | null
}

export const documentsApi = {
  list: (): Promise<Document[]> =>
    USE_MOCKS
      ? mockDelay([...MOCK_DOCUMENTS])
      : apiClient.get<Document[]>("/api/v1/documents").then((r) => r.data),

  listBySite: (siteId: string): Promise<Document[]> => {
    if (USE_MOCKS) return mockDelay(listDocumentsForSite(siteId))
    return apiClient
      .get<Document[]>(`/api/v1/documents`, { params: { site_id: siteId } })
      .then((r) => r.data)
  },

  // Сборка «договоров» — bundle root документов, сгруппированных по contract_kind.
  // Используется на карточке объекта для табов и в /compare для выбора оферт.
  bundlesForSite: (siteId: string): Promise<ContractBundle[]> => {
    if (USE_MOCKS) {
      const docs = listDocumentsForSite(siteId)
      const roots = docs.filter((d) => d.bundle_id === d.id)
      const bundles: ContractBundle[] = roots
        .filter((root) => root.contract_kind)
        .map((root) => {
          const children = docs.filter(
            (d) => d.bundle_id === root.id && d.id !== root.id,
          )
          const ids = [root.id, ...children.map((c) => c.id)]
          const extracted = ids.reduce(
            (sum, id) => sum + listAnswersForDocument(id).length,
            0,
          )
          const lastUpdated = [root, ...children]
            .map((d) => d.updated_at)
            .sort()
            .at(-1)!
          return {
            id: root.id,
            site_id: siteId,
            contract_kind: root.contract_kind!,
            root,
            children,
            extracted_count: extracted,
            last_activity_at: lastUpdated,
          }
        })
      return mockDelay(bundles)
    }
    return apiClient
      .get<ContractBundle[]>(`/api/v1/sites/${siteId}/contracts`)
      .then((r) => r.data)
  },

  get: (docId: string): Promise<Document> => {
    if (USE_MOCKS) {
      const doc = findDocumentById(docId)
      if (!doc) return Promise.reject(new Error("Документ не найден"))
      return mockDelay({ ...doc })
    }
    return apiClient
      .get<Document>(`/api/v1/documents/${docId}`)
      .then((r) => r.data)
  },

  upload: (payload: UploadDocumentPayload): Promise<Document> => {
    if (USE_MOCKS) {
      const newDoc: Document = {
        id: `mock-doc-${Date.now()}`,
        organization_id: MOCK_DOCUMENTS[0]?.organization_id ?? "mock-org",
        site_id: payload.siteId ?? null,
        uploaded_by: MOCK_DOCUMENTS[0]?.uploaded_by ?? "mock-user",
        parent_id: null,
        artifact_kind: null,
        file_name: payload.file.name,
        mime_type: payload.file.type || null,
        file_size_bytes: payload.file.size,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        contract_kind: payload.contractKind ?? null,
        bundle_id: payload.bundleId ?? null,
        display_name: null,
      }
      // Если bundle_id не задан — это сам root, ссылается на себя.
      if (!newDoc.bundle_id) newDoc.bundle_id = newDoc.id
      MOCK_DOCUMENTS.push(newDoc)
      return mockDelay(newDoc, 480)
    }
    const form = new FormData()
    form.append("file", payload.file)
    if (payload.siteId) form.append("site_id", payload.siteId)
    if (payload.contractKind) form.append("contract_kind", payload.contractKind)
    if (payload.bundleId) form.append("bundle_id", payload.bundleId)
    return apiClient
      .post<Document>("/api/v1/documents/upload", form, {
        headers: { "Content-Type": undefined },
      })
      .then((r) => r.data)
  },

  delete: (id: string): Promise<void> => {
    if (USE_MOCKS) {
      const idx = MOCK_DOCUMENTS.findIndex((d) => d.id === id)
      if (idx >= 0) MOCK_DOCUMENTS.splice(idx, 1)
      return mockDelay(undefined)
    }
    return apiClient.delete(`/api/v1/documents/${id}`).then(() => undefined)
  },

  getPresignedUrl: (id: string, download = false): Promise<string> => {
    if (USE_MOCKS) {
      const doc = findDocumentById(id)
      if (!doc) return Promise.reject(new Error("Документ не найден"))
      // Возвращаем data: URL-заглушку (бекенд ещё нет).
      return mockDelay(
        `data:text/plain;charset=utf-8,${encodeURIComponent(
          `Заглушка для файла ${doc.file_name}`,
        )}`,
      )
    }
    return apiClient
      .get<{ url: string }>(`/api/v1/documents/${id}/url`, {
        params: download ? { download: "true" } : undefined,
      })
      .then((r) => r.data.url)
  },
}
