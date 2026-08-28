// ============================================================================
// RETIRU · API Admin — Generar descripciones de centros
// gpt-5.6-terra + web_search nativo (sin SerpAPI)
// POST /api/admin/generate-center-descriptions
// Body: { force?: boolean, limit?: number }
// ============================================================================

import { createAdminSupabase } from '@/lib/supabase/server';
import { translateCenterFieldsToEn } from '@/lib/openai/translate-center-en';
import {
  CENTER_DESC_MIN_LENGTH,
  generateCenterDescriptionEs,
} from '@/lib/openai/center-description';

export const maxDuration = 300;

type CenterRow = {
  id: string;
  name: string;
  city: string;
  province: string;
  address?: string | null;
  type?: string | null;
  website?: string | null;
  services_es?: string[] | null;
  description_es?: string | null;
  schedule_summary_es?: string | null;
  price_range_es?: string | null;
};

export async function POST(request: Request) {
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!openaiKey) {
    return new Response(JSON.stringify({ error: 'Falta OPENAI_API_KEY en el servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let force = false;
  let limit = 0;
  try {
    const text = await request.text();
    if (text) {
      const body = JSON.parse(text);
      force = !!body.force;
      limit = Math.min(Math.max(0, Number(body.limit) || 0), 100);
    }
  } catch {
    /* body vacío */
  }

  const supabase = createAdminSupabase();

  const { data: centers, error } = await supabase
    .from('centers')
    .select(
      'id, name, city, province, address, type, website, services_es, description_es, schedule_summary_es, price_range_es',
    )
    .eq('status', 'active');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let toProcess = ((centers || []) as CenterRow[]).filter((c) => {
    const desc = c.description_es?.trim() || '';
    return force ? true : desc.length < CENTER_DESC_MIN_LENGTH;
  });
  if (limit > 0) toProcess = toProcess.slice(0, limit);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      }

      if (toProcess.length === 0) {
        send('log', {
          type: 'info',
          message: force
            ? '📋 No hay centros para procesar.'
            : '✅ Todos los centros ya tienen descripción enriquecida.',
        });
        send('done', { processed: 0, ok: 0, errors: 0 });
        controller.close();
        return;
      }

      send('log', {
        type: 'info',
        message: `🚀 ${toProcess.length} centros · gpt-5.6-terra + web search`,
      });

      let okCount = 0;
      let errorCount = 0;

      for (let i = 0; i < toProcess.length; i++) {
        const center = toProcess[i];
        send('log', {
          type: 'start',
          message: `\n📌 [${i + 1}/${toProcess.length}] ${center.name} (${center.city})`,
        });

        try {
          send('log', { type: 'detail', message: '  🤖 Terra + búsqueda web…' });
          const { text: description, searches } = await generateCenterDescriptionEs(openaiKey, center);
          const wordCount = description.split(/\s+/).length;
          send('log', {
            type: 'detail',
            message: `  📝 ${wordCount} palabras · ${searches} búsquedas`,
          });

          const now = new Date().toISOString();
          const { error: updateError } = await supabase
            .from('centers')
            .update({
              description_es: description,
              description_ai_generated_at: now,
              updated_at: now,
            })
            .eq('id', center.id);
          if (updateError) throw updateError;

          try {
            send('log', { type: 'detail', message: '  🌐 Traduciendo a inglés…' });
            const enFields = await translateCenterFieldsToEn(
              {
                descriptionEs: description,
                servicesEs: Array.isArray(center.services_es) ? center.services_es : [],
                scheduleSummaryEs: center.schedule_summary_es ?? null,
                priceRangeEs: center.price_range_es ?? null,
              },
              openaiKey,
            );
            const { error: enErr } = await supabase
              .from('centers')
              .update({
                description_en: enFields.description_en,
                services_en: enFields.services_en,
                schedule_summary_en: enFields.schedule_summary_en,
                price_range_en: enFields.price_range_en,
                updated_at: new Date().toISOString(),
              })
              .eq('id', center.id);
            if (enErr) throw enErr;
          } catch (trErr) {
            const msg = trErr instanceof Error ? trErr.message : String(trErr);
            send('log', { type: 'error', message: `  ⚠️ EN fallida (ES guardado): ${msg}` });
          }

          send('log', { type: 'success', message: `  ✅ ${center.name}` });
          okCount++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          send('log', { type: 'error', message: `  ❌ ${center.name} — ${msg}` });
          errorCount++;
        }
      }

      send('log', {
        type: 'info',
        message: `\n🏁 ${okCount} OK, ${errorCount} errores de ${toProcess.length}`,
      });
      send('done', { processed: toProcess.length, ok: okCount, errors: errorCount });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
