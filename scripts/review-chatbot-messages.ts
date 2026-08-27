/**
 * Agente de revisión automática de respuestas de Roy.
 * Molde: auditor de Andrea / Laura / Nora. Hilo + datos reales + rag_gap.
 *
 * Uso (Windows: no uses npm run si hay flags):
 *   npx tsx scripts/review-chatbot-messages.ts
 *   npx tsx scripts/review-chatbot-messages.ts --all
 *   npx tsx scripts/review-chatbot-messages.ts --limit=50
 *   npx tsx scripts/review-chatbot-messages.ts --id=<uuid>
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { auditAssistantMessage } from '../src/lib/chatbot/auditor'
import type { ChatLocale, ResponseQuality } from '../src/lib/chatbot/config'
import type { RagGap } from '../src/lib/chatbot/types'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!existsSync(envPath)) {
    console.error('No se encontró .env.local')
    process.exit(1)
  }
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = val
  }
}

loadEnvLocal()
if (process.env.BLOG_REDACTOR_INSECURE_TLS !== '0') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

function serviceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase no configurado')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

const REPORT_PATH = path.join(__dirname, '..', 'docs', 'chatbot', 'INFORME-REVISION-MENSAJES.md')
const PENDIENTES_PATH = path.join(__dirname, '..', 'docs', 'chatbot', 'INCIDENCIAS-PENDIENTES.csv')

type AssistantRow = {
  id: string
  conversation_id: string
  content: string | null
  response_quality: string
  created_at: string | null
}

type ReviewResult = {
  id: string
  user_question: string
  assistant_answer: string
  quality: Exclude<ResponseQuality, 'sin_tipo'>
  notes: string
  suggested_fix?: string
  rag_gap: RagGap
  rag_title?: string
  rag_body?: string
}

function parseArgs() {
  const args = process.argv.slice(2)
  return {
    dryRun: args.includes('--dry-run'),
    all: args.includes('--all'),
    limit: Number(args.find((a) => a.startsWith('--limit='))?.split('=')[1] || '0') || undefined,
    id: args.find((a) => a.startsWith('--id='))?.split('=')[1]?.trim() || undefined,
  }
}

async function getConversationForReview(
  sb: SupabaseClient,
  conversationId: string,
  assistantMessageId: string
): Promise<{ lastUserQuestion: string; priorContext: string; locale: ChatLocale }> {
  const { data: conv } = await sb
    .from('chatbot_conversations')
    .select('language')
    .eq('id', conversationId)
    .maybeSingle()
  const locale: ChatLocale = conv?.language === 'en' ? 'en' : 'es'

  const { data } = await sb
    .from('chatbot_messages')
    .select('id, role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })

  const priorLines: string[] = []
  let lastUser = ''

  for (const m of data || []) {
    if (m.id === assistantMessageId) break
    const content = m.content?.trim() || ''
    if (!content) continue
    const label = m.role === 'user' ? 'Visitante' : 'Roy'
    priorLines.push(`${label}: ${content}`)
    if (m.role === 'user') lastUser = content
  }

  const priorContext =
    priorLines.length > 1
      ? priorLines.slice(0, -1).join('\n')
      : priorLines.length === 1 && priorLines[0].startsWith('Roy:')
        ? priorLines[0]
        : ''

  return { lastUserQuestion: lastUser, priorContext, locale }
}

function buildReport(results: ReviewResult[], dryRun: boolean) {
  const counts = { correcta: 0, mejorable: 0, incorrecta: 0 }
  for (const r of results) counts[r.quality]++

  const lines: string[] = [
    '# Informe de revisión automática de mensajes de Roy',
    '',
    `Generado: ${new Date().toISOString()}`,
    dryRun ? 'Modo: **dry-run** (sin escribir en Supabase)' : 'Modo: **aplicado** (clasificaciones guardadas)',
    '',
    '## Resumen',
    '',
    `- Correctas: ${counts.correcta}`,
    `- Mejorables: ${counts.mejorable}`,
    `- Incorrectas: ${counts.incorrecta}`,
    `- Total revisadas: ${results.length}`,
    '',
  ]

  const problematic = results.filter((r) => r.quality !== 'correcta')
  if (problematic.length) {
    lines.push('## Respuestas a mejorar o incorrectas', '')
    for (const r of problematic) {
      lines.push(`### ${r.quality.toUpperCase()} — ${r.id.slice(0, 8)}…`, '')
      lines.push(`**Pregunta:** ${r.user_question || '—'}`, '')
      lines.push(
        `**Respuesta:** ${r.assistant_answer.slice(0, 500)}${r.assistant_answer.length > 500 ? '…' : ''}`,
        ''
      )
      lines.push(`**Notas:** ${r.notes}`)
      if (r.suggested_fix) lines.push(`**Sugerencia:** ${r.suggested_fix}`)
      if (r.rag_gap !== 'none') {
        lines.push(`**RAG:** ${r.rag_gap}${r.rag_title ? ` · ${r.rag_title}` : ''}`)
      }
      lines.push('')
    }
  }

  const ragGaps = results.filter((r) => r.rag_gap === 'missing' || r.rag_gap === 'not_retrieved')
  if (ragGaps.length) {
    lines.push('## Huecos RAG propuestos', '')
    for (const r of ragGaps) {
      lines.push(`- **${r.rag_gap}** ${r.rag_title || '(sin título)'} — ${r.id.slice(0, 8)}…`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

function csvCell(s: string): string {
  return `"${s.replace(/"/g, '""')}"`
}

function writeRagPendientes(results: ReviewResult[]) {
  const existing: Array<[string, string]> = []
  if (existsSync(PENDIENTES_PATH)) {
    const raw = readFileSync(PENDIENTES_PATH, 'utf8')
    for (const line of raw.split(/\r?\n/).slice(1)) {
      if (!line.trim()) continue
      const m = line.match(/^"((?:[^"]|"")*)","((?:[^"]|"")*)"$/)
      if (!m) continue
      const title = m[1].replace(/""/g, '"').trim()
      const body = m[2].replace(/""/g, '"').trim()
      if (title && body) existing.push([title, body])
    }
  }
  const seen = new Set(
    existing.map(([t]) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase())
  )
  let added = 0
  for (const r of results) {
    if ((r.rag_gap !== 'missing' && r.rag_gap !== 'not_retrieved') || !r.rag_title || !r.rag_body) continue
    const key = r.rag_title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
    if (seen.has(key)) continue
    existing.push([r.rag_title, r.rag_body])
    seen.add(key)
    added += 1
  }
  mkdirSync(path.dirname(PENDIENTES_PATH), { recursive: true })
  writeFileSync(
    PENDIENTES_PATH,
    `${['titulo,contenido', ...existing.map(([t, b]) => `${csvCell(t)},${csvCell(b)}`)].join('\n')}\n`,
    'utf8'
  )
  if (added) console.log(`Huecos RAG: ${added} propuestas en docs/chatbot/INCIDENCIAS-PENDIENTES.csv`)
}

async function main() {
  const { dryRun, all, limit, id } = parseArgs()
  const sb = serviceClient()

  let query = sb
    .from('chatbot_messages')
    .select('id, conversation_id, content, created_at, response_quality')
    .eq('role', 'assistant')
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })

  if (!all && !id) query = query.eq('response_quality', 'sin_tipo')
  if (id) query = query.eq('id', id)
  if (limit) query = query.limit(limit)

  const { data: assistants, error } = await query
  if (error) throw new Error(error.message)

  const rows = (assistants ?? []) as AssistantRow[]
  console.log(
    `\nRevisión Roy — ${rows.length} respuestas${all ? ' (todas)' : ' (sin_tipo)'}${dryRun ? ' (dry-run)' : ''}\n`
  )

  if (!rows.length) {
    console.log('Nada que revisar.')
    return
  }

  const results: ReviewResult[] = []

  for (let i = 0; i < rows.length; i++) {
    const am = rows[i]
    process.stdout.write(`[${i + 1}/${rows.length}] ${am.id.slice(0, 8)}… `)
    try {
      const { lastUserQuestion, priorContext, locale } = await getConversationForReview(
        sb,
        am.conversation_id,
        am.id
      )
      const result = await auditAssistantMessage(sb, {
        userQuestion: lastUserQuestion,
        assistantAnswer: am.content ?? '',
        priorContext,
        locale,
      })
      results.push({
        id: am.id,
        user_question: lastUserQuestion,
        assistant_answer: am.content ?? '',
        quality: result.quality,
        notes: result.notes,
        suggested_fix: result.suggested_fix,
        rag_gap: result.rag_gap,
        rag_title: result.rag_title,
        rag_body: result.rag_body,
      })
      console.log(result.quality)

      if (!dryRun) {
        const { error: upErr } = await sb
          .from('chatbot_messages')
          .update({
            response_quality: result.quality,
            admin_notes: `[auto] ${result.notes}${result.suggested_fix ? ` | Fix: ${result.suggested_fix}` : ''}${result.rag_gap !== 'none' ? ` | RAG: ${result.rag_gap}` : ''}`,
          })
          .eq('id', am.id)
        if (upErr) console.error('  Error guardando:', upErr.message)
      }
    } catch (err) {
      console.log('error')
      console.error(err)
    }
  }

  mkdirSync(path.dirname(REPORT_PATH), { recursive: true })
  writeFileSync(REPORT_PATH, buildReport(results, dryRun), 'utf8')
  if (!dryRun) writeRagPendientes(results)
  console.log(`\nInforme: ${REPORT_PATH}`)
}

main().catch((e) => {
  console.error(`\n${e instanceof Error ? e.message : e}\n`)
  process.exit(1)
})
