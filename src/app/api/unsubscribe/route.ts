// /api/unsubscribe — gestión de bajas de marketing
//
// Soporta tres modos:
//
// 1) GET ?t=<token> (+ opcional reason) → one-click unsubscribe desde el enlace
//    del mail. Marca el centro vinculado a ese token con marketing_opt_out_at
//    = now(). Flujo original.
//
// 2) POST (header List-Unsubscribe-Post) con el mismo token en la query string
//    → idéntico a (1) pero por POST, requerido por Gmail/Outlook.
//
// 3) GET sin token → muestra una página con un formulario donde el usuario
//    puede introducir su email para darse de baja manualmente.
//    POST application/x-www-form-urlencoded con `email` (+ opcional `reason`)
//    → procesa la baja: marca todos los `centers.email` coincidentes como
//    opt-out e inserta el email en `email_suppressions` para bloquear futuros
//    envíos. Respuesta genérica siempre (para no revelar si el email existía).
//
// Página bilingüe: elige ES/EN según `?lang=` o el header Accept-Language.

import { NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type Locale = 'es' | 'en';

function pickLocale(request: Request, fromQuery?: string | null): Locale {
  const q = (fromQuery || '').toLowerCase();
  if (q === 'en') return 'en';
  if (q === 'es') return 'es';
  const accept = (request.headers.get('accept-language') || '').toLowerCase();
  if (accept.startsWith('en')) return 'en';
  return 'es';
}

function htmlResponse(body: string, status = 200): NextResponse {
  return new NextResponse(body, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

// ─── Plantillas HTML ──────────────────────────────────────────────────────

const BASE_STYLES = `
  body { margin:0; font-family: system-ui, Arial, sans-serif; background:#f7f7f7; color:#222; }
  main { max-width: 560px; margin: 80px auto; padding: 40px 32px; background:#fff;
         border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
  main.center { text-align:center; }
  img.logo { max-width: 140px; margin-bottom: 24px; }
  h1 { font-family: Georgia, serif; font-size: 26px; margin: 0 0 12px; text-align:center; }
  p  { color:#555; line-height: 1.6; font-size: 15px; }
  a  { color:#c85a30; }
  label { display:block; font-size:14px; color:#333; margin: 18px 0 6px; font-weight:500; }
  input[type=email], textarea {
    width:100%; box-sizing:border-box; padding: 12px 14px; border:1px solid #d8d8d8;
    border-radius: 10px; font-size:15px; font-family: inherit; color:#222; background:#fff;
  }
  input[type=email]:focus, textarea:focus { outline:none; border-color:#c85a30; box-shadow:0 0 0 3px rgba(200,90,48,0.15); }
  textarea { min-height: 84px; resize: vertical; }
  button {
    margin-top: 24px; width:100%; padding: 14px 18px; border:none; cursor:pointer;
    background:#c85a30; color:#fff; border-radius: 12px; font-size:15px; font-weight:600;
    transition: background .15s;
  }
  button:hover { background:#a94a26; }
  .lang { text-align:center; margin-top: 24px; font-size:13px; color:#888; }
  .note { margin-top: 24px; font-size: 13px; color:#888; text-align:center; }
`;

const I18N = {
  es: {
    formTitle: 'Darse de baja de los correos de Retiru',
    formIntro:
      'Introduce el email con el que recibes nuestras comunicaciones y pulsa el botón para dejar de recibir correos comerciales de Retiru.',
    emailLabel: 'Email',
    reasonLabel: 'Motivo (opcional)',
    reasonPlaceholder: 'Cuéntanos brevemente por qué te das de baja',
    submit: 'Darme de baja',
    emailError: 'Introduce un email válido.',
    okTitle: 'Listo, te hemos dado de baja',
    okByCenter: (name: string) =>
      `No volveremos a enviar comunicaciones comerciales a <strong>${name}</strong>.`,
    okByEmail: (email: string) =>
      `Si <strong>${email}</strong> figuraba en nuestra lista, ya no recibirá más correos comerciales de Retiru.`,
    okFallback: 'No volveremos a enviarte comunicaciones comerciales.',
    okTail:
      'Los correos imprescindibles sobre reservas, pagos o gestión seguirán llegando, porque son necesarios para usar el servicio.',
    okContact: (email: string) =>
      `¿Te has dado de baja sin querer? Escríbenos a <a href="mailto:contacto@retiru.com">contacto@retiru.com</a> y lo revertimos.`,
    errorTitle: 'Enlace no válido',
    errorBody:
      'Este enlace de baja no es correcto o ha caducado. Si quieres dejar de recibir nuestros mails, escríbenos a <a href="mailto:contacto@retiru.com">contacto@retiru.com</a> y lo hacemos manualmente.',
    langSwitch: 'English',
  },
  en: {
    formTitle: 'Unsubscribe from Retiru emails',
    formIntro:
      'Enter the email address you receive our communications on and click the button to stop receiving marketing emails from Retiru.',
    emailLabel: 'Email',
    reasonLabel: 'Reason (optional)',
    reasonPlaceholder: 'Briefly tell us why you are unsubscribing',
    submit: 'Unsubscribe',
    emailError: 'Please enter a valid email address.',
    okTitle: 'You have been unsubscribed',
    okByCenter: (name: string) =>
      `We will no longer send marketing emails to <strong>${name}</strong>.`,
    okByEmail: (email: string) =>
      `If <strong>${email}</strong> was on our list, it will no longer receive marketing emails from Retiru.`,
    okFallback: 'We will no longer send you marketing communications.',
    okTail:
      'Essential emails about bookings, payments or account management will keep arriving, as they are required to use the service.',
    okContact: (email: string) =>
      `Did you unsubscribe by mistake? Write to <a href="mailto:contacto@retiru.com">contacto@retiru.com</a> and we will revert it.`,
    errorTitle: 'Invalid link',
    errorBody:
      'This unsubscribe link is not valid or has expired. If you want to stop receiving our emails, write to <a href="mailto:contacto@retiru.com">contacto@retiru.com</a> and we will handle it manually.',
    langSwitch: 'Español',
  },
} as const;

function pageForm(locale: Locale, opts?: { email?: string; error?: string }): string {
  const i = I18N[locale];
  const otherLang: Locale = locale === 'es' ? 'en' : 'es';
  const otherLabel = I18N[otherLang].langSwitch;
  const emailValue = (opts?.email || '').replace(/"/g, '&quot;');
  const errorBlock = opts?.error
    ? `<p style="color:#b54124; margin:0 0 12px; font-size:14px;">${opts.error}</p>`
    : '';

  return `<!doctype html>
<html lang="${locale}"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${i.formTitle} · Retiru</title>
<style>${BASE_STYLES}</style>
</head><body><main>
  <div style="text-align:center"><img class="logo" src="/Logo_retiru.png" alt="Retiru" /></div>
  <h1>${i.formTitle}</h1>
  <p style="text-align:center">${i.formIntro}</p>
  ${errorBlock}
  <form method="POST" action="/api/unsubscribe?lang=${locale}" accept-charset="utf-8">
    <label for="email">${i.emailLabel}</label>
    <input type="email" id="email" name="email" required value="${emailValue}" autocomplete="email" />
    <label for="reason">${i.reasonLabel}</label>
    <textarea id="reason" name="reason" placeholder="${i.reasonPlaceholder}" maxlength="500"></textarea>
    <button type="submit">${i.submit}</button>
  </form>
  <p class="lang"><a href="/api/unsubscribe?lang=${otherLang}">${otherLabel}</a></p>
</main></body></html>`;
}

function pageOk(locale: Locale, opts: { centerName?: string | null; email?: string | null }): string {
  const i = I18N[locale];
  const otherLang: Locale = locale === 'es' ? 'en' : 'es';
  const otherLabel = I18N[otherLang].langSwitch;
  const main = opts.centerName
    ? i.okByCenter(opts.centerName)
    : opts.email
      ? i.okByEmail(opts.email)
      : i.okFallback;

  return `<!doctype html>
<html lang="${locale}"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${i.okTitle} · Retiru</title>
<style>${BASE_STYLES}</style>
</head><body><main class="center">
  <img class="logo" src="/Logo_retiru.png" alt="Retiru" />
  <h1>${i.okTitle}</h1>
  <p>${main}</p>
  <p>${i.okTail}</p>
  <p class="note">${i.okContact('contacto@retiru.com')}</p>
  <p class="lang"><a href="/api/unsubscribe?lang=${otherLang}">${otherLabel}</a></p>
</main></body></html>`;
}

function pageError(locale: Locale): string {
  const i = I18N[locale];
  return `<!doctype html>
<html lang="${locale}"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${i.errorTitle} · Retiru</title>
<style>${BASE_STYLES}</style>
</head><body><main class="center">
  <h1>${i.errorTitle}</h1>
  <p>${i.errorBody}</p>
</main></body></html>`;
}

// ─── Procesado ────────────────────────────────────────────────────────────

function isValidEmail(raw: string): boolean {
  if (!raw || raw.length > 320) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
}

async function applyTokenOptOut(token: string, reason: string | null) {
  const supabase = createAdminSupabase();
  const { data: center, error } = await supabase
    .from('centers')
    .select('id, name, marketing_opt_out_at')
    .eq('marketing_opt_out_token', token)
    .maybeSingle();

  if (error || !center) return { ok: false as const };

  if (!center.marketing_opt_out_at) {
    await supabase
      .from('centers')
      .update({
        marketing_opt_out_at: new Date().toISOString(),
        marketing_opt_out_reason: reason || null,
      })
      .eq('id', center.id);
  }

  return { ok: true as const, center };
}

async function applyEmailOptOut(emailRaw: string, reason: string | null) {
  const email = emailRaw.trim().toLowerCase();
  const supabase = createAdminSupabase();

  // 1) Marcar todos los centros con ese email como opt-out.
  const { data: centers } = await supabase
    .from('centers')
    .select('id, marketing_opt_out_at')
    .ilike('email', email);

  const ids = (centers || [])
    .filter((c) => !c.marketing_opt_out_at)
    .map((c) => c.id);

  if (ids.length > 0) {
    await supabase
      .from('centers')
      .update({
        marketing_opt_out_at: new Date().toISOString(),
        marketing_opt_out_reason: reason || null,
      })
      .in('id', ids);
  }

  // 2) Registrar en email_suppressions (evita futuros envíos a ese email).
  //    Conflicto por índice único LOWER(TRIM(email)) → no duplicamos.
  try {
    const { error: supErr } = await supabase
      .from('email_suppressions')
      .insert({ email, reason: reason || null, source: 'self' });
    // 23505 = unique_violation → el email ya estaba; lo ignoramos.
    if (supErr && supErr.code !== '23505') {
      console.error('unsubscribe: insert email_suppressions failed', supErr);
    }
  } catch (e) {
    console.error('unsubscribe: unexpected email_suppressions error', e);
  }
}

async function readPostBody(request: Request): Promise<URLSearchParams> {
  const contentType = (request.headers.get('content-type') || '').toLowerCase();
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const raw = await request.text();
    return new URLSearchParams(raw);
  }
  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const params = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') params.append(key, value);
    }
    return params;
  }
  if (contentType.includes('application/json')) {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(body)) {
      if (typeof v === 'string') params.append(k, v);
    }
    return params;
  }
  // Fallback: tratar como urlencoded.
  const raw = await request.text().catch(() => '');
  return new URLSearchParams(raw);
}

