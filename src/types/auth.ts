export interface User {
  id: string
  organization_id: string
  email: string
  full_name: string
  role: "admin" | "member"
  is_active: boolean
}
