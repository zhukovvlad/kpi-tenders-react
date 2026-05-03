import apiClient from "@/services/api/client"
import type { Task, TaskModule } from "@/types/task"
import { mockDelay, USE_MOCKS } from "@/services/mocks"

// Используется на вкладке «Аудит обработки» карточки объекта.
// На моках возвращает пустой массив — пайплайна нет, но UI должен корректно
// показывать пустое состояние.
export const tasksApi = {
  getByDocument: (documentId: string): Promise<Task[]> => {
    if (USE_MOCKS) return mockDelay<Task[]>([])
    return apiClient
      .get<Task[]>("/api/v1/tasks", { params: { document_id: documentId } })
      .then((res) => res.data)
  },

  getByDocuments: (documentIds: string[]): Promise<Task[]> => {
    if (USE_MOCKS) return mockDelay<Task[]>([])
    return apiClient
      .get<Task[]>("/api/v1/tasks", {
        params: { document_ids: documentIds.join(",") },
      })
      .then((res) => res.data)
  },

  start: (documentId: string, moduleName: TaskModule): Promise<Task> => {
    if (USE_MOCKS) {
      return mockDelay<Task>({
        id: `mock-task-${Date.now()}`,
        document_id: documentId,
        module_name: moduleName,
        status: "pending",
        result_payload: null,
        error_message: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }
    return apiClient
      .post<Task>("/api/v1/tasks", {
        document_id: documentId,
        module_name: moduleName,
      })
      .then((res) => res.data)
  },
}
