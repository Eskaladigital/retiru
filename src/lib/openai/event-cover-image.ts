/**
 * Genera un prompt para DALL·E 3 y obtiene la imagen (PNG) a partir del texto del evento.
 * Requiere OPENAI_API_KEY en el servidor.
 */

const MAX_DESCRIPTION_CHARS = 2800;
const MAX_SCHEDULE_CHARS = 1200;

/** Día de programa (wizard o JSON en BD). */
export type CoverScheduleDay = {
  day?: number;
  title_es?: string;
  title?: string;
  items?: Array<{ time?: string; title_es?: string; activity?: string }>;
};

export type EventCoverBriefInput = {
  title_es: string;
  summary_es: string;
  description_es: string;
  title_en?: string;
  summary_en?: string;
  description_en?: string;
  /** Nombre legible del destino (ej. Murcia, Marruecos) */
  destination_label?: string;
  address?: string;
  start_date?: string;
  end_date?: string;
  category_labels?: string[];
  includes_es?: string[];
  excludes_es?: string[];
  schedule?: CoverScheduleDay[] | null;
  languages?: string[];
};

function trimLines(arr: string[] | undefined): string[] {
  return (arr || []).map((s) => s.trim()).filter(Boolean);
}

/** Pista de estación (hemisferio norte) para anclar vegetación, luz y vestuario en el prompt. */
function inferSeasonHintFromStartDate(iso: string | undefined): string | undefined {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return undefined;
  const m = parseInt(iso.slice(5, 7), 10);
  if (Number.isNaN(m)) return undefined;
  if (m >= 3 && m <= 5) return 'Estación inferida (fecha inicio, hemisferio norte): primavera.';
  if (m >= 6 && m <= 8) return 'Estación inferida (fecha inicio, hemisferio norte): verano.';
  if (m >= 9 && m <= 11) return 'Estación inferida (fecha inicio, hemisferio norte): otoño.';
  return 'Estación inferida (fecha inicio, hemisferio norte): invierno.';
}

function nightsBetween(start?: string, end?: string): number | undefined {
  if (!start || !end || !/^\d{4}-\d{2}-\d{2}/.test(start) || !/^\d{4}-\d{2}-\d{2}/.test(end)) return undefined;
  const a = new Date(`${start}T12:00:00Z`).getTime();
  const b = new Date(`${end}T12:00:00Z`).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return undefined;
  const days = Math.round((b - a) / 86400000) + 1;
  return Math.max(1, days) - 1;
}

function formatScheduleForBrief(days: CoverScheduleDay[] | null | undefined): string {
  if (!days || !Array.isArray(days) || days.length === 0) return '';
  const lines: string[] = [];
  for (const d of days.slice(0, 5)) {
    const dayLabel = d.day != null ? `Día ${d.day}` : 'Día';
    const dayTitle = (d.title_es || d.title || '').trim();
    lines.push(dayTitle ? `${dayLabel}: ${dayTitle}` : dayLabel);
    const items = d.items || [];
    for (const it of items.slice(0, 6)) {
      const act = (it.title_es || it.activity || '').trim();
      const t = (it.time || '').trim();
      if (act) lines.push(t ? `  ${t} — ${act}` : `  ${act}`);
    }
  }
  const t = lines.join('\n').trim();
  return t.length > MAX_SCHEDULE_CHARS ? `${t.slice(0, MAX_SCHEDULE_CHARS)}…` : t;
}

/**
 * Texto único que ve el modelo: dossier completo para sintetizar un solo prompt de portada.
 */
