export const CHATBOT_EMBEDDING_MODEL = 'text-embedding-3-small' as const
export const CHATBOT_EMBEDDING_DIMENSIONS = 1536

export function getChatbotModel(): string {
  return process.env.OPENAI_CHATBOT_MODEL?.trim() || 'gpt-5.6-terra'
}

export function getChatbotAssistantName(): string {
  return process.env.CHATBOT_ASSISTANT_NAME?.trim() || 'Roy'
}

export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://') &&
  !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')
    ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
    : 'https://www.retiru.com'

export const SITE_NAME = process.env.NEXT_PUBLIC_APP_NAME?.trim() || 'Retiru'

export const CONTACT_EMAIL = 'contacto@retiru.com'

export const CHATBOT_TEMPERATURE = 0.55
export const CHATBOT_RAG_MATCH_COUNT = 8
export const CHATBOT_HISTORY_LIMIT = 20
export const CHATBOT_MAX_TOKENS = 900

export type ChatLocale = 'es' | 'en'
export type ResponseQuality = 'correcta' | 'mejorable' | 'incorrecta' | 'sin_tipo'
export type ConversationStatus = 'open' | 'closed' | 'archived'

export function parseChatLocale(raw: unknown): ChatLocale {
  return raw === 'en' ? 'en' : 'es'
}
