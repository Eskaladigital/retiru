/**
 * RETIRU · Generación de artículos de blog (prompt + SerpAPI + OpenAI gpt-5.6-terra)
 * Ver docs/BLOG-PROMPT-REDACTOR.md
 */

export const BLOG_WRITER_SYSTEM_PROMPT = `Eres redactor senior de Retiru (retiru.com), marketplace de retiros y bienestar en España.

Tu trabajo es escribir artículos de blog INFORMATIVOS y COMPLETOS — del nivel de una guía de referencia en Google, no de un post superficial de IA.

LÍNEA EDITORIAL (obligatoria — docs/BLOG-EDITORIAL.md):
- NO vendas retiros ni destinos. Prohibido: «retiros en [ciudad]», maletas, cancelación, «cómo elegir retiro», tops geográficos.
- SÍ: recetas con gramajes, nutrición con datos útiles, un estilo de yoga/meditación por artículo, aceites/tratamientos ayurvédicos, pranayama, rutinas.
- Tono: cercano pero profesional, sobrio, creíble. Sin misticismo vacío ni estética hippie.
- NO promover: cacao ceremonial, ayahuasca, psilocibina, rituales con sustancias, chamanismo comercial.
- Menciona Retiru como mucho UNA vez al final, en una frase natural. El artículo debe valer solo.

CALIDAD (igualar corpus antiguo de Retiru, ~1.500 palabras):
- Profundidad real: explica QUÉ es el tema, PARA QUIÉN conviene, CUÁNDO evitarlo, errores frecuentes, variaciones y consejos prácticos.
- Usa la investigación web proporcionada para enriquecer con datos concretos (cantidades, minutos, °C, dosis orientativas). No inventes estudios ni cifras sin base en el contexto.
- Evita plantillas repetitivas. Adapta la estructura al tipo de artículo (receta / nutrición / práctica / ayurveda).
- Párrafos desarrollados (4–6 frases), no solo listas sueltas.
- Incluye al menos: 1 sección de precauciones o «para quién no conviene», 1 sección de variaciones o FAQ breve (3–4 preguntas).

FORMATO markdown:
- Secciones: ### Título (línea en blanco antes y después)
- Subsecciones: #### Subtítulo
- Listas: - viñeta o 1. numerada (cada ítem en su línea)
- Negrita **texto**, cursiva *texto*
- Separador opcional entre bloques largos: ---
- NO tablas, NO HTML, NO imágenes embebidas

IDIOMAS: español e inglés completos (EN adaptado, no traducción telegráfica).

Responde SOLO con JSON válido, sin markdown envolvente ni texto extra.`;

const TYPE_LABELS = {
  R: 'R = receta',
  N: 'N = nutrición',
  Y: 'Y = yoga',
  M: 'M = meditación',
  A: 'A = ayurveda (aceite/tratamiento)',
};

const STRUCTURE_BY_TYPE = {
  R: `[R — Receta]
1. Introducción (3 párrafos: qué es, por qué interesa, cuándo tomarlo)
2. Ingredientes con gramajes exactos (lista completa)
3. Preparación paso a paso numerada (tiempos, temperaturas, texturas)
4. Variaciones (2–3: dosha, sin gluten, más proteína, etc.)
5. Conservación en nevera/congelador
6. Beneficios razonables (sin prometer curas)
7. Precauciones / para quién no conviene
8. FAQ (3–4 preguntas)
9. Cierre breve (opcional mención Retiru)`,
  N: `[N — Nutrición]
1. Introducción contextual
2. Qué es / definición clara
3. Beneficios con matices
4. Fuentes alimentarias o mecanismos (listas con datos)
5. Señales de carencia o exceso
6. Cómo incorporarlo en el día a día
7. Precauciones, interacciones, embarazo si aplica
8. FAQ
9. Cierre`,
  Y: `[Y — Yoga]
1. Introducción
2. Qué es este estilo y en qué se diferencia
3. Beneficios y límites realistas
4. Cómo practicar: secuencia detallada (duraciones en minutos)
5. Errores frecuentes de principiantes
6. Para quién conviene / contraindicaciones
7. Rutina semanal sugerida
8. FAQ
9. Cierre`,
  M: `[M — Meditación]
1. Introducción
2. Qué es esta práctica y en qué se diferencia
3. Beneficios y límites realistas
4. Protocolo paso a paso (duraciones en minutos)
5. Errores frecuentes
6. Para quién conviene / contraindicaciones
7. Rutina semanal sugerida
8. FAQ
9. Cierre`,
  A: `[A — Ayurveda]
1. Introducción
2. Qué es (tradición ayurvédica, con prudencia)
3. Para qué se usa / beneficios atribuidos
4. Cómo se aplica (aceite, masaje, duración, temperatura)
5. Elección según dosha o temporada si aplica
6. Precauciones y cuándo consultar profesional
7. En casa vs en centro
8. FAQ
9. Cierre`,
};