export function formatEventCoverUserBrief(input: EventCoverBriefInput): string {
  const desc = (input.description_es || '').slice(0, MAX_DESCRIPTION_CHARS);
  const descEn = (input.description_en || '').trim().slice(0, 1200);
  const parts: string[] = [];

  parts.push(
    '=== DOSSIER DEL EVENTO (úsalo entero; prioriza coherencia geográfica y temática) ===',
    'Tu salida final será SOLO el párrafo-prompt para DALL·E, no resúmenes de este dossier.',
  );

  parts.push(`Título (ES): ${input.title_es.trim()}`);
  parts.push(`Resumen (ES): ${input.summary_es.trim()}`);
  parts.push(`Descripción (ES):\n${desc}`);

  if (input.title_en?.trim()) parts.push(`Título (EN): ${input.title_en.trim()}`);
  if (input.summary_en?.trim()) parts.push(`Resumen (EN): ${input.summary_en.trim()}`);
  if (descEn) parts.push(`Descripción (EN, extracto):\n${descEn}`);

  const geo: string[] = [];
  if (input.destination_label?.trim()) geo.push(`Destino Retiru: ${input.destination_label.trim()}`);
  if (input.address?.trim()) geo.push(`Dirección / zona: ${input.address.trim()}`);
  if (input.start_date) geo.push(`Fecha inicio: ${input.start_date}`);
  if (input.end_date) geo.push(`Fecha fin: ${input.end_date}`);
  const nights = nightsBetween(input.start_date, input.end_date);
  if (nights != null) geo.push(`Duración aproximada: ${nights === 0 ? 'mismo día / jornada' : `${nights} noche(s) de experiencia`}`);
  const season = inferSeasonHintFromStartDate(input.start_date);
  if (season) geo.push(season);
  if (geo.length) parts.push(`--- Geografía, calendario y clima ambiente ---\n${geo.join('\n')}`);

  const cats = trimLines(input.category_labels).slice(0, 10);
  if (cats.length) parts.push(`--- Categorías (temática) ---\n${cats.join(', ')}`);

  const inc = trimLines(input.includes_es);
  if (inc.length) parts.push(`--- Incluye (objetos, alojamiento, comidas, materiales que puedan verse) ---\n${inc.join('; ')}`);

  const exc = trimLines(input.excludes_es);
  if (exc.length) parts.push(`--- No incluye (no mostrar como protagonista) ---\n${exc.join('; ')}`);

  const sch = formatScheduleForBrief(input.schedule ?? null);
  if (sch) parts.push(`--- Programa (extracto: arquetipos de escena) ---\n${sch}`);

  const lang = trimLines(input.languages);
  if (lang.length) parts.push(`Idiomas del evento: ${lang.join(', ')}`);

  return parts.join('\n\n');
}

/**
 * Agente único: sintetiza dossier → un párrafo optimizado para DALL·E 3.
 */
