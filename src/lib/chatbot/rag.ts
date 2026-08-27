import type { SupabaseClient } from '@supabase/supabase-js'
import { CHATBOT_RAG_MATCH_COUNT, type ChatLocale } from './config'
import { embedText } from './openai'
import type { ChatbotKbChunk } from './types'

export function buildRagQuery(
  recentUserMessages: string[],
  currentMessage: string
): string {
  const parts = [...recentUserMessages.slice(-2), currentMessage]
    .map((m) => m.trim())
    .filter(Boolean)
  return parts.join(' — ')
}

export async function retrieveContext(
  sb: SupabaseClient,
  query: string,
  locale?: ChatLocale | null,
  matchCount = CHATBOT_RAG_MATCH_COUNT
): Promise<ChatbotKbChunk[]> {
  const embedding = await embedText(query)
  const { data, error } = await sb.rpc('match_chatbot_chunks', {
    query_embedding: embedding,
    match_count: matchCount,
    filter_locale: locale ?? null,
  })
  if (error) throw new Error(`RAG: ${error.message}`)
  return (data ?? []) as ChatbotKbChunk[]
}

export function formatRagContext(chunks: ChatbotKbChunk[]): string {
  if (!chunks.length) return '(Sin fragmentos recuperados de la base de conocimiento.)'
  return chunks
    .map(
      (c, i) =>
        `[${i + 1}] Fuente: ${c.source}${c.title ? ` — ${c.title}` : ''}\n${c.content}`
    )
    .join('\n\n')
}
