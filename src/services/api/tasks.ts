import apiClient from "./client"
import type { Task, TaskModule } from "@/types/task"

export const tasksApi = {
  // GET /api/v1/tasks?document_id=:id
  getByDocument: (documentId: string): Promise<Task[]> =>
    apiClient
      .get<Task[]>("/api/v1/tasks", { params: { document_id: documentId } })
      .then((res) => res.data),

  // POST /api/v1/tasks
  start: (documentId: string, moduleName: TaskModule): Promise<Task> =>
    apiClient
      .post<Task>("/api/v1/tasks", {
        document_id: documentId,
        module_name: moduleName,
      })
      .then((res) => res.data),
}
