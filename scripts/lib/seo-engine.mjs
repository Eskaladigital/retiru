// scripts/lib/seo-engine.mjs
//
// Motor de generación SEO editorial por capas (§8 docs/SEO-LANDINGS.md).
//
// Exporta:
//   - LAYERS            → metadatos de cada capa (1..5) y su tabla/clave.
//   - SUPPRESSION_REASONS
//   - applySuppressionRules(context) → {suppress_reason} | null
//   - buildDossier(context)          → string con datos reales para el prompt
//   - generateLayerContent({ context, serp }) → objeto con intro_*, sections_*, meta_*, faq_*
//
// El contenido se genera con GPT-4o vía Chat Completions + response_format JSON.

import { serpLocalCenters } from './serpapi.mjs';

// ───────────────────────────────────────────────────────────────────────────
// Metadatos por capa
// ───────────────────────────────────────────────────────────────────────────
export const LAYERS = {
  // Cap. 1 · Nacional por tipo
  type_national: {
    id: 1,
    table: 'categories',
    uniqueKey: ['slug'],
    label: 'Nacional por tipo',
    urlPattern: '/{locale}/centros/[tipo]',
    primaryIntent: 'Definir la disciplina + panorama nacional (sin localizar)',
    allowedSections: ['what_to_expect', 'history'],
    forbiddenInH1: ['provincia', 'ciudad', 'distrito'],
    faqCount: [4, 6],
  },
  // Cap. 2 · Tipo × Estilo (nacional)
  type_style: {
    id: 2,
    table: 'styles',
    uniqueKey: ['center_type', 'slug'],
    label: 'Tipo×Estilo (nacional)',
    urlPattern: '/{locale}/centros/[tipo]/estilo/[estilo]',
    primaryIntent: 'Qué es este estilo; en qué se diferencia; panorama nacional',
    allowedSections: ['what_to_expect', 'history', 'how_to_choose'],
    forbiddenInH1: ['provincia', 'ciudad'],
    faqCount: [5, 7],
  },
  // Cap. 3 · Tipo × Provincia
  type_province: {
    id: 3,
    table: 'center_type_province_seo',
    uniqueKey: ['type', 'province_slug'],
    filter: { city_slug: null },
    label: 'Tipo×Provincia',
    urlPattern: '/{locale}/centros/[tipo]/[provincia]',
    primaryIntent: 'Directorio de centros de {tipo} en {Prov}',
    // 4 secciones TODAS localizadas (no duplican nacional):
    //  - why_here: atractivo de la provincia para esta disciplina
    //  - what_to_expect: qué esperar de un centro de esa disciplina EN esa provincia
    //                    (formato local, tipo de público, duración típica, rango de precios local)
    //  - how_to_choose: criterios prácticos para elegir
    //  - local_scene:   comunidad, eventos, retiros cercanos, escuelas referentes LOCALES
    allowedSections: ['why_here', 'what_to_expect', 'how_to_choose', 'local_scene'],
    forbiddenInH1: [],
    faqCount: [6, 8],
  },
  // Cap. 4 · Tipo × Estilo × Provincia
  style_province: {
    id: 4,
    table: 'style_province_seo',
    uniqueKey: ['center_type', 'style_slug', 'province_slug'],
    label: 'Estilo×Provincia',
    urlPattern: '/{locale}/centros/[tipo]/estilo/[estilo]/[provincia]',
    primaryIntent: 'Centros de {tipo}-{estilo} concretamente en {Prov}',
    allowedSections: ['why_here_for_style', 'how_to_choose_style_local'],
    forbiddenInH1: [],
    faqCount: [5, 7],
  },
  // Cap. 5 · Tipo × Provincia × Ciudad
  type_province_city: {
    id: 5,
    table: 'center_type_province_seo',
    uniqueKey: ['type', 'province_slug', 'city_slug'],
    filter: { city_slug_not_null: true },
    label: 'Tipo×Provincia×Ciudad',
    urlPattern: '/{locale}/centros/[tipo]/[provincia]/[ciudad]',
    primaryIntent: 'Centros de {tipo} en {Ciudad} con acceso/transporte/carácter',
    allowedSections: ['access_transport_character'],
    forbiddenInH1: [],
    faqCount: [5, 7],
  },
};