// ─── Handlers ─────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('t') || url.searchParams.get('token');
  const reason = (url.searchParams.get('reason') || '').slice(0, 500);
  const locale = pickLocale(request, url.searchParams.get('lang'));

  if (token) {
    const result = await applyTokenOptOut(token, reason || null);
    if (!result.ok) return htmlResponse(pageError(locale), 404);
    return htmlResponse(pageOk(locale, { centerName: result.center.name || null, email: null }));
  }

  // Sin token → formulario para introducir email.
  return htmlResponse(pageForm(locale));
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const locale = pickLocale(request, url.searchParams.get('lang'));
  const token = url.searchParams.get('t') || url.searchParams.get('token');

  // Token en query → one-click (List-Unsubscribe-Post).
  if (token) {
    const reason = (url.searchParams.get('reason') || '').slice(0, 500);
    const result = await applyTokenOptOut(token, reason || null);
    if (!result.ok) return htmlResponse(pageError(locale), 404);
    return htmlResponse(pageOk(locale, { centerName: result.center.name || null, email: null }));
  }

  // Sin token → formulario con email.
  const body = await readPostBody(request);
  const email = (body.get('email') || '').trim();
  const reason = (body.get('reason') || '').slice(0, 500);

  if (!isValidEmail(email)) {
    return htmlResponse(pageForm(locale, { email, error: I18N[locale].emailError }), 400);
  }

  await applyEmailOptOut(email, reason || null);

  // Respuesta genérica: nunca revelamos si el email existía en nuestra BD.
  return htmlResponse(pageOk(locale, { centerName: null, email }));
}
