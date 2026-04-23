export interface User {
  id: string
  org_id: string
  email: string
  full_name: string
  role: "admin" | "member"
}