export const SUPPRESSION_REASONS = {
  DUPLICATE_OF_PARENT: 'duplicate_of_parent',            // R1: ciudad ≥ 60% provincia
  THIN_CONTENT: 'thin_content',                          // R2/R4: < mínimo centros
  DOMINANT_STYLE_EDUCATIONAL_ONLY: 'dominant_style_educational_only', // R3: hatha, abhyanga
  DUPLICATE_PROVINCE_SLUG: 'duplicate_province_slug',    // R5: consolidado a canonical
};

// Estilos "dominantes": mayoritarios en el corpus → nacional pasa a educativo,
// no se generan landings Estilo×Provincia (R3 §8.4).
export const DOMINANT_STYLES = new Set(['hatha', 'abhyanga']);

// Mapeo de slug de disciplina → label legible en ES/EN para el prompt.
// Sin esto, el modelo escribía literal "Centros de meditation en Madrid"
// (slug en lugar de palabra en español). Corrige §B1.
const TYPE_LABELS = {
  yoga:       { es: 'yoga',       en: 'yoga' },
  meditation: { es: 'meditación', en: 'meditation' },
  ayurveda:   { es: 'ayurveda',   en: 'ayurveda' },
};
function typeEs(slug) { return TYPE_LABELS[slug]?.es || slug; }
function typeEn(slug) { return TYPE_LABELS[slug]?.en || slug; }

// Provincias alias ya consolidadas (no deberían aparecer, pero por seguridad).
const ALIAS_PROVINCE_SLUGS = new Set([
  'islas-baleares', 'guipuzcoa', 'lerida', 'tenerife', 'pirineos-atlanticos',
]);

// ───────────────────────────────────────────────────────────────────────────
// Reglas de supresión
// ───────────────────────────────────────────────────────────────────────────
/**
 * Determina si una landing debe marcarse con suppress_reason.
 * @param {object} ctx - contexto con layer, counts, slugs...
 * @returns {string|null}
 */
export function applySuppressionRules(ctx) {
  // R5: slug de provincia duplicado (alias no canónico)
  if (ctx.provinceSlug && ALIAS_PROVINCE_SLUGS.has(ctx.provinceSlug)) {
    return SUPPRESSION_REASONS.DUPLICATE_PROVINCE_SLUG;
  }

  // R3: estilos dominantes — nacional queda educativo (no se suprime) pero
  // las combinaciones Estilo×Provincia sí quedan marcadas como educativas-only
  // (sin landing local).
  if (ctx.layer === LAYERS.style_province && DOMINANT_STYLES.has(ctx.styleSlug)) {
    return SUPPRESSION_REASONS.DOMINANT_STYLE_EDUCATIONAL_ONLY;
  }

  // R2/R4: thin content
  // Cap.3 provincia: <1 centro → nunca (no existe), >=1 OK.
  // Cap.4 estilo×prov: <3 centros → suprimir.
  // Cap.5 ciudad: <2 centros → suprimir.
  if (ctx.layer === LAYERS.style_province && (ctx.centersCount || 0) < 3) {
    return SUPPRESSION_REASONS.THIN_CONTENT;
  }
  if (ctx.layer === LAYERS.type_province_city && (ctx.centersCount || 0) < 2) {
    return SUPPRESSION_REASONS.THIN_CONTENT;
  }
  if (ctx.layer === LAYERS.type_province && (ctx.centersCount || 0) < 1) {
    return SUPPRESSION_REASONS.THIN_CONTENT;
  }

  // R1: Ciudad ≥60% de su provincia → canibaliza con la provincial. Dejamos que
  // el orquestador le pase `cityShareOfProvince` para decidir.
  if (ctx.layer === LAYERS.type_province_city && typeof ctx.cityShareOfProvince === 'number') {
    if (ctx.cityShareOfProvince >= 0.6) {
      return SUPPRESSION_REASONS.DUPLICATE_OF_PARENT;
    }
  }

  return null;
}

// ───────────────────────────────────────────────────────────────────────────
// Dossier builder (datos reales para el prompt)
// ───────────────────────────────────────────────────────────────────────────
function stripHtml(html, maxLen = 160) {
  if (!html) return '';
  let t = String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return t.length > maxLen ? `${t.slice(0, maxLen)}…` : t;
}

function formatCenters(centers, max = 10) {
  return centers
    .slice(0, max)
    .map((c) => {
      const loc = c.city ? ` · ${c.city}` : '';
      const desc = c.description_snippet ? ` — "${stripHtml(c.description_snippet, 90)}"` : '';
      return `- ${c.name}${loc}${desc}`;
    })
    .join('\n');
}

