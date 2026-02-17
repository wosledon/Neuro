import globalAxios from 'axios'

export interface ChatAskRequest {
  question: string
  topK?: number
  sessionId?: string
}

export interface ChatSource {
  content: string
  score: number
  source: string
}

export interface ChatResponse {
  answer: string
  sources: ChatSource[]
}

export interface ChatSearchRequest {
  query: string
  topK?: number
}

export interface ChatSearchResponse {
  results: ChatSource[]
  total: number
}

export const chatApi = {
  /**
   * AI 问答
   */
  ask: (question: string, topK?: number, sessionId?: string) => {
    return globalAxios.post('/api/Chat/ask', {
      question,
      topK,
      sessionId
    } as ChatAskRequest)
  },

  /**
   * 知识库搜索
   */
  search: (query: string, topK?: number) => {
    return globalAxios.post('/api/Chat/search', {
      query,
      topK
    } as ChatSearchRequest)
  }
}
