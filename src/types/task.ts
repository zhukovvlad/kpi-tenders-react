export type TaskModule = "convert" | "anonymize" | "resolve_keys" | "extract"

export type TaskStatus = "pending" | "processing" | "completed" | "failed"

export interface TaskResultPayload {
  // convert worker output — artifact registered as Document
  md_document_id?: string
  char_count?: number
  section_count?: number
  // anonymize worker output — artifacts registered as Documents
  anonymized_document_id?: string
  entities_map_document_id?: string
  entity_count?: number
}

export interface Task {
  id: string
  document_id: string
  module_name: TaskModule
  status: TaskStatus
  result_payload: TaskResultPayload | null
  error_message: string | null
  created_at: string
  updated_at: string
}