function formatSerpBlock(serp) {
  if (!serp) return '(sin datos de SerpApi)';
  const paa = (serp.paa || []).slice(0, 8).map((p, i) => `  ${i + 1}. ${p.question}${p.snippet ? ` — ${p.snippet.slice(0, 120)}` : ''}`).join('\n');
  const rel = (serp.related || []).slice(0, 10).map((r) => `  · ${r}`).join('\n');
  const loc = (serp.local_pack || []).slice(0, 8).map((p) => `  · ${p.name}${p.rating ? ` (${p.rating}⭐)` : ''}`).join('\n');
  const fs = serp.featured_snippet ? `Featured snippet: ${serp.featured_snippet.slice(0, 220)}` : '';
  return [
    paa ? `People Also Ask:\n${paa}` : '',
    rel ? `Related searches:\n${rel}` : '',
    loc ? `Local pack (Google Maps):\n${loc}` : '',
    fs,
  ].filter(Boolean).join('\n\n');
}

export function buildDossier(ctx) {
  const lines = [];
  lines.push(`CAPA: ${ctx.layer.label} (id ${ctx.layer.id})`);
  lines.push(`INTENT PRIMARIO (único): ${ctx.layer.primaryIntent}`);
  lines.push(`URL pattern: ${ctx.layer.urlPattern}`);

  if (ctx.type) lines.push(`Disciplina: ${ctx.type}`);
  if (ctx.styleSlug) lines.push(`Estilo: ${ctx.styleName || ctx.styleSlug}`);
  if (ctx.provinceSlug) lines.push(`Provincia: ${ctx.provinceName} (slug: ${ctx.provinceSlug})`);
  if (ctx.citySlug) lines.push(`Ciudad/barrio: ${ctx.cityName} (slug: ${ctx.citySlug})`);

  if (typeof ctx.centersCount === 'number') {
    lines.push(`Centros activos en esta combinación: ${ctx.centersCount}`);
  }
  if (ctx.cityBreakdown && ctx.cityBreakdown.length) {
    lines.push(`Distribución por ciudad: ${ctx.cityBreakdown.map((c) => `${c.city} (${c.count})`).join(', ')}`);
  }
  if (typeof ctx.cityShareOfProvince === 'number') {
    lines.push(`Peso relativo de esta ciudad dentro de su provincia: ${Math.round(ctx.cityShareOfProvince * 100)}%`);
  }
  if (ctx.allowedSections) {
    lines.push(`Secciones ÚNICAS permitidas para esta capa (§8.2): ${ctx.allowedSections.join(', ')}`);
  }
  if (ctx.centers && ctx.centers.length) {
    lines.push('');
    lines.push(`Muestra de centros (máx. 10):\n${formatCenters(ctx.centers, 10)}`);
  }
  if (ctx.serp) {
    lines.push('');
    lines.push('=== DATOS REALES DE GOOGLE (SerpApi) ===');
    lines.push(formatSerpBlock(ctx.serp));
  }
  return lines.join('\n');
}

