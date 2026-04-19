// GET /api/unsubscribe?t=<token>&reason=<opcional>
//
// Marca el centro asociado a <token> con marketing_opt_out_at = now().
// Devuelve una página HTML simple de confirmación. También acepta POST
// (para el header List-Unsubscribe-Post One-Click de Gmail/Outlook).

import { NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const PAGE_OK = (name: string | null) => `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Baja confirmada · Retiru</title>
<style>
  body { margin:0; font-family: system-ui, Arial, sans-serif; background:#f7f7f7; color:#222; }
  main { max-width: 560px; margin: 80px auto; padding: 40px 32px; background:#fff;
         border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); text-align:center; }
  img { max-width: 140px; margin-bottom: 24px; }
  h1 { font-family: Georgia, serif; font-size: 26px; margin: 0 0 12px; }
  p  { color:#555; line-height: 1.6; font-size: 15px; }
  a  { color:#c85a30; }
</style></head>
<body><main>
  <img src="/Logo_retiru.png" alt="Retiru" />
  <h1>Listo, te hemos dado de baja</h1>
  <p>${name ? `No volveremos a enviar comunicaciones comerciales a <strong>${name}</strong>.` : 'No volveremos a enviarte comunicaciones comerciales.'}</p>
  <p>Los correos imprescindibles sobre reservas, pagos o gestión seguirán llegando, porque son necesarios para usar el servicio.</p>
  <p style="margin-top:28px;font-size:13px;color:#888">¿Te has dado de baja sin querer? Escríbenos a <a href="mailto:contacto@retiru.com">contacto@retiru.com</a> y lo revertimos.</p>
</main></body></html>`;

const PAGE_BAD = `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Enlace no válido · Retiru</title>
<style>
  body { margin:0; font-family: system-ui, Arial, sans-serif; background:#f7f7f7; color:#222; }
  main { max-width: 560px; margin: 80px auto; padding: 40px 32px; background:#fff;
         border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); text-align:center; }
  h1 { font-family: Georgia, serif; font-size: 26px; margin: 0 0 12px; }
  p  { color:#555; line-height: 1.6; font-size: 15px; }
  a  { color:#c85a30; }
</style></head>
<body><main>
  <h1>Enlace no válido</h1>
  <p>Este enlace de baja no es correcto o ha caducado. Si quieres dejar de recibir nuestros mails, escríbenos a <a href="mailto:contacto@retiru.com">contacto@retiru.com</a> y lo hacemos manualmente.</p>
</main></body></html>`;

async function processUnsubscribe(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('t') || searchParams.get('token');
  const reason = (searchParams.get('reason') || '').slice(0, 500);

  if (!token) {
    return new NextResponse(PAGE_BAD, {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  try {
    const supabase = createAdminSupabase();
    const { data: center, error } = await supabase
      .from('centers')
      .select('id, name, marketing_opt_out_at')
      .eq('marketing_opt_out_token', token)
      .maybeSingle();

    if (error || !center) {
      return new NextResponse(PAGE_BAD, {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    if (!center.marketing_opt_out_at) {
      await supabase
        .from('centers')
        .update({
          marketing_opt_out_at: new Date().toISOString(),
          marketing_opt_out_reason: reason || null,
        })
        .eq('id', center.id);
    }

    return new NextResponse(PAGE_OK(center.name || null), {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return new NextResponse(PAGE_BAD, {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

export async function GET(request: Request) {
  return processUnsubscribe(request);
}

export async function POST(request: Request) {
  return processUnsubscribe(request);
}
