import type { SupabaseClient } from '@supabase/supabase-js'
import { buildBusinessDataBlock } from './business-data'
import { buildDirectoryBlock } from './directory'
import { getChatbotModel, getOpenAIClient } from './openai'
import { formatRagContext, retrieveContext } from './rag'
import { buildAuditorSystemPrompt, buildSystemPrompt } from './system-prompt'
import type { ChatLocale } from './config'
import type { AuditorResult, RagGap } from './types'

const RAG_GAPS: RagGap[] = ['none', 'missing', 'not_retrieved', 'ignored']

export type AuditTurnInput = {
  userQuestion: string
  assistantAnswer: string
  priorContext?: string
  locale?: ChatLocale
}

function buildEvaluationUserContent(args: AuditTurnInput) {
  return `${
    args.priorContext
      ? `CONTEXTO PREVIO DE LA CONVERSACIÓN (memoria que tuvo Roy al responder):
${args.priorContext}

`
      : ''
  }ÚLTIMO MENSAJE DEL VISITANTE (turno evaluado):
${args.userQuestion || '(sin pregunta previa clara)'}

RESPUESTA DEL ASISTENTE:
${args.assistantAnswer || '(vacía)'}`
}

export async function auditAssistantMessage(
  sb: SupabaseClient,
  input: AuditTurnInput
): Promise<AuditorResult> {
  const locale = input.locale ?? 'es'
  const query = input.userQuestion || input.assistantAnswer.slice(0, 200)
  const chunks = await retrieveContext(sb, query, locale)
  const ragContext = formatRagContext(chunks)
  const directoryLive = await buildDirectoryBlock(sb, query, locale)
  const businessData = buildBusinessDataBlock(locale, directoryLive)
  const chatPrompt = buildSystemPrompt(locale, ragContext, businessData)
  const auditorPrompt = buildAuditorSystemPrompt(chatPrompt, ragContext, businessData)

  const openai = getOpenAIClient()
  const model = getChatbotModel()
  const res = await openai.chat.completions.create({
    model,
    ...(model.startsWith('gpt-4o')
      ? { temperature: 0, max_tokens: 2000 }
      : { reasoning_effort: 'low' as const, max_completion_tokens: 2000 }),
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: auditorPrompt },
      { role: 'user', content: buildEvaluationUserContent(input) },
    ],
  })

  const raw = res.choices[0]?.message?.content ?? '{}'
  let parsed: {
    quality?: string
    notes?: string
    suggested_fix?: string
    rag_gap?: string
    rag_title?: string
    rag_body?: string
  }
  try {
    parsed = JSON.parse(raw)
  } catch {
    return {
      quality: 'mejorable',
      notes: 'Respuesta del auditor no parseable',
      suggested_fix: '',
      rag_gap: 'none',
    }
  }

  const quality =
    parsed.quality === 'correcta' || parsed.quality === 'mejorable' || parsed.quality === 'incorrecta'
      ? parsed.quality
      : 'mejorable'

  return {
    quality,
    notes: String(parsed.notes ?? '').slice(0, 2000) || 'Sin notas.',
    suggested_fix: parsed.suggested_fix ? String(parsed.suggested_fix).slice(0, 4000) : undefined,
    rag_gap: RAG_GAPS.includes(parsed.rag_gap as RagGap) ? (parsed.rag_gap as RagGap) : 'none',
    rag_title: parsed.rag_title?.trim(),
    rag_body: parsed.rag_body?.trim(),
  }
}
