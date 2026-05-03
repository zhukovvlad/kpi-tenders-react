import type { ContractKind } from "./contract"

export type SiteStatus = "active" | "completed" | "archived"

// Агрегат состояния из планируемого VIEW v_site_status (миграция №4 в IA-документе)
export type SiteAggregateStatus =
  | "ready"
  | "processing"
  | "attention"
  | "empty"

export interface ConstructionSite {
  id: string
  organization_id: string
  parent_id: string | null
  name: string
  status: SiteStatus
  created_by: string | null
  created_at: string
  updated_at: string

  // Поля из планируемой миграции №1 (cover) и расчётных VIEW.
  // Когда бекенд ещё не отдаёт — заполняется моками.
  cover_image_path?: string | null
  cover_image_uploaded_at?: string | null
}

export interface SiteListItem extends ConstructionSite {
  // Хлебные крошки от корня до родителя текущего объекта.
  // На дашборде показываем чтобы было видно «ЖК Северный → Очередь 2 → Корпус 5».
  breadcrumbs: string[]
  // Перечень contract_kind корневых документов на объекте — для чипов в карточке.
  contract_kinds: ContractKind[]
  // Сводный статус (VIEW v_site_status).
  aggregate_status: SiteAggregateStatus
  // Извлечено параметров по объекту (агрегат для KPI на карточке).
  extracted_count: number
  // Удорожание по объекту в процентах. null — модуль ещё не подключён.
  inflation_pct: number | null
  // Когда было последнее значимое изменение (для сортировки).
  last_activity_at: string
}
