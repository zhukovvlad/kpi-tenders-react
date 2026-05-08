import apiClient from "./client"
import type {
  ExtractionRequest,
  InitiateExtractionPayload,
  InitiateExtractionResponse,
} from "@/types/extraction"
import type { ExtractedDataItem } from "@/types/extraction-key"
import { mockDelay, USE_MOCKS } from "@/services/mocks"
import {
  MOCK_EXTRACTION_REQUESTS,
  listAnswersForDocument,
  listExtractionRequestsForDocument,
} from "@/services/mocks/data"

export const extractionApi = {
  initiate: (
    documentId: string,
    payload: InitiateExtractionPayload,
  ): Promise<InitiateExtractionResponse> => {
    if (USE_MOCKS) {
      const newRequest: ExtractionRequest = {
        id: `mock-req-${Date.now()}`,
        document_id: documentId,
        status: "pending",
        anonymize: payload.anonymize ?? true,
        questions: payload.questions,
        resolved_schema: undefined,
        answers: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      MOCK_EXTRACTION_REQUESTS.push(newRequest)
      // Имитируем фейковую обработку: через 1.5с — running, через 3с — completed.
      setTimeout(() => {
        newRequest.status = "running"
        newRequest.resolved_schema = payload.questions.map((_, i) => ({
          key_name: `mock_key_${i}`,
          data_type: "string",
        }))
        newRequest.updated_at = new Date().toISOString()
      }, 1500)
      setTimeout(() => {
        newRequest.status = "completed"
        newRequest.answers = payload.questions.map((q, i) => ({
          key_name: `mock_key_${i}`,
          data_type: "string",
          extracted_value: `Заглушка ответа на вопрос: «${q}»`,
        }))
        newRequest.updated_at = new Date().toISOString()
      }, 3000)
      return mockDelay({
        extraction_request_id: newRequest.id,
        status: newRequest.status,
      })
    }
    return apiClient
      .post<InitiateExtractionResponse>(
        `/api/v1/documents/${documentId}/extract`,
        payload,
      )
      .then((r) => r.data)
  },

  get: (extractionRequestId: string): Promise<ExtractionRequest> => {
    if (USE_MOCKS) {
      const req = MOCK_EXTRACTION_REQUESTS.find(
        (r) => r.id === extractionRequestId,
      )
      if (!req) return Promise.reject(new Error("Запрос не найден"))
      return mockDelay({ ...req })
    }
    return apiClient
      .get<ExtractionRequest>(
        `/api/v1/extraction-requests/${extractionRequestId}`,
      )
      .then((r) => r.data)
  },

  // История запросов по документу — для карточки договора.
  // /documents/:id/extraction-requests нет на бекенде → мок-слой.
  listForDocument: (documentId: string): Promise<ExtractionRequest[]> =>
    mockDelay(listExtractionRequestsForDocument(documentId)),

  // Текущие извлечённые значения по документу — для таблицы параметров.
  // /documents/:id/answers нет на бекенде → мок-слой.
  answersForDocument: (documentId: string): Promise<ExtractedDataItem[]> =>
    mockDelay(listAnswersForDocument(documentId)),
}
