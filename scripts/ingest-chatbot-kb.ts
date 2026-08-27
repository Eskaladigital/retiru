/**
 * Ingesta KB de Roy: plataforma + FAQs + blog publicado (ES y EN).
 * Uso: npx tsx scripts/ingest-chatbot-kb.ts
 */
import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { applyPublicBlogFilters } from '../src/lib/blog-visible'
import { embedText } from '../src/lib/chatbot/openai'
import { chunkFromArticle, collectStaticChunks } from '../src/lib/chatbot/kb-sources'
import type { IngestChunk } from '../src/lib/chatbot/types'

function loadEnvLocal() {
  const envPath = join(process.cwd(), '.env.local')
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

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function loadBlogChunks(): Promise<IngestChunk[]> {
  const sb = serviceClient()
  const { data, error } = await applyPublicBlogFilters(
    sb
      .from('blog_articles')
      .select(
        'title_es, title_en, slug, slug_en, excerpt_es, excerpt_en, content_es, content_en, category_id, blog_categories(name_es, name_en)'
      )
  )
  if (error) throw new Error(error.message)
  const out: IngestChunk[] = []
  for (const a of data ?? []) {
    const catRaw = (a as { blog_categories?: { name_es?: string; name_en?: string } | { name_es?: string; name_en?: string }[] | null })
      .blog_categories
    const cat = Array.isArray(catRaw) ? catRaw[0] : catRaw
    const es = chunkFromArticle('es', {
      ...a,
      category: cat?.name_es || null,
    })
    if (es) out.push(es)
    const en = chunkFromArticle('en', {
      ...a,
      category: cat?.name_en || cat?.name_es || null,
    })
    if (en) out.push(en)
  }
  return out
}

async function upsertSourceChunks(source: string, chunks: IngestChunk[]): Promise<number> {
  const sb = serviceClient()
  const { error: delErr } = await sb.from('chatbot_kb_chunks').delete().eq('source', source)
  if (delErr) throw new Error(`Delete ${source}: ${delErr.message}`)

  let inserted = 0
  for (const chunk of chunks) {
    const embedding = await embedText(`${chunk.title}\n${chunk.content}`)
    const { error } = await sb.from('chatbot_kb_chunks').insert({
      source: chunk.source,
      locale: chunk.locale,
      title: chunk.title,
      content: chunk.content,
      content_hash: chunk.content_hash,
      embedding,
    })
    if (error) {
      if (error.message.includes('duplicate') || error.code === '23505') continue
      throw new Error(`Insert: ${error.message}`)
    }
    inserted++
    process.stdout.write(`\r  ${source}: ${inserted}/${chunks.length}`)
  }
  console.log('')
  return inserted
}

async function main() {
  console.log('\nIngesta KB chatbot Roy (Retiru)\n')

  const staticChunks = collectStaticChunks()
  const blogChunks = await loadBlogChunks()
  const all = [...staticChunks, ...blogChunks]

  const bySource = new Map<string, IngestChunk[]>()
  for (const c of all) {
    const list = bySource.get(c.source) ?? []
    list.push(c)
    bySource.set(c.source, list)
  }

  console.log(`Fragmentos totales: ${all.length} (${bySource.size} fuentes)\n`)

  let total = 0
  for (const [source, chunks] of bySource) {
    console.log(`→ ${source} (${chunks.length} chunks)`)
    total += await upsertSourceChunks(source, chunks)
  }

  console.log(`\nIngesta completada: ${total} chunks insertados\n`)
}

main().catch((e) => {
  const cause = e instanceof Error && 'cause' in e ? e.cause : undefined
  console.error(`\n${e instanceof Error ? e.message : e}`)
  if (cause) console.error(cause)
  process.exit(1)
})
