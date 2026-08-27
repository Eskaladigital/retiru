import type { SupabaseClient } from '@supabase/supabase-js'
import type OpenAI from 'openai'
import {
  CHATBOT_HISTORY_LIMIT,
  CHATBOT_MAX_TOKENS,
  CHATBOT_TEMPERATURE,
  type ChatLocale,
} from './config'
import { buildBusinessDataBlock } from './business-data'
import { buildDirectoryBlock } from './directory'
import { getChatbotModel, getOpenAIClient } from './openai'
import { buildRagQuery, formatRagContext, retrieveContext } from './rag'
import { buildSystemPrompt } from './system-prompt'
import type { ChatMessageInput } from './types'

export async function loadConversationHistory(
  sb: SupabaseClient,
  conversationId: string,
  limit = CHATBOT_HISTORY_LIMIT
): Promise<ChatMessageInput[]> {
  const { data, error } = await sb
    .from('chatbot_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data ?? [])
    .reverse()
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content ?? '',
    }))
}

export function toOpenAIMessages(
  history: ChatMessageInput[],
  systemPrompt: string,
  currentText: string
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
  ]
  for (const msg of history) {
    messages.push({ role: msg.role, content: msg.content })
  }
  messages.push({ role: 'user', content: currentText })
  return messages
}

export async function prepareChatContext(
  sb: SupabaseClient,
  userText: string,
  history: ChatMessageInput[],
  locale: ChatLocale
): Promise<{ systemPrompt: string }> {
  const recentUser = history.filter((m) => m.role === 'user').map((m) => m.content)
  const ragQuery = buildRagQuery(recentUser, userText)
  const chunks = await retrieveContext(sb, ragQuery, locale)
  const ragContext = formatRagContext(chunks)
  const directoryLive = await buildDirectoryBlock(sb, ragQuery, locale)
  const businessData = buildBusinessDataBlock(locale, directoryLive)
  const systemPrompt = buildSystemPrompt(locale, ragContext, businessData)
  return { systemPrompt }
}

export async function streamChatCompletion(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
): Promise<AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>> {
  const openai = getOpenAIClient()
  const model = getChatbotModel()
  const request: OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming = {
    model,
    messages,
    stream: true,
  }
  if (model.startsWith('gpt-4o')) {
    request.temperature = CHATBOT_TEMPERATURE
    request.max_tokens = CHATBOT_MAX_TOKENS
  } else {
    request.reasoning_effort = 'none' as OpenAI.ReasoningEffort
    request.max_completion_tokens = CHATBOT_MAX_TOKENS
  }
  return openai.chat.completions.create(request)
}

export async function getOrCreateConversation(
  sb: SupabaseClient,
  sessionId: string,
  conversationId: string | undefined,
  locale: ChatLocale
): Promise<string> {
  if (conversationId) {
    const { data } = await sb
      .from('chatbot_conversations')
      .select('id')
      .eq('id', conversationId)
      .maybeSingle()
    if (data?.id) return data.id
  }

  const { data: existing } = await sb
    .from('chatbot_conversations')
    .select('id')
    .eq('session_id', sessionId)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing?.id) return existing.id

  const { data: created, error } = await sb
    .from('chatbot_conversations')
    .insert({
      session_id: sessionId,
      language: locale,
      status: 'open',
    })
    .select('id')
    .single()

  if (error || !created?.id) throw new Error(error?.message ?? 'No se pudo crear conversación')
  return created.id
}

export async function saveMessage(
  sb: SupabaseClient,
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<string> {
  const { data, error } = await sb
    .from('chatbot_messages')
    .insert({
      conversation_id: conversationId,
      role,
      content,
      response_quality: role === 'assistant' ? 'sin_tipo' : undefined,
    })
    .select('id')
    .single()

  if (error || !data?.id) throw new Error(error?.message ?? 'No se pudo guardar mensaje')

  await sb
    .from('chatbot_conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId)

  return data.id
}