// ───────────────────────────────────────────────────────────────────────────
// Prompt factory por capa
// ───────────────────────────────────────────────────────────────────────────
const BASE_RULES = `
Reglas duras (comunes a todas las capas):
- Tono cercano, informado y honesto. Nada de "wellness instagram", nada de clickbait.
- NO inventes datos. Si no están en el dossier, no los uses.
- NO incluyas años (2023, 2024, 2025, 2026…). Contenido evergreen.
- Todas las secciones llevan H2 (vas a devolverlo como "heading" separado del HTML).
- El HTML solo puede contener <p>, <strong>, <em>, <ul>, <ol>, <li>. NO uses <h1>, <h2>, <h3>, <img>, <a>.
- Cada sección debe mencionar señales locales reales (topónimos, cultura, barrios) cuando aplique a la capa.
- NO repitas frases entre secciones.
- FAQ: preguntas REALES extraídas del bloque "People Also Ask" del dossier cuando estén disponibles. Si no, preguntas útiles relacionadas con precios, acceso, transporte, idiomas, nivel. Respuestas 50-90 palabras.
- meta_title: máx. 60 chars. meta_description: 150-160 chars. Ambos sin años.
- En inglés mantén los mismos datos reales (nombres, topónimos) sin traducir; traduce solo el texto explicativo.

LISTA NEGRA anti-cliché (PROHIBIDO usar estas frases o sinónimos obvios):
- "refugio para", "oasis de", "paisajes verdes", "rica cultura", "cultura milenaria"
- "equilibrio entre cuerpo y mente", "estilo de vida", "bienestar integral"
- "práctica ancestral", "técnicas ancestrales", "sabiduría milenaria"
- "enclave único", "punto de referencia", "destino imprescindible"
- "sumérgete", "descubre", "déjate llevar", "conecta con tu esencia"
- "hermosa", "vibrante", "bullicioso", "mezcla de tradición y modernidad"
- "amplia oferta", "amplia variedad", "variedad de opciones", "numerosas posibilidades"
- "ambiente bohemio", "ambiente tranquilo", "encanto especial"
- "ideal para", "perfecto para" (sustituir con razón concreta)

CÓMO SUSTITUIR esos tópicos:
- En lugar de "refugio de paisajes verdes" → nombra una comarca/sierra/río/barrio concreto.
- En lugar de "variedad de centros" → di cuántos hay (si lo sabes del dossier) o qué tipos se repiten.
- En lugar de "sumérgete/descubre" → usa verbos concretos: "empieza por", "prueba", "elige", "reserva", "pregunta por".
- En lugar de frases de relleno → aporta UN dato concreto (rango horario típico, barrio donde se concentran, tipo de espacio físico).

Calidad mínima exigida:
- Cada sección DEBE contener al menos DOS nombres propios del dossier (barrio, comarca, ciudad, estación de tren, parque, sierra, playa) cuando la capa sea geográfica.
- NO abras dos secciones consecutivas con la misma palabra.
- Cifras: si el dossier trae precios/ratings/local_pack, cítalos con naturalidad.

AUTO-CHECK antes de devolver:
1. Busca en tu borrador cualquier palabra de la LISTA NEGRA. Si aparece, reescribe esa frase.
2. Si encuentras "<p>Breve intro.</p>" o cualquier placeholder literal del prompt en tu salida, reescríbelo con contenido real.
3. Si una sección tiene menos de dos nombres propios concretos (barrios, sierras, estaciones…), añádelos.`;