export function countWords(text) {
  return (text || '').replace(/[#*_`[\]()>-]/g, ' ').split(/\s+/).filter(Boolean).length;
}

export function serpQueriesForTopic(topic, letter) {
  const base = [
    `${topic} guía completa`,
    `${topic} beneficios precauciones`,
  ];
  if (letter === 'R') base.push(`${topic} receta paso a paso ingredientes`, `${topic} variaciones`);
  else if (letter === 'N') base.push(`${topic} alimentos fuentes`, `${topic} carencia síntomas`);
  else if (letter === 'Y' || letter === 'M') base.push(`${topic} cómo practicar principiantes`, `${topic} errores frecuentes`);
  else if (letter === 'A') base.push(`${topic} ayurveda uso`, `${topic} contraindicaciones`);
  else base.push(`${topic}`, `${topic} errores comunes`);
  return base.slice(0, 4);
}

export async function searchSerp(query, serpKey) {
  if (!serpKey) return '';
  try {
    const res = await fetch(
      `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${serpKey}&hl=es&gl=es&num=5`,
    );
    const data = res.ok ? await res.json() : null;
    const parts = [];
    if (data?.answer_box?.snippet) parts.push(`[Respuesta]: ${data.answer_box.snippet}`);
    if (data?.organic_results?.length) {
      parts.push(
        ...data.organic_results.slice(0, 5).map((r, i) => `${i + 1}. ${r.title}: ${r.snippet || ''}`.trim()),
      );
    }
    return parts.join('\n');
  } catch (e) {
    console.warn(`  ⚠ SerpAPI (${query.slice(0, 40)}…):`, e.message);
    return '';
  }
}

/** Varias búsquedas SerpAPI → bloque de investigación */
export async function buildSerpResearch(topic, letter, serpKey) {
  if (!serpKey) {
    console.warn('  ⚠ Sin SERPAPI_API_KEY — artículo sin investigación web');
    return '';
  }
  const queries = serpQueriesForTopic(topic, letter);
  const blocks = [];
  for (const q of queries) {
    const snippet = await searchSerp(q, serpKey);
    if (snippet) blocks.push(`### Búsqueda: ${q}\n${snippet}`);
    await new Promise((r) => setTimeout(r, 400));
  }
  return blocks.join('\n\n');
}

export function buildUserPrompt(topic, letter, serpContext) {
  const typeLine = TYPE_LABELS[letter] || 'General';
  const structure = STRUCTURE_BY_TYPE[letter] || STRUCTURE_BY_TYPE.N;

  return `Genera un artículo COMPLETO sobre: "${topic}"
Tipo editorial en cola: ${typeLine}

INVESTIGACIÓN WEB (síntesis — usa para enriquecer, no copies frases literales):
${serpContext || '(Sin contexto web — apóyate en conocimiento sólido y sé prudente con cifras médicas)'}

ESTRUCTURA OBLIGATORIA según tipo:

${structure}

LONGITUD MÍNIMA:
- content_es: 1.200–1.800 palabras (si queda corto, amplía variaciones, FAQ y contexto)
- content_en: 900–1.200 palabras
- read_time_min: calculado real (~200 palabras/min)

JSON exacto:
{
  "title_es": "...",
  "title_en": "...",
  "slug": "slug-url-unico-es",
  "excerpt_es": "2–3 frases con gancho y utilidad concreta",
  "excerpt_en": "...",
  "content_es": "markdown completo ES",
  "content_en": "markdown completo EN",
  "read_time_min": número,
  "meta_title_es": "50–60 caracteres",
  "meta_title_en": "50–60 caracteres",
  "meta_description_es": "150–160 caracteres",
  "meta_description_en": "150–160 caracteres"
}`;
}

function parseJsonContent(raw) {
  if (!raw) throw new Error('OpenAI no devolvió contenido');
  let jsonStr = raw.trim();
  const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) jsonStr = match[1].trim();
  return JSON.parse(jsonStr);
}

function extractResponsesText(data) {
  if (typeof data?.output_text === 'string') return data.output_text.trim();
  const chunks = [];
  for (const item of data?.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === 'string') chunks.push(content.text);
      if (typeof content.output_text === 'string') chunks.push(content.output_text);
    }
  }
  return chunks.join('').trim();
}

export async function generateBlogArticle(topic, letter, serpContext, openaiKey, options = {}) {
  const model = options.model || process.env.BLOG_OPENAI_MODEL || 'gpt-5.6-terra';
  const minWords = options.minWords ?? 1200;
  const maxAttempts = options.maxAttempts ?? 3;

  let article = null;
  let lastWords = 0;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const extra =
      attempt > 1
        ? `\n\nIMPORTANTE: Tu intento anterior tenía solo ${lastWords} palabras en content_es. AMPLÍA a mínimo ${minWords} palabras desarrollando variaciones, FAQ, precauciones y contexto. No acortes listas.`
        : '';

    const prompt = buildUserPrompt(topic, letter, serpContext) + extra;
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [
          { role: 'system', content: BLOG_WRITER_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        reasoning: { effort: 'medium' },
        max_output_tokens: 20000,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || res.statusText);
    }

    const data = await res.json();
    article = parseJsonContent(extractResponsesText(data));
    lastWords = countWords(article.content_es);
    console.log(`      📏 ${lastWords} palabras ES (intento ${attempt}/${maxAttempts}, modelo ${model})`);

    if (lastWords >= minWords) break;
  }

  if (lastWords < minWords) {
    console.warn(`      ⚠ Artículo corto (${lastWords} palabras); revisar manualmente o regenerar`);
  }

  if (!article.read_time_min || article.read_time_min < 6) {
    article.read_time_min = Math.max(6, Math.round(lastWords / 200));
  }

  return article;
}
