export const runtime = 'nodejs'
export const maxDuration = 60

import { createAdminSupabase } from '@/lib/supabase/server'
import { parseChatLocale } from '@/lib/chatbot/config'
import {
  getOrCreateConversation,
  loadConversationHistory,
  prepareChatContext,
  saveMessage,
  streamChatCompletion,
  toOpenAIMessages,
} from '@/lib/chatbot/chat-service'

function sseLine(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

export async function POST(request: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    return new Response(JSON.stringify({ error: 'Chatbot no configurado' }), { status: 503 })
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return new Response(JSON.stringify({ error: 'Falta OPENAI_API_KEY en el servidor' }), {
      status: 503,
    })
  }

  const sb = createAdminSupabase()

  let body: {
    sessionId?: string
    conversationId?: string
    text?: string
    locale?: string
  }

  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), { status: 400 })
  }

  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : ''
  const text = typeof body.text === 'string' ? body.text.trim() : ''
  const locale = parseChatLocale(body.locale)

  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Falta sessionId' }), { status: 400 })
  }
  if (!text) {
    return new Response(JSON.stringify({ error: 'Falta text' }), { status: 400 })
  }

  try {
    const conversationId = await getOrCreateConversation(sb, sessionId, body.conversationId, locale)
    const history = await loadConversationHistory(sb, conversationId)
    const { systemPrompt } = await prepareChatContext(sb, text, history, locale)
    const openaiMessages = toOpenAIMessages(history, systemPrompt, text)

    await saveMessage(sb, conversationId, 'user', text)

    const stream = await streamChatCompletion(openaiMessages)
    const encoder = new TextEncoder()

    const readable = new ReadableStream({
      async start(controller) {
        let full = ''
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content ?? ''
            if (delta) {
              full += delta
              controller.enqueue(encoder.encode(sseLine({ type: 'token', content: delta })))
            }
          }

          const assistantId = await saveMessage(sb, conversationId, 'assistant', full)
          controller.enqueue(
            encoder.encode(
              sseLine({
                type: 'done',
                conversationId,
                messageId: assistantId,
                content: full,
              })
            )
          )
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Error en el chat'
          controller.enqueue(encoder.encode(sseLine({ type: 'error', error: msg })))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error del chatbot'
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
}
