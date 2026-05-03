import apiClient from "./client"
import type { SiteEvent } from "@/types/site-event"
import { mockDelay, USE_MOCKS } from "@/services/mocks"
import { listEventsForSite } from "@/services/mocks/data"

export const siteEventsApi = {
  listForSite: (siteId: string): Promise<SiteEvent[]> => {
    if (USE_MOCKS) return mockDelay(listEventsForSite(siteId))
    return apiClient
      .get<SiteEvent[]>(`/api/v1/sites/${siteId}/events`)
      .then((r) => r.data)
  },
}
