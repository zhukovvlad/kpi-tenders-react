export type ExtractionRequestStatus = "pending" | "running" | "completed" | "failed"

export interface ResolvedSchemaItem {
  key_name: string
  data_type: string
}

export interface ExtractionAnswer {
  key_name: string
  data_type: string
  extracted_value: string | null
}

// ExtractionRequest is the user-facing entity returned by
// GET /api/v1/extraction-requests/:id. Status transitions:
//   pending  → waiting on prerequisite tasks (convert / anonymize).
//   running  → resolve_keys or extract is in flight.
//   completed → answers are available.
//   failed    → an upstream task failed; error_message holds the reason.
export interface ExtractionRequest {
  id: string
  document_id: string
  status: ExtractionRequestStatus
  anonymize: boolean
  questions: string[]
  resolved_schema?: ResolvedSchemaItem[]
  answers?: ExtractionAnswer[]
  error_message?: string | null
  created_at: string
  updated_at: string
}

export interface InitiateExtractionResponse {
  extraction_request_id: string
  status: ExtractionRequestStatus
}

export interface InitiateExtractionPayload {
  questions: string[]
  anonymize?: boolean
}
