// ============================================================================
// RETIRU · API Admin — Generar descripciones ENRIQUECIDAS de centros (SerpAPI + Google Maps + OpenAI)
// POST /api/admin/generate-center-descriptions
// Body opcional: { force?: boolean, limit?: number } — force: regenerar aunque tengan descripción; limit: máx centros
// ============================================================================

import { NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/server';

const MIN_DESC_LENGTH = 400; // Centros "sin descripción útil" si tienen < ~400 chars (~80 palabras)
const TARGET_WORDS_MIN = 800;
const TARGET_WORDS_MAX = 1200;

type CenterRow = {
  id: string;
  name: string;
  slug: string;
  city: string;
  province: string;
  type?: string;
  services_es?: string[] | null;
  description_es?: string | null;
};

async function fetchContext(center: CenterRow, serpKey: string): Promise<string> {
  const query = `${center.name} ${center.city} ${center.province} España`;
  const parts: string[] = [];

  // 1. Google orgánico — más resultados para contexto amplio
  const googleRes = await fetch(
    `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${serpKey}&hl=es&num=10`
  );
  const googleData = googleRes.ok ? await googleRes.json() : null;
  if (googleData?.organic_results) {
    const snippets = googleData.organic_results
      .slice(0, 10)
      .map((r: { snippet?: string }) => r.snippet)
      .filter(Boolean);
    if (snippets.length) {
      parts.push('## Contexto web (Google):\n' + snippets.join('\n\n'));
    }
  }

  // 2. Google Maps — rating, reseñas, tipo de negocio
  const mapsQuery = encodeURIComponent(`${center.name} ${center.city}`);
  const mapsRes = await fetch(
    `https://serpapi.com/search.json?engine=google_maps&q=${mapsQuery}&api_key=${serpKey}&hl=es&type=search`
  );
  const mapsData = mapsRes.ok ? await mapsRes.json() : null;

  let mapsInfo = '';
  let dataId: string | null = null;

  if (mapsData?.local_results?.[0]) {
    const place = mapsData.local_results[0];
    mapsInfo = `Rating: ${place.rating ?? 'N/A'}, ${place.reviews ?? 0} reseñas. Tipo: ${place.type ?? place.types?.[0] ?? center.type ?? 'centro de bienestar'}.`;
    if (place.address) mapsInfo += ` Dirección: ${place.address}.`;
    dataId = place.data_id || null;
  }

  if (mapsInfo) {
    parts.push('## Google Maps:\n' + mapsInfo);
  }

  // 3. Reseñas de Google Maps (texto real de usuarios)
  if (dataId) {
    try {
      const reviewsRes = await fetch(
        `https://serpapi.com/search.json?engine=google_maps_reviews&data_id=${encodeURIComponent(dataId)}&api_key=${serpKey}&hl=es`
      );
      const reviewsData = reviewsRes.ok ? await reviewsRes.json() : null;
      if (reviewsData?.reviews?.length) {
        const reviewTexts = reviewsData.reviews
          .slice(0, 8)
          .map((r: { snippet?: string; extract?: string }) => r.snippet || r.extract || '')
          .filter(Boolean);
        if (reviewTexts.length) {
          parts.push('## Reseñas de usuarios (Google):\n' + reviewTexts.map((t: string) => `- "${t}"`).join('\n'));
        }
      }
    } catch {
      // Ignorar error de reseñas, no es crítico
    }
  }

  // 4. Servicios del centro (BD)
  const services = center.services_es && center.services_es.length > 0
    ? center.services_es.join(', ')
    : center.type || 'yoga, meditación, wellness';
  parts.push('## Servicios / oferta del centro (BD):\n' + services);

  return parts.join('\n\n') || `Centro: ${center.name}, ${center.city}, ${center.province}. Tipo: ${center.type || 'wellness'}.`;
}

export async function POST(request: Request) {
  const openaiKey = process.env.OPENAI_API_KEY;
  const serpKey = process.env.SERPAPI_API_KEY;

  if (!openaiKey || !serpKey) {
    return NextResponse.json(
      { error: 'Faltan OPENAI_API_KEY o SERPAPI_API_KEY en .env.local' },
      { status: 500 }
    );
  }

  let force = false;
  let limit = 0;
  try {
    const text = await request.text();
    if (text) {
      const body = JSON.parse(text);
      force = !!body.force;
      limit = Math.min(Math.max(0, Number(body.limit) || 0), 50);
    }
  } catch {
    // ignorar body vacío o inválido
  }

  const supabase = createAdminSupabase();

  const { data: centers, error } = await supabase
    .from('centers')
    .select('id, name, slug, city, province, type, services_es, description_es');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let toProcess = ((centers || []) as CenterRow[]).filter((c) => {
    const desc = c.description_es?.trim() || '';
    return force ? true : desc.length < MIN_DESC_LENGTH;
  });
  if (limit > 0) toProcess = toProcess.slice(0, limit);

  if (toProcess.length === 0) {
    return NextResponse.json({
      success: true,
      message: force ? 'No hay centros para procesar.' : 'Todos los centros ya tienen descripción enriquecida.',
      processed: 0,
      results: [],
    });
  }

  const results: { id: string; name: string; status: 'ok' | 'error'; description?: string; error?: string }[] = [];

  const systemPrompt = `Eres un redactor profesional para Retiru, plataforma de retiros y centros de bienestar en España.
Tu tarea: escribir una descripción COMPLETA y ENRIQUECIDA del centro de 800 a 1200 palabras, en español.

Estructura sugerida:
1. **Introducción** (párrafo): Presentar el centro, ubicación, filosofía o especialidad.
2. **Servicios y oferta**: Detallar clases, disciplinas, tratamientos, horarios si se mencionan. Destacar qué hace único al centro.
3. **Reseñas y reputación**: Si hay reseñas en el contexto, intégralas de forma natural (ej: "Los usuarios destacan...", "Según las valoraciones..."). Menciona puntuación y cantidad de reseñas si aparecen.
4. **Ambiente e instalaciones**: Si hay información, describe el espacio, el equipo, la atmósfera.
5. **Cierre**: Invitación a visitar o contacto, tono cercano.

Reglas:
- Tono: profesional, cercano, premium. Sin exagerar.
- NO inventes datos (direcciones exactas, precios, nombres de profesores) que no estén en el contexto.
- Usa el contexto proporcionado. Si hay poca información, elabora una descripción sólida basada en nombre, ciudad, tipo y servicios.
- Longitud: entre 800 y 1200 palabras. Párrafos bien estructurados.`;

  for (const center of toProcess) {
    try {
      const context = await fetchContext(center, serpKey);

      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `Genera la descripción enriquecida (800-1200 palabras) para este centro:\n\n${context}`,
            },
          ],
          max_tokens: 2400,
          temperature: 0.65,
        }),
      });

      if (!openaiRes.ok) {
        const errData = await openaiRes.json().catch(() => ({}));
        throw new Error(errData.error?.message || openaiRes.statusText);
      }

      const openaiData = await openaiRes.json();
      const description = openaiData.choices?.[0]?.message?.content?.trim();

      if (!description) {
        throw new Error('OpenAI no devolvió contenido');
      }

      const { error: updateError } = await supabase
        .from('centers')
        .update({ description_es: description, updated_at: new Date().toISOString() })
        .eq('id', center.id);

      if (updateError) throw updateError;

      results.push({ id: center.id, name: center.name, status: 'ok', description });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ id: center.id, name: center.name, status: 'error', error: msg });
    }
  }

  return NextResponse.json({
    success: true,
    processed: results.length,
    results,
  });
}