const PROMPT_BUILDER_SYSTEM = `Eres un agente senior: director de arte + location scout + especialista en prompts para DALL·E 3. Recibes un DOSSIER COMPLETO de un retiro (geografía, fechas, categorías, textos, programa, incluidos). Tu ÚNICA salida es UN párrafo en español que DALL·E usará tal cual: debe ser la mejor posible.

ANTES de escribir (mentalmente, no lo imprimas): (1) Elige el escenario visual más específico y honesto con el dossier — no un “paraíso genérico”. (2) Conecta TEMÁTICA: yoga/meditación/cerámica/ayurveda/círculo/mar/desierto/montaña según categorías + descripción + programa + incluidos. (3) Elige UNA luz creíble de día (mañana luminosa, media mañana, tarde clara o golden hour todavía alta) coherente con estación y región si el dossier lo permite. (4) Añade 2–4 sustantivos CONCRETOS de textura o material (adobe, lino, arcilla, corcho, sal, musgo, dunas, olivos…) alineados con el lugar y la actividad, no adjetivos vacíos. (5) Si hay conflicto entre campos, prima descripción + título + destino sobre suposiciones. (6) Piensa como si un fotógrafo profesional estuviera físicamente allí con una cámara full frame de alta gama haciendo una foto real para una portada editorial, no como si estuviera “creando arte”.

REGLAS DURAS:
- Geografía: respeta destino/dirección/fechas/estación inferida; no inventes monumentos ni ciudades nombradas si no salen en el dossier.
- Luz/horario: PROHIBIDO noche, anochecer oscuro, hora azul, sol ya puesto, amanecer antes de salir el sol o escenas subexpuestas. La foto debe sentirse tomada con luz natural real entre las 09:00 y las 20:30 de horario de verano del sur de España: luminosa, clara y usable como portada.
- Público: si el texto indica solo mujeres u otro colectivo, respétalo; si no, grupo mixto o sin género explícito, sin estereotipos.
- Personas: como mucho pocas figuras; rostros sin identidad (espaldas, lejanía, desenfoque, silueta). Nunca celebridades. Si la presencia humana hace la imagen menos realista, prioriza una escena de entorno real con presencia humana mínima, lejana o incluso ninguna.
- Prohibido en la escena: texto legible, logotipos, carteles, móviles como foco, marcas, datos de contacto.
- Evita “look IA”: cielos neón, piel de plástico, simetría de postal barata, oversaturación, HDR agresivo, tonos morados irreales, niebla mágica, render/pintura/ilustración, perfección plástica, piel suavizada, brillo artificial, composición imposible o escenografía de fantasía, sombras excesivamente cerradas o escenas tenebrosas.

FORMATO DE SALIDA (obligatorio):
- Exactamente UN párrafo en español, sin saltos de línea, sin viñetas, sin comillas, sin markdown.
- Entre ~400 y 1100 caracteres: denso y cinematográfico, pero fotográfico (no guion de película).
- Debe empezar con: Fotografía hiperrealista y cinematográfica de
- Debe terminar integrando (en la misma frase final o penúltima) la idea de: composición editorial premium, fotografía de viaje y bienestar de lujo, profundidad de campo natural, texturas realistas, encuadre horizontal amplio, sin texto ni logos ni ilustración, realismo fotográfico absoluto, portada web de alta conversión.
- La redacción debe sonar a encargo fotográfico real: cámara profesional, luz existente, color natural, detalles imperfectos creíbles y atmósfera auténtica.

No escribas nada antes ni después del párrafo.`;

/**
 * Segunda pasada: actúa como editor de realismo fotográfico y elimina sesgos típicos
 * de “imagen IA bonita” para acercarse a una foto real de portada.
 */
const PROMPT_REALISM_REFINER_SYSTEM = `Eres un editor fotográfico obsesionado con el hiperrealismo. Recibirás:
1) un DOSSIER del evento
2) un primer prompt ya redactado

Tu tarea es REESCRIBIR ese prompt para que parezca todavía más una fotografía real tomada por un fotógrafo profesional en localización real.

Prioridades:
- La imagen debe parecer una FOTO REAL, no arte generativo.
- Si el borrador suena demasiado bonito, demasiado escenificado, demasiado “wellness instagram”, demasiado simétrico o demasiado turístico, rebájalo.
- Da prioridad a entorno real, luz existente, materiales concretos, imperfecciones creíbles, composición editorial contenida.
- Si las personas no son imprescindibles para comunicar el retiro, reduce su protagonismo o déjalas lejanas/secundarias. Si aparecen, nada de poses artificiales ni expresiones de anuncio.
- Corrige cualquier tendencia a oscuridad excesiva: nada de noche, nada de sol escondido, nada de cielos dramáticos oscuros; debe sentirse una franja luminosa y comercialmente útil de día.
- Evita cualquier sensación de fantasía, exceso de color, teatralidad, glow, piel plástica, postal irreal o escena de catálogo falso.

Reglas:
- Mantén coherencia absoluta con el dossier.
- Salida: EXACTAMENTE un párrafo en español, sin comillas, sin markdown, sin viñetas, sin saltos de línea.
- Debe empezar por “Fotografía hiperrealista y cinematográfica de”.
- Debe sonar a encargo fotográfico premium real, no a instrucción artística abstracta.
- No añadas explicaciones sobre lo que has cambiado. Devuelve solo el prompt final.`;

export type EventCoverTextInput = EventCoverBriefInput;

