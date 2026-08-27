import type { ConversationStatus, ResponseQuality } from './config'

export interface ChatbotKbChunk {
  id: string
  source: string
  title: string
  content: string
  similarity?: number
}

export interface ChatbotConversation {
  id: string
  session_id: string
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  language: string
  status: ConversationStatus
  response_quality: ResponseQuality | null
  admin_notes: string | null
  created_at: string
  last_message_at: string
}

export interface ChatbotMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  media_url: string | null
  media_type: 'image' | null
  response_quality: ResponseQuality
  admin_notes: string | null
  created_at: string
}

export interface ChatMessageInput {
  role: 'user' | 'assistant'
  content: string
}

export interface IngestChunk {
  source: string
  locale: 'es' | 'en' | 'all'
  title: string
  content: string
  content_hash: string
}

export type RagGap = 'none' | 'missing' | 'not_retrieved' | 'ignored'

export interface AuditorResult {
  quality: Exclude<ResponseQuality, 'sin_tipo'>
  notes: string
  suggested_fix?: string
  rag_gap: RagGap
  rag_title?: string
  rag_body?: string
}
