export interface Document {
  id: string
  organization_id: string
  site_id: string | null
  uploaded_by: string
  parent_id: string | null
  file_name: string
  storage_path: string
  mime_type: string | null
  file_size_bytes: number | null
  created_at: string
  updated_at: string
}
