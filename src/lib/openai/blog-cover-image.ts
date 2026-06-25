/**
 * Portada de artículo de blog: dossier → GPT-4o ×2 → GPT Image 1.5.
 * Alineado con scripts/backfill-blog-covers-ai.mjs y agente generador de imágenes.txt
 */

import { generateDalle3CoverImage } from '@/lib/openai/event-cover-image';

const MAX_BODY_CHARS = 2800;
const MAX_EXCERPT_CHARS = 800;

export type BlogCoverBriefInput = {
  title_es: string;
  excerpt_es: string;
  content_es: string;
  title_en?: string;
  excerpt_en?: string;
  content_en?: string;
  category_label?: string;
  published_at?: string;
};

function stripHtml(html: string, maxLen: number): string {
  if (!html) return '';
  let t = String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');
  t = t.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
  return t.length > maxLen ? `${t.slice(0, maxLen)}…` : t;
}

function inferSeasonFromDate(iso: string | undefined): string | undefined {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return undefined;
  const m = parseInt(iso.slice(5, 7), 10);
  if (Number.isNaN(m)) return undefined;
  if (m >= 3 && m <= 5) return 'Primavera (hemisferio norte).';
  if (m >= 6 && m <= 8) return 'Verano (hemisferio norte).';
  if (m >= 9 && m <= 11) return 'Otoño (hemisferio norte).';
  return 'Invierno (hemisferio norte).';
}

export function formatBlogCoverUserBrief(input: BlogCoverBriefInput): string {
  const cat = input.category_label?.trim() || 'General';
  const body = stripHtml(input.content_es || input.content_en || '', MAX_BODY_CHARS);
  const exc = stripHtml(input.excerpt_es || input.excerpt_en || '', MAX_EXCERPT_CHARS);
  const season = inferSeasonFromDate(input.published_at);
  const parts = [
    '=== DOSSIER DEL ARTÍCULO DE BLOG (úsalo entero; prioriza coherencia temática y editorial) ===',
    'Tu salida final será SOLO el párrafo-prompt para el modelo de imagen, no resúmenes de este dossier.',
    '',
    `Título (ES): ${input.title_es.trim()}`,
    `Extracto / resumen (ES): ${exc}`,
    `Categoría editorial: ${cat}`,
  ];
  if (input.title_en?.trim()) parts.push(`Título (EN): ${input.title_en.trim()}`);
  if (input.excerpt_en?.trim()) {
    parts.push(`Extracto (EN): ${stripHtml(input.excerpt_en, 500)}`);
  }
  parts.push('', '--- Cuerpo del artículo (texto plano, extracto) ---', body);
  if (season) {
    parts.push(
      '',
      '--- Contexto temporal (publicación) ---',
      `Fecha publicación: ${input.published_at || 'desconocida'}`,
      `Estación aproximada: ${season}`,
    );
  }
  parts.push(
    '',
    '--- Variedad visual (obligatorio) ---',
    'Evita el cliché de banco de imágenes: grupo sentado de espaldas a la cámara mirando montaña, mar o horizonte; filas en deck de madera; siluetas alineadas “meditando al infinito”.',
    'Prioriza cuando encaje con el tema: detalle (manos, esterilla, textil), interior con luz natural, materiales y arquitectura del lugar, bodegón editorial si el artículo es alimentación/salud digestiva, primer plano de elementos del retiro sin forzar paisaje con grupo, encuadre en diagonal o desde altura, espacio casi vacío con atmósfera, o una figura en movimiento suave (no estatua mirando lejos).',
    '',
    '--- Objetivo de la imagen ---',
    'Portada horizontal: una escena fotorrealista, específica al artículo, que no se confunda con otras tarjetas del listado.',
  );
  return parts.join('\n');
}

