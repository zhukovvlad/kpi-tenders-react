export type ArtifactKind = "convert_md" | "anonymize_doc" | "anonymize_entities"

export interface Document {
  id: string
  organization_id: string
  site_id: string | null
  uploaded_by: string
  parent_id: string | null
  artifact_kind: ArtifactKind | null
  file_name: string
  storage_path: string
  mime_type: string | null
  file_size_bytes: number | null
  created_at: string
  updated_at: string
}
