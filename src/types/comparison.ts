import type { ContractKind } from "./contract"

export interface ComparisonSession {
  id: string
  name: string
  contract_kind: ContractKind
  document_ids: string[]
  // Названия объектов для отображения в UI без N+1.
  document_labels: string[]
  created_at: string
  created_by_name: string
}
