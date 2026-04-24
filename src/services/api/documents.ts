import apiClient from "./client"
import type { Document } from "@/types/document"

export const documentsApi = {
  upload(file: File): Promise<Document> {
    const form = new FormData()
    form.append("file", file)
    return apiClient
      .post<Document>("/api/v1/documents/upload", form, {
        // Explicitly clear the instance-level Content-Type so the browser can
        // set multipart/form-data with the correct boundary for FormData.
        headers: { "Content-Type": undefined },
      })
      .then((res) => res.data)
  },

  list: (): Promise<Document[]> =>
    apiClient.get<Document[]>("/api/v1/documents").then((res) => res.data),

  delete: (id: string): Promise<void> =>
    apiClient.delete(`/api/v1/documents/${id}`).then(() => undefined),

  getPresignedUrl: (id: string, download = false): Promise<string> =>
    apiClient
      .get<{ url: string }>(`/api/v1/documents/${id}/url`, {
        params: download ? { download: "true" } : undefined,
      })
      .then((res) => res.data.url),
}
