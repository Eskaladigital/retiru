/**
 * Descripción de ficha de centro: gpt-5.6-terra + web_search nativo (Responses API).
 * Sin SerpAPI.
 */

export const CENTER_DESC_MIN_LENGTH = 400;

export type CenterDescInput = {
  name: string;
  city: string;
  province: string;
  address?: string | null;
  type?: string | null;
  website?: string | null;
  services_es?: string[] | null;
};

const INSTRUCTIONS = `Eres un redactor profesional para Retiru, plataforma de retiros y centros de bienestar en España.
Tu tarea: escribir una descripción COMPLETA del centro, 800 a 1200 palabras, en español.

Usa la herramienta de búsqueda web para encontrar la web oficial, fichas públicas y reseñas de ESTE establecimiento (misma ciudad y dirección). No mezcles otra sede de la misma marca.

Estructura:
1. Introducción: centro, ubicación, especialidad.
2. Servicios y oferta.
3. Reseñas y reputación solo si las encontraste de verdad (puntuación, número, citas parafraseadas).
4. Ambiente e instalaciones solo con datos encontrados.
5. Cierre cercano, sin inventar teléfono ni horarios.

Reglas:
- No inventes nombres de profesores, precios, certificaciones ni cifras.
- Si hay poca información, escribe con lo que hay (nombre, ciudad, tipo) y no rellenes con clichés largos inventados.
- Prosa para ficha web: sin URLs, sin marcadores de cita, sin markdown de enlaces.
- Tono profesional, cercano, premium.`;

function extractOutputText(data: {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string; output_text?: string }>;
  }>;
}): string {
  if (typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }
  const chunks: string[] = [];
  for (const item of data.output || []) {
    for (const c of item.content || []) {
      if (typeof c.text === 'string') chunks.push(c.text);
      if (typeof c.output_text === 'string') chunks.push(c.output_text);
    }
  }
  return chunks.join('\n\n').trim();
}

export async function generateCenterDescriptionEs(
  apiKey: string,
  center: CenterDescInput,
): Promise<{ text: string; searches: number }> {
  const ficha = [
    `Nombre: ${center.name}`,
    `Ciudad: ${center.city}`,
    `Provincia: ${center.province}`,
    center.address ? `Dirección: ${center.address}` : null,
    center.type ? `Tipo en Retiru: ${center.type}` : null,
    center.website ? `Web en ficha: ${center.website}` : null,
    center.services_es?.length ? `Servicios en ficha: ${center.services_es.join(', ')}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-5.6-terra',
      tools: [
        {
          type: 'web_search',
          user_location: { type: 'approximate', country: 'ES' },
        },
      ],
      reasoning: { effort: 'low' },
      max_output_tokens: 8000,
      instructions: INSTRUCTIONS,
      input: `Escribe la descripción enriquecida (800-1200 palabras) de este centro. Busca en la web solo este local.\n\n${ficha}`,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    error?: { message?: string };
    output_text?: string;
    output?: Array<{
      type?: string;
      content?: Array<{ type?: string; text?: string }>;
    }>;
  };

  if (!res.ok) {
    throw new Error(data.error?.message || `OpenAI Responses ${res.status}`);
  }

  const text = extractOutputText(data);
  if (!text) throw new Error('OpenAI no devolvió texto');

  const searches = (data.output || []).filter((o) => o.type === 'web_search_call').length;
  return { text, searches };
}