export async function buildDallePromptFromEvent(apiKey: string, input: EventCoverTextInput): Promise<string> {
  const userContent = formatEventCoverUserBrief(input);

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      temperature: 0.32,
      max_tokens: 900,
      messages: [
        { role: 'system', content: PROMPT_BUILDER_SYSTEM },
        { role: 'user', content: userContent },
      ],
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    error?: { message?: string };
    choices?: { message?: { content?: string } }[];
  };

  if (!res.ok) {
    throw new Error(data.error?.message || `OpenAI chat error (${res.status})`);
  }

  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) {
    throw new Error('No se pudo generar el prompt de imagen.');
  }

  const firstPass = raw
    .replace(/^["']|["']$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const realismReviewUserContent = [
    '=== DOSSIER DEL EVENTO ===',
    userContent,
    '',
    '=== PRIMER BORRADOR DEL PROMPT ===',
    firstPass,
  ].join('\n');

  const refineRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      temperature: 0.18,
      max_tokens: 900,
      messages: [
        { role: 'system', content: PROMPT_REALISM_REFINER_SYSTEM },
        { role: 'user', content: realismReviewUserContent },
      ],
    }),
  });

  const refineData = (await refineRes.json().catch(() => ({}))) as {
    error?: { message?: string };
    choices?: { message?: { content?: string } }[];
  };

  if (!refineRes.ok) {
    throw new Error(refineData.error?.message || `OpenAI refine error (${refineRes.status})`);
  }

  const refined = refineData.choices?.[0]?.message?.content?.trim();
  if (!refined) {
    return firstPass;
  }

  return refined
    .replace(/^["']|["']$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Refuerzo final en español para DALL·E (hiperrealismo frente al sesgo “ilustrado”). */
const DALLE_ES_REALISM_TAIL =
  ' Tomada como fotografía real con cámara full frame profesional y óptica de reportaje de alta calidad, luz existente físicamente creíble, color natural y balance de blancos realista, contraste moderado, grano mínimo natural, detalle auténtico en piel, telas, arena, piedra, vegetación o arquitectura según la escena; siempre de día, luminosa y clara, nunca nocturna ni sombría, con sensación de franja útil entre 09:00 y 20:30 de verano del sur de España; si aparecen personas, secundarias, naturales y no posadas; sin HDR agresivo, sin acabado plástico, sin render 3D, sin pintura digital, sin ilustración, sin tipografía ni logotipos.';

function buildFinalDallePrompt(sceneFromGpt: string): string {
  const scene = sceneFromGpt.replace(/\s+/g, ' ').trim();
  if (scene.length < 200) {
    throw new Error('El prompt de imagen es demasiado corto.');
  }
  const room = 4000 - DALLE_ES_REALISM_TAIL.length - 2;
  const core = scene.length <= room ? scene : scene.slice(0, room - 1).trimEnd() + '…';
  return `${core}${DALLE_ES_REALISM_TAIL}`.replace(/\s+/g, ' ').trim().slice(0, 4000);
}

export async function generateDalle3CoverImage(
  apiKey: string,
  prompt: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  const trimmed = buildFinalDallePrompt(prompt);

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: trimmed,
      n: 1,
      size: '1792x1024',
      quality: 'hd',
      style: 'natural',
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    error?: { message?: string };
    data?: { url?: string; b64_json?: string }[];
  };

  if (!res.ok) {
    throw new Error(data.error?.message || `DALL·E error (${res.status})`);
  }

  const url = data.data?.[0]?.url;
  const b64 = data.data?.[0]?.b64_json;

  if (url) {
    const imgRes = await fetch(url);
    if (!imgRes.ok) {
      throw new Error('No se pudo descargar la imagen generada.');
    }
    const buf = Buffer.from(await imgRes.arrayBuffer());
    const ct = imgRes.headers.get('content-type') || 'image/png';
    return { buffer: buf, contentType: ct.startsWith('image/') ? ct : 'image/png' };
  }

  if (b64) {
    return { buffer: Buffer.from(b64, 'base64'), contentType: 'image/png' };
  }

  throw new Error('Respuesta de imagen vacía de OpenAI.');
}
