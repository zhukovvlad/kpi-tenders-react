import type { SiteEvent } from "@/types/site-event"
import { mockDelay } from "@/services/mocks"
import { listEventsForSite } from "@/services/mocks/data"

// Бекенд возвращает /sites/:id/audit-log, но схема SiteAuditLog (event_type, payload, actor_user_id)
// не совпадает с фронтовым SiteEvent (kind, message, actor_name).
// Оставляем мок-слой до выравнивания типов.
const USE_EVENTS_MOCKS = true

export const siteEventsApi = {
  listForSite: (siteId: string): Promise<SiteEvent[]> =>
    mockDelay(listEventsForSite(siteId)),
}
