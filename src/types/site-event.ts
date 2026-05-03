export type SiteEventKind =
  | "site_created"
  | "metadata_updated"
  | "document_uploaded"
  | "document_deleted"
  | "extraction_started"
  | "extraction_completed"
  | "extraction_failed"

export interface SiteEvent {
  id: string
  site_id: string
  kind: SiteEventKind
  actor_name: string
  message: string
  occurred_at: string
}
