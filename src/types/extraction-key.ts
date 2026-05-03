export type ExtractionDataType = "string" | "number" | "date" | "boolean"

export interface ExtractionKey {
  id: string
  // null — системный ключ, доступен всем тенантам.
  organization_id: string | null
  key_name: string
  source_query: string
  data_type: ExtractionDataType
  // Из планируемой миграции №3 — человекочитаемое имя в UI.
  display_name: string | null
  created_at: string
  // Сколько документов уже использовали ключ — для справочника /keys.
  document_count?: number
}

export interface ExtractedDataItem {
  id: string
  document_id: string
  key: ExtractionKey
  // null — воркер не смог извлечь.
  extracted_value: string | null
}
