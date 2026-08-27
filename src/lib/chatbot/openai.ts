import OpenAI from 'openai'
import {
  CHATBOT_EMBEDDING_DIMENSIONS,
  CHATBOT_EMBEDDING_MODEL,
  getChatbotModel,
} from './config'

export function sanitizeOpenAIKey(raw: string | undefined): string {
  if (!raw) return ''
  return raw
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\r/g, '')
    .replace(/\u200b/g, '')
}

export function getOpenAIClient(): OpenAI {
  const apiKey = sanitizeOpenAIKey(process.env.OPENAI_API_KEY)
  if (!apiKey) throw new Error('OPENAI_API_KEY no configurada')
  if (!apiKey.startsWith('sk-')) {
    throw new Error('OPENAI_API_KEY con formato inválido')
  }
  return new OpenAI({ apiKey })
}

export async function embedText(text: string): Promise<number[]> {
  const openai = getOpenAIClient()
  const res = await openai.embeddings.create({
    model: CHATBOT_EMBEDDING_MODEL,
    input: text.slice(0, 8000),
    dimensions: CHATBOT_EMBEDDING_DIMENSIONS,
  })
  const vector = res.data[0]?.embedding
  if (!vector?.length) throw new Error('Embedding vacío')
  return vector
}

export { getChatbotModel }
