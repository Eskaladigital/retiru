/**
 * Portada de centro de bienestar: dossier → GPT-4o ×2 → GPT Image 1.5.
 */

import { generateDalle3CoverImage } from '@/lib/openai/event-cover-image';

const MAX_DESCRIPTION_CHARS = 2800;

export type CenterCoverBriefInput = {
  name: string;
  description_es: string;
  type?: string;
  type_label?: string;
  city?: string;
  province?: string;
  address?: string;
  region?: string;
  country?: string;
  services_es?: string[];
  schedule_summary_es?: string;
  description_en?: string;
};

function stripHtml(html: string, maxLen: number): string {
  if (!html) return '';
  let t = String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');
  t = t.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
  return t.length > maxLen ? `${t.slice(0, maxLen)}…` : t;
}

function trimLines(arr: string[] | undefined): string[] {
  return (arr || []).map((s) => s.trim()).filter(Boolean);
}

export function formatCenterCoverUserBrief(input: CenterCoverBriefInput): string {
  const desc = stripHtml(input.description_es || '', MAX_DESCRIPTION_CHARS);
  const descEn = stripHtml(input.description_en || '', 1200);
  const parts: string[] = [
    '=== DOSSIER DEL CENTRO DE BIENESTAR (úsalo entero; prioriza coherencia geográfica y del tipo de centro) ===',
    'Tu salida final será SOLO el párrafo-prompt para el modelo de imagen, no resúmenes de este dossier.',
    '',
    `Nombre del centro: ${input.name.trim()}`,
    `Tipo: ${input.type_label?.trim() || input.type?.trim() || 'centro de bienestar'}`,
    `Descripción (ES):\n${desc}`,
  ];
  if (descEn) parts.push(`Descripción (EN, extracto):\n${descEn}`);

  const geo: string[] = [];
  if (input.city?.trim()) geo.push(`Ciudad: ${input.city.trim()}`);
  if (input.province?.trim()) geo.push(`Provincia: ${input.province.trim()}`);
  if (input.region?.trim()) geo.push(`Región: ${input.region.trim()}`);
  if (input.country?.trim()) geo.push(`País: ${input.country.trim()}`);
  if (input.address?.trim()) geo.push(`Dirección / zona: ${input.address.trim()}`);
  if (geo.length) parts.push(`--- Ubicación ---\n${geo.join('\n')}`);

  const services = trimLines(input.services_es).slice(0, 12);
  if (services.length) parts.push(`--- Servicios (pueden inspirar la escena) ---\n${services.join('; ')}`);
  if (input.schedule_summary_es?.trim()) {
    parts.push(`--- Horario (contexto de uso diario) ---\n${input.schedule_summary_es.trim()}`);
  }

  parts.push(
    '',
    '--- Variedad visual (obligatorio) ---',
    'Elige UNA escena fotorrealista del espacio o la actividad típica del centro, no un cartel publicitario:',
    '  A) Sala de práctica preparada: esterillas, cojines, luz natural, madera, plantas.',
    '  B) Detalle de materiales o ritual: cuencos, incienso, hierbas ayurvédicas, textiles, cerámica.',
    '  C) Exterior o entrada acogedora del centro en su entorno urbano o natural real.',
    '  D) Personas en clase o tratamiento: natural, en actividad, no posadas de stock.',
    '  E) Zona de descanso, recepción luminosa o patio interior del centro.',
    'Evita clichés: grupo de espaldas mirando horizonte, simetría de postal, interior genérico sin personalidad.',
    '',
    '--- Objetivo ---',
    'Portada horizontal para ficha de directorio: debe transmitir el tipo de centro y la sensación del lugar descrito.',
  );
  return parts.join('\n\n');
}

const PROMPT_BUILDER_CENTER = `Eres un agente senior: director de arte + fotógrafo de arquitectura y lifestyle + especialista en prompts fotorrealistas. Recibes un DOSSIER de un centro de bienestar (yoga, meditación, ayurveda). Tu ÚNICA salida es UN párrafo en español para el modelo de imagen.

ANTES de escribir (mentalmente): (1) Identifica el tipo de centro y el espacio más representativo según descripción y servicios. (2) Ancla la escena en la geografía real (ciudad/provincia/país del dossier). (3) Elige luz de día creíble (09:00–20:30, luminosa). (4) Incluye 2–4 materiales concretos (lino, corcho, madera cruda, arcilla, hierbas, piedra…). (5) VARÍA encuadre: no caigas siempre en la misma fórmula.

REGLAS DURAS:
- No inventes monumentos ni ciudades que no aparezcan en el dossier.
- PROHIBIDO noche, escenas oscuras, hora azul, render 3D, ilustración, texto legible, logotipos, marcas.
- Personas opcionales: si aparecen, en actividad real (clase, masaje, preparación de té), no posadas.
- Evita look IA: piel plástica, HDR agresivo, oversaturación, simetría de catálogo falso.

FORMATO:
- UN párrafo en español, sin saltos de línea, sin comillas, sin markdown, ~400–1100 caracteres.
- Debe empezar con: Fotografía hiperrealista y cinematográfica de
- Debe terminar integrando: composición editorial premium, encuadre horizontal amplio, texturas realistas, sin texto ni logos, realismo fotográfico absoluto, portada web de alta conversión.

Devuelve solo el párrafo.`;

const PROMPT_REFINER_CENTER = `Eres un editor fotográfico obsesionado con el hiperrealismo. Recibirás un DOSSIER de centro de bienestar y un primer prompt.

REESCRÍBELO para que parezca una fotografía real de un centro existente, no arte generativo ni cartel de spa genérico.

Prioridades: espacio creíble, luz existente, materiales auténticos, composición editorial contenida, día luminoso.

Si el borrador es demasiado genérico o repetitivo, cámbialo: otro encuadre, otro detalle, otra zona del centro.

Reglas:
- Coherencia absoluta con el dossier.
- Salida: EXACTAMENTE un párrafo en español, sin comillas ni markdown, empezando por “Fotografía hiperrealista y cinematográfica de”.
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

export async function buildDallePromptFromCenter(apiKey: string, input: CenterCoverBriefInput): Promise<string> {
  const dossier = formatCenterCoverUserBrief(input);
  const firstPass = await chatParagraph(apiKey, PROMPT_BUILDER_CENTER, dossier, 0.32);
  const refineUser = ['=== DOSSIER DEL CENTRO ===', dossier, '', '=== PRIMER BORRADOR DEL PROMPT ===', firstPass].join('\n');
  try {
    const refined = await chatParagraph(apiKey, PROMPT_REFINER_CENTER, refineUser, 0.18);
    return refined || firstPass;
  } catch {
    return firstPass;
  }
}

export async function generateCenterCoverImage(
  apiKey: string,
  input: CenterCoverBriefInput,
): Promise<{ buffer: Buffer; contentType: string }> {
  const prompt = await buildDallePromptFromCenter(apiKey, input);
  return generateDalle3CoverImage(apiKey, prompt);
}
