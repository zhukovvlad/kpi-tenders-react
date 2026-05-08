import apiClient from "./client"
import type { ConstructionSite, SiteListItem } from "@/types/site"
import { mockDelay, USE_MOCKS } from "@/services/mocks"
import {
  MOCK_SITES,
  getMockSiteList,
  findSiteById,
} from "@/services/mocks/data"

// Нормализует ответ бекенда (ConstructionSite) в SiteListItem,
// добавляя дефолты для агрегатных полей, которые пока не возвращает бекенд
// (breadcrumbs, contract_kinds, aggregate_status и пр. появятся в будущей миграции).
function normalizeSiteToListItem(site: ConstructionSite): SiteListItem {
  return {
    ...site,
    breadcrumbs: site.breadcrumbs ?? [],
    contract_kinds: site.contract_kinds ?? [],
    aggregate_status: site.aggregate_status ?? "empty",
    extracted_count: site.extracted_count ?? 0,
    inflation_pct: site.inflation_pct ?? null,
    last_activity_at: site.last_activity_at ?? site.updated_at,
  }
}

export interface CreateSitePayload {
  name: string
  parent_id?: string | null
  cover_image_path?: string | null
}

export interface UpdateSitePayload {
  name?: string
  parent_id?: string | null
  status?: ConstructionSite["status"]
  cover_image_path?: string | null
}

export const sitesApi = {
  list: (): Promise<ConstructionSite[]> =>
    USE_MOCKS
      ? mockDelay([...MOCK_SITES])
      : apiClient.get<ConstructionSite[]>("/api/v1/sites").then((r) => r.data),

  // Расширенный листинг с агрегатами для дашборда: chips, status, инфляция и пр.
  // Бекенд пока не возвращает агрегатные поля — нормализуем через normalizeSiteToListItem.
  // Дашборд показывает только корневые объекты (parent_id IS NULL).
  listForDashboard: (): Promise<SiteListItem[]> =>
    USE_MOCKS
      ? mockDelay(getMockSiteList().filter((s) => s.parent_id === null))
      : apiClient
          .get<ConstructionSite[]>("/api/v1/sites/root")
          .then((r) => r.data.map(normalizeSiteToListItem)),

  // Дочерние объекты для промежуточного экрана родителя.
  listChildren: (parentId: string): Promise<SiteListItem[]> =>
    USE_MOCKS
      ? mockDelay(getMockSiteList().filter((s) => s.parent_id === parentId))
      : apiClient
          .get<ConstructionSite[]>(`/api/v1/sites/${parentId}/children`)
          .then((r) => r.data.map(normalizeSiteToListItem)),

  get: (siteId: string): Promise<ConstructionSite> => {
    if (USE_MOCKS) {
      const site = findSiteById(siteId)
      if (!site) return Promise.reject(new Error("Объект не найден"))
      return mockDelay({ ...site })
    }
    return apiClient
      .get<ConstructionSite>(`/api/v1/sites/${siteId}`)
      .then((r) => r.data)
  },

  create: (payload: CreateSitePayload): Promise<ConstructionSite> => {
    if (USE_MOCKS) {
      const newSite: ConstructionSite = {
        id: `mock-${Date.now()}`,
        organization_id: MOCK_SITES[0].organization_id,
        parent_id: payload.parent_id ?? null,
        name: payload.name,
        status: "active",
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        cover_image_path: payload.cover_image_path ?? null,
        cover_image_uploaded_at: payload.cover_image_path
          ? new Date().toISOString()
          : null,
      }
      MOCK_SITES.push(newSite)
      return mockDelay(newSite)
    }
    return apiClient
      .post<ConstructionSite>("/api/v1/sites", payload)
      .then((r) => r.data)
  },

  update: (
    siteId: string,
    payload: UpdateSitePayload,
  ): Promise<ConstructionSite> => {
    if (USE_MOCKS) {
      const site = findSiteById(siteId)
      if (!site) return Promise.reject(new Error("Объект не найден"))
      Object.assign(site, payload, { updated_at: new Date().toISOString() })
      return mockDelay({ ...site })
    }
    return apiClient
      .patch<ConstructionSite>(`/api/v1/sites/${siteId}`, payload)
      .then((r) => r.data)
  },

  delete: (siteId: string): Promise<void> => {
    if (USE_MOCKS) {
      const idx = MOCK_SITES.findIndex((s) => s.id === siteId)
      if (idx >= 0) MOCK_SITES.splice(idx, 1)
      return mockDelay(undefined)
    }
    return apiClient.delete(`/api/v1/sites/${siteId}`).then(() => undefined)
  },
}
