import type { ContractKind } from "./contract"

export type ArtifactKind =
  | "convert_md"
  | "anonymize_doc"
  | "anonymize_entities"

export interface Document {
  id: string
  organization_id: string
  site_id: string | null
  uploaded_by: string
  parent_id: string | null
  artifact_kind: ArtifactKind | null
  file_name: string
  mime_type: string | null
  file_size_bytes: number | null
  created_at: string
  updated_at: string

  // Поля из планируемой миграции №2: contract_kind на оригинальных documents,
  // а также bundle_id для группировки .docx + смета + ТЗ.
  contract_kind?: ContractKind | null
  bundle_id?: string | null

  // Удобный display_name из дизайн-семантики.
  // Например, «Договор подряда №123 от 15.12.2025» вместо имени файла.
  display_name?: string | null
}

// Договор как «комплект» — bundle root с дочерними файлами (смета, ТЗ).
// На MVP это собирается на фронте по contract_kind + parent/bundle.
export interface ContractBundle {
  id: string
  site_id: string
  contract_kind: ContractKind
  // Главный документ (.docx договор).
  root: Document
  // Дополнительные файлы: смета, ТЗ, матрица.
  children: Document[]
  // Извлечено параметров по этому договору (агрегат для UI).
  extracted_count: number
  // Свежесть последнего значимого изменения.
  last_activity_at: string
}
