// ============================================================================
// RETIRU · API Admin — Generar descripciones de centros con IA (SerpAPI + OpenAI)
// POST /api/admin/generate-center-descriptions
// ============================================================================

import { NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/server';

const MIN_DESC_LENGTH = 80; // Consideramos "sin descripción" si tiene menos de 80 caracteres

export async function POST() {
  const openaiKey = process.env.OPENAI_API_KEY;
  const serpKey = process.env.SERPAPI_API_KEY;

  if (!openaiKey || !serpKey) {
    return NextResponse.json(
      { error: 'Faltan OPENAI_API_KEY o SERPAPI_API_KEY en .env.local' },
      { status: 500 }
    );
  }

  const supabase = createAdminSupabase();

  // Centros sin descripción útil (vacía o muy corta)
  const { data: centers, error } = await supabase
    .from('centers')
    .select('id, name, slug, city, province, type, services_es, description_es');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type CenterRow = { id: string; name: string; slug: string; city: string; province: string; type?: string; services_es?: string[]; description_es?: string | null };
  const toProcess = ((centers || []) as CenterRow[]).filter((c) => {
    const desc = c.description_es?.trim() || '';
    return desc.length < MIN_DESC_LENGTH;
  });

  if (toProcess.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'Todos los centros ya tienen descripción.',
      processed: 0,
      results: [],
    });
  }

  const results: { id: string; name: string; status: 'ok' | 'error'; description?: string; error?: string }[] = [];

  for (const center of toProcess) {
    try {
      // 1. SerpAPI — búsqueda para obtener contexto
      const query = `${center.name} ${center.city} ${center.province} España`;
      const serpRes = await fetch(
        `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${serpKey}&hl=es`
      );
      const serpData = serpRes.ok ? await serpRes.json() : null;

      const snippets: string[] = [];
      if (serpData?.organic_results) {
        for (const r of serpData.organic_results.slice(0, 5)) {
          if (r.snippet) snippets.push(r.snippet);
        }
      }

      const context = snippets.length > 0
        ? snippets.join('\n\n')
        : `Centro: ${center.name}, ciudad: ${center.city}, provincia: ${center.province}. Tipo: ${center.type || 'wellness'}.`;

      // 2. OpenAI — generar descripción
      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Eres un redactor profesional para Retiru, una plataforma de retiros y centros de bienestar en España.
Escribe descripciones atractivas, profesionales y en español (3-5 frases, ~150-250 palabras).
Tono: cercano, premium, sin exagerar. No inventes datos que no estén en el contexto.
Si el contexto no es suficiente, escribe una descripción genérica basada en el nombre, ciudad y tipo de centro.`,
            },
            {
              role: 'user',
              content: `Genera la descripción para este centro en Retiru:\n\n${context}`,
            },
          ],
          max_tokens: 400,
          temperature: 0.7,
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

      // 3. Actualizar centro en BD
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