const LAYER_PROMPTS = {
  type_national: (ctx) => `Estás escribiendo la landing nacional de ${ctx.type} en España (Retiru).
Intent primario: definir la disciplina y dar visión nacional. NO hables de provincias ni ciudades concretas más allá de mencionar que hay cobertura en España.

${BASE_RULES}

Secciones que DEBES generar (clave → H2):
- what_to_expect → "¿Qué es ${ctx.type} y qué esperar de un centro de ${ctx.type}?"
- history       → "Origen y tradición de ${ctx.type}"

Campos adicionales:
- intro_es / intro_en: 220-300 palabras en HTML (<p>, <strong>) — panorama NACIONAL.
- meta_title_es / meta_title_en
- meta_description_es / meta_description_en
- faq_es / faq_en: ${ctx.layer.faqCount[0]}-${ctx.layer.faqCount[1]} Q&A genéricos sobre la disciplina (no locales).

JSON output:
{
  "intro_es": "...", "intro_en": "...",
  "meta_title_es": "...", "meta_title_en": "...",
  "meta_description_es": "...", "meta_description_en": "...",
  "sections_es": [ {"key":"what_to_expect","heading":"...","html":"<p>...</p>"}, {"key":"history","heading":"...","html":"..."} ],
  "sections_en": [ {"key":"what_to_expect","heading":"...","html":"..."}, {"key":"history","heading":"...","html":"..."} ],
  "faq_es": [{"question":"...","answer":"..."}, ...],
  "faq_en": [{"question":"...","answer":"..."}, ...]
}`,

  type_style: (ctx) => `Estás escribiendo la landing nacional de ${ctx.type} ${ctx.styleName} en España (Retiru).
Intent primario: explicar QUÉ es ${ctx.styleName} y en qué se diferencia de otros estilos de ${ctx.type}.
${DOMINANT_STYLES.has(ctx.styleSlug) ? `Este es un ESTILO DOMINANTE (R3): el texto debe ser ESENCIALMENTE EDUCATIVO (qué es, orígenes, beneficios, diferencias), NO promocional de centros. El CTA a centros es secundario.` : ''}

${BASE_RULES}

Secciones que DEBES generar:
- what_to_expect → "¿Qué caracteriza a ${ctx.styleName}?"
- history       → "Raíces y linaje de ${ctx.styleName}"
- how_to_choose → "Cómo saber si ${ctx.styleName} encaja contigo"

Campos adicionales: intro_es/en (220-280 palabras), meta_title_es/en, meta_description_es/en, faq_es/en (${ctx.layer.faqCount[0]}-${ctx.layer.faqCount[1]} preguntas).

JSON output: misma estructura que capa 1 con las 3 secciones mencionadas.`,

  type_province: (ctx) => {
    const tEs = typeEs(ctx.type); const tEn = typeEn(ctx.type);
    return `Estás escribiendo la landing de DIRECTORIO de centros de ${tEs} en ${ctx.provinceName} (Retiru).
Intent primario: el usuario busca un DIRECTORIO concreto de la provincia y quiere elegir. NO repetir el "qué es ${tEs}" en términos universales (eso vive en la capa nacional).

${BASE_RULES}

CONTRATO DE SALIDA (JSON con TODAS estas claves, sin excepciones):
{
  "intro_es":           <HTML 220-280 palabras, 2-3 <p>. Primer párrafo localiza geográficamente (menciona al menos 2 comarcas/barrios/sierras del dossier). Segundo párrafo dice cuántos centros hay, qué tipo predominan y qué formatos. Nada de "refugio/oasis/paisajes verdes">,
  "intro_en":           <HTML 220-280 words, same facts>,
  "meta_title_es":      <≤60 chars, patrón "Centros de ${tEs} en ${ctx.provinceName}" + gancho sin años>,
  "meta_title_en":      <≤60 chars, "${tEn} centers in ${ctx.provinceName}" + hook>,
  "meta_description_es":<150-160 chars sin años>,
  "meta_description_en":<150-160 chars sin años>,
  "sections_es": [
    { "key":"why_here",
      "heading":"Por qué practicar ${tEs} en ${ctx.provinceName}",
      "html":"<p>…</p><p>…</p> — 170-220 palabras. Enfócate en las SEÑAS PROPIAS del territorio (geografía, clima, densidad urbana vs rural, barrios donde se concentran los centros, escena cultural). Al menos 3 nombres propios del dossier. PROHIBIDO frases cliché." },
    { "key":"what_to_expect",
      "heading":"Qué esperar de un centro de ${tEs} en ${ctx.provinceName}",
      "html":"<p>…</p><p>…</p> — 150-200 palabras. Habla del FORMATO LOCAL: duración típica de una clase o retiro, tipo de espacios (bajo de calle, casa rural, finca en sierra, centro de barrio), perfil de alumnado frecuente, idioma predominante (ES/EN si aplica), rango de precios si el dossier lo trae. NO expliques qué es ${tEs} a nivel universal — esto se asume conocido." },
    { "key":"how_to_choose",
      "heading":"Cómo elegir un centro de ${tEs} en ${ctx.provinceName}",
      "html":"Abre con 1 párrafo corto REAL (NO uses 'Breve intro.' literal, escribe tú el párrafo) que enmarque la decisión. Luego una <ul> con 5-6 <li>. Cada <li> empieza con <strong>concepto (2-3 palabras)</strong> seguido de em dash y la explicación concreta. Cubre: nivel requerido, horarios compatibles, estilo preferido, formación del profesorado, acceso en transporte público, retiro vs clase suelta, política de primera clase. Total 160-220 palabras." },
    { "key":"local_scene",
      "heading":"Comunidad y escena local de ${tEs} en ${ctx.provinceName}",
      "html":"<p>…</p><p>…</p> — 140-200 palabras. Habla de la ESCENA LOCAL: eventos/encuentros recurrentes si el dossier los menciona, escuelas o centros de referencia por volumen/reputación del local_pack, posibilidades de retiros en la misma provincia o limítrofes, rutas o enclaves naturales aptos (montaña/mar). Si el dossier no trae datos suficientes, sé breve y honesto: describe tipologías sin inventar nombres." }
  ],
  "sections_en": [ exactamente los 4 items anteriores, en inglés, mismos keys, mismos datos reales. Los headings en inglés usan "${tEn}" ],
  "faq_es": [ 6-8 Q&A locales — usa PREGUNTAS REALES del bloque People Also Ask del dossier si existen + añade hasta llegar a 7: precios, aparcamiento, retiros cercanos, niveles para principiantes, idiomas, accesibilidad en transporte público ],
  "faq_en": [ same 6-8 FAQ in English, mismas preguntas traducidas ]
}

REGLAS CRÍTICAS:
- sections_es y sections_en SON OBLIGATORIAS: EXACTAMENTE 4 items cada una, con las keys y headings especificados en este orden: why_here → what_to_expect → how_to_choose → local_scene.
- Si omites alguno, el sistema descartará tu respuesta.
- Usa el bloque SerpApi del dossier: los nombres del local_pack para validar la escena; los PAA como inspiración DIRECTA para las FAQ; las related searches para afinar vocabulario.
- Cada sección debe empezar con una frase distinta (no arrancar dos secciones con "En ${ctx.provinceName}…" o "${ctx.provinceName} es…").
- En español dices SIEMPRE "${tEs}" (nunca "${ctx.type}" en crudo). En inglés dices "${tEn}".`;
  },

  style_province: (ctx) => `Estás escribiendo la landing de ${ctx.type} ${ctx.styleName} EN ${ctx.provinceName} (Retiru).
Intent primario: el usuario busca concretamente este estilo en esta provincia. Foco: qué hace diferente al estilo ${ctx.styleName} en esta zona concreta.

${BASE_RULES}

Secciones que DEBES generar (exactamente estas dos):
- why_here_for_style         → "Por qué ${ctx.styleName} en ${ctx.provinceName}" — comunidad local, profesores conocidos, eventos locales, encaje del estilo con el ritmo de la zona.
- how_to_choose_style_local → "Cómo reconocer una clase de ${ctx.styleName} bien hecha en ${ctx.provinceName}" — linaje, nivel requerido, señales de calidad.

NO repitas la definición general del estilo (eso está en capa 2). NO hables del panorama provincial general (eso está en capa 3).

Campos: intro_es/en (180-260 palabras), meta_title_es/en, meta_description_es/en, faq_es/en (${ctx.layer.faqCount[0]}-${ctx.layer.faqCount[1]}).`,

  type_province_city: (ctx) => `Estás escribiendo la landing de centros de ${ctx.type} en ${ctx.cityName} (${ctx.provinceName}) (Retiru).
Intent primario: acceso, transporte, carácter urbano/rural del punto geográfico. El usuario ya sabe qué es ${ctx.type} y que quiere centros en su ciudad.

${BASE_RULES}

Secciones que DEBES generar (exactamente UNA):
- access_transport_character → "${ctx.cityName} para practicar ${ctx.type}: acceso, transporte y carácter" — metro/bus más cercano si aplica, carácter de barrio, zonas verdes si es un distrito de una gran ciudad, por qué la gente elige esta ciudad/barrio concretamente.

NO duplicar "why_here" (vive en la provincia) ni "how_to_choose" (vive en la provincia). NO hablar de toda la provincia.

Campos: intro_es/en (160-220 palabras, muy enfocado al punto geográfico), meta_title_es/en ("Centros de ${ctx.type} en ${ctx.cityName}" cuando quepa), meta_description_es/en, faq_es/en (${ctx.layer.faqCount[0]}-${ctx.layer.faqCount[1]}: metro cercano, parking, horarios típicos, idiomas).`,
};