const PROMPT_BUILDER_BLOG = `Eres un agente senior: director de arte + editor visual + especialista en prompts para generación de imágenes fotorrealistas. Recibes un DOSSIER COMPLETO de un artículo de blog (bienestar, yoga, ayurveda, retiros). Tu ÚNICA salida es UN párrafo en español que el modelo de imagen usará tal cual: debe ser la mejor posible.

ANTES de escribir (mentalmente, no lo imprimas): (1) Elige el escenario visual más específico y honesto con el dossier — no un “wellness genérico”. (2) Conecta TEMÁTICA del artículo (práctica, lugar, ritual, alimentación, naturaleza…) con detalles concretos del texto. (3) Elige UNA luz creíble de día (mañana luminosa, media mañana, tarde clara o golden hour todavía alta). (4) Añade 2–4 sustantivos CONCRETOS de textura o material (madera cruda, sal, arcilla, lino, cerámica, hierbas, piedra caliza…) alineados con el tema, no adjetivos vacíos. (5) Si hay conflicto, prima título + extracto + cuerpo sobre suposiciones. (6) Piensa como si un fotógrafo profesional hiciera una foto real para portada editorial de revista, no “arte generativo”. (7) VARÍA el tipo de plano respecto al típico “retiro”: no caigas por defecto en grupo mirando paisaje.

REGLAS DURAS:
- No inventes lugares nombrados que no aparezcan en el dossier.
- Luz/horario: PROHIBIDO noche, anochecer oscuro, hora azul, escenas subexpuestas. Luz natural entre 09:00 y 20:30, luminosa y clara, usable como portada web.
- Variedad: el dossier incluye opciones A-F de tipo de escena. Elige la que mejor encaje con ESTE artículo concreto; si el tema es de personas (yoga, meditación, retiro), las personas PUEDEN y DEBEN aparecer a menudo, pero varía la composición: de frente, de lado, en acción, en interior, una sola persona, pequeño grupo activo, primer plano de manos. Lo que NO debe repetirse es siempre el mismo encuadre (p. ej. siempre espaldas mirando horizonte).
- Personas cuando aparezcan: naturales, en actividad real, no posadas. Rostros pueden verse si es creíble. Nunca celebridades.
- Prohibido: texto legible, logotipos, carteles, móviles como foco, marcas, datos de contacto.
- Evita “look IA”: cielos neón, piel de plástico, simetría de postal, oversaturación, HDR agresivo, niebla mágica, render o ilustración.

FORMATO DE SALIDA (obligatorio):
- Exactamente UN párrafo en español, sin saltos de línea, sin viñetas, sin comillas, sin markdown.
- Entre ~400 y 1100 caracteres.
- Debe empezar con: Fotografía hiperrealista y cinematográfica de
- Debe terminar integrando: composición editorial premium, encuadre horizontal amplio, texturas realistas, sin texto ni logos ni ilustración, realismo fotográfico absoluto, portada web de alta conversión.

No escribas nada antes ni después del párrafo.`;

const PROMPT_REFINER_BLOG = `Eres un editor fotográfico obsesionado con el hiperrealismo. Recibirás:
1) un DOSSIER del artículo de blog
2) un primer prompt ya redactado

Tu tarea es REESCRIBIR ese prompt para que parezca todavía más una fotografía real tomada por un fotógrafo profesional.

Prioridades: foto REAL, no arte generativo; rebaja exceso “wellness instagram” o turístico; materiales e imperfecciones creíbles; día luminoso, nada de escenas oscuras ni fantasía.

OBLIGATORIO — variedad y anti-repetición:
- Si el borrador cae SIEMPRE en la misma fórmula (ej. paisaje sin nadie, o siempre espaldas mirando lejos, o siempre bodegón), rompe el patrón: introduce personas si no las hay, o quítalas si siempre salen, o cambia encuadre (cenital, lateral, primer plano).
- Lo clave es que cada portada sea distinta a las demás del blog. Personas SON bienvenidas cuando encajen, pero en poses y encuadres variados: de frente, de perfil, caminando, estirándose, cocinando, leyendo, no solo "contemplando".
- La imagen no debe parecer la misma que otras portadas del listado: busca un ancla visual única para este artículo.

Reglas:
- Mantén coherencia absoluta con el dossier.
- Salida: EXACTAMENTE un párrafo en español, sin comillas, sin markdown, sin viñetas, sin saltos de línea.
- Debe empezar por “Fotografía hiperrealista y cinematográfica de”.
- Devuelve solo el prompt final.`;

async function chatParagraph(
  apiKey: string,
  system: string,
  user: string,
  temperature: number,
): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      temperature,
      max_tokens: 900,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: { message?: string };
    choices?: { message?: { content?: string } }[];
  };
  if (!res.ok) throw new Error(data.error?.message || `OpenAI chat (${res.status})`);
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error('Respuesta vacía de OpenAI.');
  return raw
    .replace(/^["']|["']$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function buildDallePromptFromBlog(apiKey: string, input: BlogCoverBriefInput): Promise<string> {
  const dossier = formatBlogCoverUserBrief(input);
  const firstPass = await chatParagraph(apiKey, PROMPT_BUILDER_BLOG, dossier, 0.4);
  const refineUser = ['=== DOSSIER DEL ARTÍCULO ===', dossier, '', '=== PRIMER BORRADOR DEL PROMPT ===', firstPass].join('\n');
  try {
    const refined = await chatParagraph(apiKey, PROMPT_REFINER_BLOG, refineUser, 0.18);
    return refined || firstPass;
  } catch {
    return firstPass;
  }
}

export async function generateBlogCoverImage(
  apiKey: string,
  input: BlogCoverBriefInput,
): Promise<{ buffer: Buffer; contentType: string }> {
  const prompt = await buildDallePromptFromBlog(apiKey, input);
  return generateDalle3CoverImage(apiKey, prompt);
}
