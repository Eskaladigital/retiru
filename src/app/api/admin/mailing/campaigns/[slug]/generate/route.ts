// POST /api/admin/mailing/campaigns/[slug]/generate
//
//   body: { prompt: string, referenceCampaignIds?: string[] }
//
// Genera el HTML de la campaña con OpenAI (gpt-4o-mini) usando 1–2 campañas
// previas como ejemplo de estilo. Devuelve Server-Sent Events (text/event-stream)
// con logs en vivo y al final un evento 'done' con el html_content ya guardado
// en mailing_campaigns.html_content.
//
// Mismo patrón SSE que /api/admin/generate-center-descriptions.
import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/mailing/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

type RouteParams = { params: Promise<{ slug: string }> };

const SYSTEM_PROMPT = `Eres Nia, la IA editora de mailings de Retiru (plataforma de retiros y bienestar en España).
Tu tarea: generar el HTML completo de un email de marketing para los centros de la plataforma, basándote en los ejemplos de estilo que se te proporcionen y en el briefing que describe la campaña.

REQUISITOS OBLIGATORIOS DEL HTML:
1. Email HTML seguro: <!doctype html>, estructura con tablas (no usar flex/grid/css-grid), CSS en línea (inline styles).
2. Ancho máximo 600px. Responsive: móvil apilado.
3. Codificación UTF-8. Incluye <meta charset="utf-8">, <meta name="viewport">, <meta name="color-scheme" content="light dark">.
4. Paleta coherente con los ejemplos proporcionados (tonos tierra / crema / terracota / sage, tipografía tipo serif para titulares).
5. Preheader (hidden preview text) al principio del body.
6. Cabecera con el logo: <img src="https://www.retiru.com/Logo_retiru.png" alt="Retiru" width="140" style="display:block;max-width:140px;height:auto;">.
7. Footer con el logo transparente: <img src="https://www.retiru.com/Logo_retiru_transparente.png" alt="Retiru" width="120" style="display:block;max-width:120px;height:auto;">.
8. Footer con enlace de baja usando EXACTAMENTE el placeholder {{UNSUBSCRIBE_URL}}: <a href="{{UNSUBSCRIBE_URL}}">Darme de baja</a>.
9. Iconos de redes como imágenes (no texto): Facebook → https://www.retiru.com/social/facebook.png, Instagram → https://www.retiru.com/social/instagram.png. Deben tener padding/espaciado visible entre sí.
10. Placeholders dinámicos — usa EXACTAMENTE estos literales cuando necesites datos del centro:
    · {{NOMBRE_CENTRO}} — nombre del centro destinatario
    · {{LOCATION}} — "Ciudad, Provincia"
    · {{FIN_MEMBRESIA}} — fecha en formato "DD de mes de AAAA"
    · {{UNSUBSCRIBE_URL}} — URL de baja
11. Todos los href de enlaces a www.retiru.com deben ser https absolutos.
12. NO incluyas explicaciones, comentarios de JSON ni markdown. Devuelve SOLO el HTML.
13. Longitud objetivo: 450–900 líneas de HTML, similar a los ejemplos.

Si los ejemplos incluyen componentes específicos (cajas destacadas, checklist, "regalo", CTA), puedes reusarlos adaptando el contenido al briefing del usuario.`;

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { slug } = await params;

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return new Response(
      JSON.stringify({ error: 'Falta OPENAI_API_KEY en el entorno' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { data: campaign } = await guard.ctx.sb
    .from('mailing_campaigns')
    .select('id, status, subject, description')
    .eq('slug', slug)
    .maybeSingle();
  if (!campaign) {
    return new Response(JSON.stringify({ error: 'Campaña no encontrada' }), {
      status: 404, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (campaign.status === 'archived' || campaign.status === 'sent') {
    return new Response(JSON.stringify({ error: `No se puede regenerar una campaña en "${campaign.status}"` }), {
      status: 409, headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await request.json().catch(() => ({}));
  const prompt: string = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  const referenceIds: string[] = Array.isArray(body.referenceCampaignIds)
    ? body.referenceCampaignIds.filter((x: unknown) => typeof x === 'string').slice(0, 3)
    : [];

  if (!prompt) {
    return new Response(JSON.stringify({ error: 'Falta el prompt (qué debe decir el mail).' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  // Cargar HTML de las referencias (para pasarlas como "ejemplos de estilo").
  let references: { id: string; slug: string; subject: string; html_content: string }[] = [];
  if (referenceIds.length > 0) {
    const { data: refs } = await guard.ctx.sb
      .from('mailing_campaigns')
      .select('id, slug, subject, html_content')
      .in('id', referenceIds);
    references = (refs || []).filter((r: { html_content: string | null }) => !!r.html_content) as typeof references;
  }

  const encoder = new TextEncoder();
  const sbAdmin = guard.ctx.sb;
  const campaignId = campaign.id;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => controller.enqueue(encoder.encode(sse(event, data)));

      try {
        send('log', { type: 'info', message: 'Iniciando generación con Nia…' });
        send('log', { type: 'detail', message: `Briefing: ${prompt.slice(0, 200)}${prompt.length > 200 ? '…' : ''}` });
        if (references.length > 0) {
          send('log', { type: 'detail', message: `Referencias de estilo: ${references.map((r) => r.slug).join(', ')}` });
        } else {
          send('log', { type: 'detail', message: 'Sin referencias de estilo previas (Nia usará su criterio).' });
        }

        // Construimos el prompt del usuario combinando briefing + referencias.
        // Las referencias se pasan como bloques <reference_N> con el HTML dentro.
        const userParts: string[] = [];
        userParts.push(`## Briefing de la campaña\nAsunto fijado: ${campaign.subject}\n${campaign.description ? `Descripción interna: ${campaign.description}\n` : ''}\nQué debe transmitir el mail:\n${prompt}`);

        if (references.length > 0) {
          userParts.push(`\n## Ejemplos de estilo (${references.length})\nUsa la estética, la retícula y los componentes de estos ejemplos como base. Adapta el contenido al briefing.`);
          for (let i = 0; i < references.length; i++) {
            const r = references[i];
            // Recorte defensivo para mantenernos dentro del contexto del modelo.
            const clipped = r.html_content.slice(0, 40000);
            userParts.push(`\n<reference_${i + 1} slug="${r.slug}" subject="${r.subject.replace(/"/g, '&quot;')}">\n${clipped}\n</reference_${i + 1}>`);
          }
        }

        userParts.push('\n## Entrega\nDevuelve SOLO el HTML del email, sin comentarios, sin markdown, sin backticks.');

        send('log', { type: 'detail', message: 'Enviando a gpt-4o-mini…' });

        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            temperature: 0.55,
            max_tokens: 12000,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userParts.join('\n') },
            ],
          }),
        });

        if (!openaiRes.ok) {
          const errData = await openaiRes.json().catch(() => ({}));
          const msg = (errData as { error?: { message?: string } }).error?.message || openaiRes.statusText;
          send('log', { type: 'error', message: `OpenAI devolvió ${openaiRes.status}: ${msg}` });
          send('done', { ok: false, error: msg });
          controller.close();
          return;
        }

        const openaiData = await openaiRes.json();
        let html: string = openaiData.choices?.[0]?.message?.content?.trim() || '';

        if (!html) {
          send('log', { type: 'error', message: 'OpenAI no devolvió contenido.' });
          send('done', { ok: false, error: 'OpenAI no devolvió contenido' });
          controller.close();
          return;
        }

        // Por si el modelo se escapa con backticks a pesar del SYSTEM_PROMPT.
        html = html.replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/i, '').trim();

        // Validaciones mínimas: queremos los placeholders clave.
        const missing: string[] = [];
        if (!html.includes('{{UNSUBSCRIBE_URL}}')) missing.push('{{UNSUBSCRIBE_URL}}');
        if (!html.toLowerCase().includes('<html')) missing.push('<html>');
        if (missing.length > 0) {
          send('log', { type: 'warn', message: `Aviso: faltan ${missing.join(', ')} en el HTML generado. Se guarda igualmente, revisa la vista previa.` });
        }

        // Guardar html + metadatos de generación.
        const { error: updErr } = await sbAdmin
          .from('mailing_campaigns')
          .update({
            html_content: html,
            generation_prompt: prompt,
            generation_reference_ids: referenceIds,
          })
          .eq('id', campaignId);
        if (updErr) {
          send('log', { type: 'error', message: `Error guardando HTML: ${updErr.message}` });
          send('done', { ok: false, error: updErr.message });
          controller.close();
          return;
        }

        const size = html.length;
        send('log', { type: 'success', message: `HTML generado y guardado (${size.toLocaleString('es-ES')} bytes).` });
        send('done', { ok: true, bytes: size });
        controller.close();
      } catch (e) {
        const msg = (e as Error).message || String(e);
        send('log', { type: 'error', message: `Excepción: ${msg}` });
        send('done', { ok: false, error: msg });
        controller.close();
      }
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