// ───────────────────────────────────────────────────────────────────────────
// OpenAI JSON helper
// ───────────────────────────────────────────────────────────────────────────
async function openAIJSON({ system, user, maxTokens = 3500, temperature = 0.55, model = 'gpt-4o' }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY no definida');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error?.message || `OpenAI ${res.status}`);
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error('OpenAI respuesta vacía');
  try {
    return { parsed: JSON.parse(raw), usage: data.usage };
  } catch {
    throw new Error(`JSON inválido: ${raw.slice(0, 200)}`);
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Validación / normalización
// ───────────────────────────────────────────────────────────────────────────
function normalizeSections(arr /*, allowedKeys (solo referencia para el prompt) */) {
  if (!Array.isArray(arr)) return [];
  // NO filtramos por allowedKeys — el prompt ya se lo dice al modelo. Si el
  // modelo inventa una key nueva, la aceptamos (prioridad: tener contenido).
  // El renderer sabe pintarlo por `heading` + `html`.
  return arr
    .filter((s) => s && typeof s.key === 'string' && typeof s.html === 'string' && typeof s.heading === 'string')
    .map((s) => ({ key: s.key.trim(), heading: s.heading.trim(), html: s.html.trim() }));
}

function normalizeFaq(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((q) => q && typeof q.question === 'string' && typeof q.answer === 'string')
    .map((q) => ({ question: q.question.trim(), answer: q.answer.trim() }));
}

// ───────────────────────────────────────────────────────────────────────────
// Generador principal
// ───────────────────────────────────────────────────────────────────────────
/**
 * Genera el contenido SEO completo para una landing de capa concreta.
 * @param {object} opts
 * @param {object} opts.context  - ver buildDossier()
 * @param {boolean} [opts.useSerp=true]
 * @returns {Promise<{intro_es, intro_en, meta_title_es, meta_title_en, meta_description_es, meta_description_en, sections_es, sections_en, faq_es, faq_en, serp_data, suppress_reason}>}
 */
export async function generateLayerContent({ context, useSerp = true, model = 'gpt-4o', temperature = 0.55 }) {
  const suppress = applySuppressionRules(context);
  if (suppress) {
    return {
      suppress_reason: suppress,
      serp_data: null,
      sections_es: [], sections_en: [],
      intro_es: null, intro_en: null,
      meta_title_es: null, meta_title_en: null,
      meta_description_es: null, meta_description_en: null,
      faq_es: [], faq_en: [],
    };
  }

  // SerpApi opcional (solo si hay componente geográfico — capas 3, 4, 5)
  let serp = null;
  if (useSerp && (context.layer.id === 3 || context.layer.id === 4 || context.layer.id === 5)) {
    try {
      serp = await serpLocalCenters({
        type: context.type,
        province: context.provinceName,
        city: context.cityName || null,
        style: context.styleName || null,
        locale: 'es',
      });
    } catch (e) {
      console.warn(`[serp] fallo en ${context.provinceSlug}${context.citySlug ? '/' + context.citySlug : ''}: ${e.message}`);
    }
  }

  const ctxForDossier = { ...context, serp, allowedSections: context.layer.allowedSections };
  const dossier = buildDossier(ctxForDossier);

  const layerKey = Object.keys(LAYERS).find((k) => LAYERS[k] === context.layer);
  const promptFactory = LAYER_PROMPTS[layerKey];
  if (!promptFactory) throw new Error(`No hay prompt para capa ${layerKey}`);
  const userPrompt = `${promptFactory(context)}\n\n=== DOSSIER ===\n${dossier}\n\nDevuelve SOLO el JSON. Sin markdown.`;

  const system = 'Eres un redactor SEO senior del directorio Retiru (bienestar, yoga, meditación, ayurveda). Escribes en español e inglés peninsulares, con conocimiento real de las provincias y barrios de España, sin florituras. Tu salida SIEMPRE es un único JSON válido.';

  const { parsed, usage } = await openAIJSON({
    system,
    user: userPrompt,
    model,
    temperature,
    // Cap.3 ahora tiene 4 secciones + 8 FAQs → necesita más tokens.
    maxTokens: context.layer.id === 3 ? 5200 : (context.layer.id === 5 ? 2600 : 3800),
  });

  const allowedKeys = context.layer.allowedSections;
  return {
    intro_es: typeof parsed.intro_es === 'string' ? parsed.intro_es.trim() : null,
    intro_en: typeof parsed.intro_en === 'string' ? parsed.intro_en.trim() : null,
    meta_title_es: typeof parsed.meta_title_es === 'string' ? parsed.meta_title_es.trim().slice(0, 70) : null,
    meta_title_en: typeof parsed.meta_title_en === 'string' ? parsed.meta_title_en.trim().slice(0, 70) : null,
    meta_description_es: typeof parsed.meta_description_es === 'string' ? parsed.meta_description_es.trim().slice(0, 200) : null,
    meta_description_en: typeof parsed.meta_description_en === 'string' ? parsed.meta_description_en.trim().slice(0, 200) : null,
    sections_es: normalizeSections(parsed.sections_es, allowedKeys),
    sections_en: normalizeSections(parsed.sections_en, allowedKeys),
    faq_es: normalizeFaq(parsed.faq_es),
    faq_en: normalizeFaq(parsed.faq_en),
    serp_data: serp ? {
      paa: serp.paa, related: serp.related, local_pack: serp.local_pack,
      featured_snippet: serp.featured_snippet, query: serp.query,
      fetched_at: serp.fetched_at, params: serp.params,
    } : null,
    suppress_reason: null,
    _usage: usage,
  };
}
