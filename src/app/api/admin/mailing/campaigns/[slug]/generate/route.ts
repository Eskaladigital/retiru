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

const SYSTEM_PROMPT = `Eres la Inteligencia Artificial editora de mailings de Retiru (plataforma de retiros y bienestar en España).
Tu tarea: generar el HTML COMPLETO de un email de marketing para los centros de la plataforma, basándote en los ejemplos de estilo que se te proporcionen y en el briefing que describe la campaña.

REGLA DE ORO: NO resumas, NO entregues una versión "mini". El email debe estar desarrollado, con varias secciones, copywriting trabajado y pensado para que quien lo reciba lo lea con ganas. Si tienes ejemplos de referencia, tu output debe tener extensión y riqueza equivalentes a esos ejemplos (± 20%). Prefiere pasarte que quedarte corto.

ESTRUCTURA MÍNIMA OBLIGATORIA (en este orden):
1. Preheader oculto (hidden preview text, 80-120 caracteres).
2. Cabecera con el logo principal.
3. Hero: titular serif largo + subtítulo empático de 1-2 frases.
4. Saludo personalizado con {{NOMBRE_CENTRO}} y/o {{LOCATION}}.
5. Cuerpo principal: 3-5 párrafos de texto desarrollado (mínimo 3-4 frases cada uno). Empática, cercana, en segunda persona del singular.
6. Al menos UN bloque destacado (caja de color, tipo "Lo que Retiru hace por ti"): una sub-sección con 3-5 ítems en lista o checklist, cada ítem con icono/emoji y 1 frase de desarrollo.
7. CTA principal: botón grande con href absoluto a https://www.retiru.com/... (el link concreto según el briefing). Acompaña el CTA con 1-2 frases de contexto debajo.
8. Sección secundaria (p. ej. "Por qué Retiru", "Cómo funciona", "Testimonio", "Qué incluye tu membresía"): otro bloque con 2-3 puntos más.
9. Cierre cálido firmado por "El equipo de Retiru".
10. Footer: logo transparente, redes sociales como imágenes, enlace de baja con {{UNSUBSCRIBE_URL}}, dirección postal y copyright.

REQUISITOS TÉCNICOS OBLIGATORIOS DEL HTML:
1. Email HTML seguro: <!doctype html>, estructura con tablas (no usar flex/grid/css-grid), CSS en línea (inline styles).
2. Ancho máximo 600px. Responsive: móvil apilado.
3. Codificación UTF-8. Incluye <meta charset="utf-8">, <meta name="viewport">, <meta name="color-scheme" content="light dark">.
4. Paleta coherente con los ejemplos proporcionados (tonos tierra / crema / terracota / sage, tipografía tipo serif para titulares).
5. Cabecera con el logo: <img src="https://www.retiru.com/Logo_retiru.png" alt="Retiru" width="140" style="display:block;max-width:140px;height:auto;">.
6. Footer con el logo transparente: <img src="https://www.retiru.com/Logo_retiru_transparente.png" alt="Retiru" width="120" style="display:block;max-width:120px;height:auto;">.
7. Footer con enlace de baja usando EXACTAMENTE el placeholder {{UNSUBSCRIBE_URL}}: <a href="{{UNSUBSCRIBE_URL}}">Darme de baja</a>.
8. Iconos de redes como imágenes (NO texto, NO SVG inline): usa EXACTAMENTE estas URLs absolutas:
   · Instagram → https://www.retiru.com/email/instagram.png (width="28" height="28")
   · Facebook  → https://www.retiru.com/email/facebook.png  (width="28" height="28")
   Estilo de cada <img>: style="display:block;border:0;width:28px;height:28px;" y envueltos en celdas de tabla con padding para separarlos visualmente. NO inventes otras URLs de iconos.
9. Placeholders dinámicos — usa EXACTAMENTE estos literales cuando necesites datos del centro:
    · {{NOMBRE_CENTRO}} — nombre del centro destinatario
    · {{LOCATION}} — "Ciudad, Provincia"
    · {{FIN_MEMBRESIA}} — fecha en formato "DD de mes de AAAA" (solo usar si el briefing lo menciona)
    · {{UNSUBSCRIBE_URL}} — URL de baja
10. Todos los href de enlaces a www.retiru.com deben ser https absolutos.
11. NO incluyas explicaciones, comentarios de JSON ni markdown. Devuelve SOLO el HTML.
12. Longitud objetivo absoluta: mínimo 400 líneas de HTML si no hay referencias. Con referencias, iguala su extensión (ver instrucción específica en el briefing).

TONO: cercano, empático, profesional. Español de España. Evita anglicismos innecesarios. Habla "de tú a tú" con el centro: son profesionales del bienestar que valoran el trato humano. El copy debe sonar a persona escribiendo, no a plantilla.

Si los ejemplos incluyen componentes específicos (cajas destacadas, checklist, "regalo", CTA, cita, testimonio), REUSA esos componentes adaptando el contenido al briefing: no los omitas para "ahorrar".`;

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
        send('log', { type: 'info', message: 'Iniciando generación con la Inteligencia Artificial…' });
        send('log', { type: 'detail', message: `Briefing: ${prompt.slice(0, 200)}${prompt.length > 200 ? '…' : ''}` });
        if (references.length > 0) {
          send('log', { type: 'detail', message: `Referencias de estilo: ${references.map((r) => r.slug).join(', ')}` });
          const bytesTot = references.reduce((s, r) => s + r.html_content.length, 0);
          const avg = Math.round(bytesTot / references.length);
          send('log', { type: 'detail', message: `Objetivo de longitud: ~${avg.toLocaleString('es-ES')} bytes (media de las referencias). Exigimos como mínimo el 80%.` });
        } else {
          send('log', { type: 'detail', message: 'Sin referencias de estilo previas (la IA usará su criterio). Objetivo: mínimo 400 líneas.' });
        }

        // Construimos el prompt del usuario combinando briefing + referencias.
        // Las referencias se pasan como bloques <reference_N> con el HTML dentro.
        const userParts: string[] = [];
        userParts.push(`## Briefing de la campaña\nAsunto fijado: ${campaign.subject}\n${campaign.description ? `Descripción interna (contexto para ti): ${campaign.description}\n` : ''}\nQué debe transmitir el mail:\n${prompt}`);

        if (references.length > 0) {
          // Calculamos la media de bytes y líneas de las referencias para dar
          // un objetivo cuantitativo concreto y evitar que el modelo devuelva
          // un mail "mini" cuando las referencias son largas.
          const stats = references.map((r) => ({
            bytes: r.html_content.length,
            lines: r.html_content.split('\n').length,
          }));
          const avgBytes = Math.round(stats.reduce((s, x) => s + x.bytes, 0) / stats.length);
          const avgLines = Math.round(stats.reduce((s, x) => s + x.lines, 0) / stats.length);
          const minBytes = Math.round(avgBytes * 0.8);
          const minLines = Math.round(avgLines * 0.8);

          userParts.push(
            `\n## Ejemplos de estilo (${references.length})\n` +
            `Usa la estética, la retícula, los componentes y la EXTENSIÓN de estos ejemplos como base. ` +
            `Adapta el contenido al briefing pero NO resumas: conserva el número de secciones, bloques, listas y CTAs.\n\n` +
            `OBJETIVO DE LONGITUD (obligatorio): tu HTML final debe tener al menos ${minBytes.toLocaleString('es-ES')} bytes ` +
            `y ${minLines} líneas (media de las referencias: ${avgBytes.toLocaleString('es-ES')} bytes / ${avgLines} líneas). ` +
            `Si te sale más corto, desarrolla más los textos, añade un párrafo de contexto, una cita, un bloque "por qué Retiru", etc. NUNCA entregues una versión resumida.`
          );
          for (let i = 0; i < references.length; i++) {
            const r = references[i];
            const clipped = r.html_content.slice(0, 40000);
            userParts.push(`\n<reference_${i + 1} slug="${r.slug}" subject="${r.subject.replace(/"/g, '&quot;')}" bytes="${r.html_content.length}" lines="${r.html_content.split('\n').length}">\n${clipped}\n</reference_${i + 1}>`);
          }
        } else {
          userParts.push(
            `\n## Sin referencias\nAunque no tienes ejemplos, respeta la estructura mínima obligatoria del system prompt ` +
            `(preheader, hero, saludo, 3-5 párrafos, bloque destacado con lista, CTA, sección secundaria, cierre, footer). ` +
            `Objetivo de longitud: al menos 400 líneas de HTML.`
          );
        }

        userParts.push(
          '\n## Entrega\n' +
          'Devuelve SOLO el HTML del email, sin comentarios, sin markdown, sin backticks. ' +
          'Antes de finalizar, comprueba mentalmente que: (a) tu HTML cumple el objetivo de longitud, ' +
          '(b) usa todos los placeholders {{...}} necesarios, (c) tiene CTA con href absoluto a www.retiru.com, ' +
          '(d) cierra todas las etiquetas y el </html>.'
        );

        send('log', { type: 'detail', message: 'Enviando a gpt-4o-mini… (streaming)' });
        const t0 = Date.now();

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
            stream: true,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userParts.join('\n') },
            ],
          }),
        });

        if (!openaiRes.ok || !openaiRes.body) {
          const errData = await openaiRes.json().catch(() => ({}));
          const msg = (errData as { error?: { message?: string } }).error?.message || openaiRes.statusText;
          send('log', { type: 'error', message: `OpenAI devolvió ${openaiRes.status}: ${msg}` });
          send('done', { ok: false, error: msg });
          controller.close();
          return;
        }

        // Consumimos el stream SSE de OpenAI, acumulamos los deltas y mandamos
        // ticks de progreso al cliente cada ~500 chars para que vea avance.
        const reader = openaiRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let html = '';
        let lastTick = 0;

        readLoop: while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split('\n\n');
          buffer = events.pop() || '';
          for (const evRaw of events) {
            const dataLine = evRaw.split('\n').find((l) => l.startsWith('data:'));
            if (!dataLine) continue;
            const payload = dataLine.slice(5).trim();
            if (payload === '[DONE]') break readLoop;
            try {
              const parsed = JSON.parse(payload);
              const delta: string = parsed.choices?.[0]?.delta?.content || '';
              if (delta) {
                html += delta;
                if (html.length - lastTick >= 500) {
                  const seconds = Math.max(1, Math.round((Date.now() - t0) / 1000));
                  send('log', { type: 'detail', message: `…${html.length.toLocaleString('es-ES')} caracteres generados (${seconds}s)` });
                  lastTick = html.length;
                }
              }
              const finishReason: string | null = parsed.choices?.[0]?.finish_reason || null;
              if (finishReason && finishReason !== 'stop') {
                send('log', { type: 'warn', message: `OpenAI terminó con finish_reason="${finishReason}" (puede estar truncado).` });
              }
            } catch {
              // Fragmento de JSON partido entre chunks: seguirá en el siguiente.
            }
          }
        }

        html = html.trim();
        if (!html) {
          send('log', { type: 'error', message: 'OpenAI no devolvió contenido.' });
          send('done', { ok: false, error: 'OpenAI no devolvió contenido' });
          controller.close();
          return;
        }

        // Por si el modelo se escapa con backticks a pesar del SYSTEM_PROMPT.
        html = html.replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/i, '').trim();

        // Normalización defensiva de rutas de iconos sociales: la ruta
        // correcta en public/ es /email/<red>.png. Si el modelo se inventa
        // /social/, /icons/, o usa dominios externos (cdn, facebook.com,
        // instagram.com), lo reescribimos. Evita footers con iconos rotos.
        const socialFixes: Array<[RegExp, string]> = [
          [/https?:\/\/www\.retiru\.com\/social\/facebook\.(png|svg|jpg)/gi, 'https://www.retiru.com/email/facebook.png'],
          [/https?:\/\/www\.retiru\.com\/social\/instagram\.(png|svg|jpg)/gi, 'https://www.retiru.com/email/instagram.png'],
          [/https?:\/\/www\.retiru\.com\/icons?\/facebook\.(png|svg|jpg)/gi, 'https://www.retiru.com/email/facebook.png'],
          [/https?:\/\/www\.retiru\.com\/icons?\/instagram\.(png|svg|jpg)/gi, 'https://www.retiru.com/email/instagram.png'],
          [/https?:\/\/[^"')\s]*facebook[-_]?icon[^"')\s]*/gi, 'https://www.retiru.com/email/facebook.png'],
          [/https?:\/\/[^"')\s]*instagram[-_]?icon[^"')\s]*/gi, 'https://www.retiru.com/email/instagram.png'],
        ];
        let fixesApplied = 0;
        for (const [rx, replacement] of socialFixes) {
          const before = html;
          html = html.replace(rx, replacement);
          if (html !== before) fixesApplied++;
        }
        if (fixesApplied > 0) {
          send('log', { type: 'detail', message: `Iconos sociales reemplazados por las URLs correctas (/email/...).` });
        }

        // Validaciones mínimas: queremos los placeholders clave.
        const missing: string[] = [];
        if (!html.includes('{{UNSUBSCRIBE_URL}}')) missing.push('{{UNSUBSCRIBE_URL}}');
        if (!html.toLowerCase().includes('<html')) missing.push('<html>');
        if (missing.length > 0) {
          send('log', { type: 'warn', message: `Aviso: faltan ${missing.join(', ')} en el HTML generado. Se guarda igualmente, revisa la vista previa.` });
        }

        // Aviso de longitud si queda corto vs. las referencias (pero lo
        // guardamos igualmente: tú decides si regenerar o editar a mano).
        if (references.length > 0) {
          const avgBytes = Math.round(
            references.reduce((s, r) => s + r.html_content.length, 0) / references.length,
          );
          const minExpected = Math.round(avgBytes * 0.6);
          if (html.length < minExpected) {
            send('log', {
              type: 'warn',
              message: `El HTML generado (${html.length.toLocaleString('es-ES')} bytes) es notablemente más corto que la media de las referencias (~${avgBytes.toLocaleString('es-ES')} bytes). Puede ser una versión "mini": revisa la vista previa y, si hace falta, regenera con un briefing más extenso.`,
            });
          }
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
