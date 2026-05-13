/**
 * Reenvío manual del mail "retiro aprobado/publicado" (igual que producción + BCC archivo).
 * Usa SMTP + Supabase (.env.local). Copia: SMTP_INTERNAL_COPY_EMAIL o contacto@retiru.com.
 *
 * Uso:
 *   npx tsx scripts/resend-retreat-approved.ts --slug=mi-retiro-slug
 *   npx tsx scripts/resend-retreat-approved.ts --slug=mi-retiro-slug --dry-run
 *   npx tsx scripts/resend-retreat-approved.ts --today
 *   npx tsx scripts/resend-retreat-approved.ts --today --dry-run
 */
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

function loadEnvLocal() {
  const envPath = join(process.cwd(), '.env.local');
  if (!existsSync(envPath)) {
    console.error('No se encontró .env.local');
    process.exit(1);
  }
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[k] === undefined) process.env[k] = v;
  }
}

function argSlug(): string | null {
  const a = process.argv.find((x) => x.startsWith('--slug='));
  return a ? a.slice(7).trim() || null : null;
}

function todayMadridDay(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function publishedAtMadridDay(publishedAt: string | null): string | null {
  if (!publishedAt) return null;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(publishedAt));
}

async function restGet(base: string, key: string, path: string) {
  const res = await fetch(`${base.replace(/\/$/, '')}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 500)}`);
  return JSON.parse(text);
}

type RetreatRow = {
  id: string;
  title_es: string;
  slug: string;
  organizer_id: string;
  status: string;
  published_at: string | null;
};

async function sendApprovedForSlug(
  base: string,
  skey: string,
  slug: string,
  dryRun: boolean,
): Promise<void> {
  const enc = encodeURIComponent(slug);
  const rows = await restGet(
    base,
    skey,
    `retreats?slug=eq.${enc}&select=id,title_es,slug,organizer_id,status,published_at&limit=1`,
  );
  const row = rows[0] as RetreatRow | undefined;
  if (!row) {
    console.error('No existe retiro con slug:', slug);
    process.exit(1);
  }

  const orgRows = await restGet(
    base,
    skey,
    `organizer_profiles?id=eq.${row.organizer_id}&select=id,user_id,business_name`,
  );
  const org = orgRows[0];
  if (!org) {
    console.error('Sin organizer_profile');
    process.exit(1);
  }

  const profRows = await restGet(base, skey, `profiles?id=eq.${org.user_id}&select=email,preferred_locale`);
  const prof = profRows[0];
  const email = prof?.email?.trim();
  const locale = (prof?.preferred_locale || 'es') as 'es' | 'en';

  if (!email) {
    console.error('Organizador sin email en profiles');
    process.exit(1);
  }

  console.log(
    `${dryRun ? '[DRY-RUN] ' : ''}${row.title_es} (${row.status}) · slug ${row.slug} · published_at ${row.published_at ?? '—'} · → ${email} · locale ${locale}`,
  );
  console.log(`   BCC archivo: SMTP_INTERNAL_COPY_EMAIL · defecto contacto@retiru.com`);

  if (dryRun) return;

  const { sendRetreatApprovedEmail } = await import('../src/lib/email/index');
  const result = await sendRetreatApprovedEmail({
    to: email,
    locale,
    eventTitle: row.title_es || 'Retiro',
    eventSlug: row.slug,
  });
  console.log('   Enviado.', (result as { data?: { id?: string } })?.data?.id ?? '');
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const useToday = process.argv.includes('--today');
  loadEnvLocal();

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const skey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error('Faltan SMTP_HOST / SMTP_USER / SMTP_PASSWORD');
    process.exit(1);
  }
  if (!base || !skey) {
    console.error('Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  let slugs: string[];

  if (useToday) {
    const madridToday = todayMadridDay();
    const batch = await restGet(
      base,
      skey,
      `retreats?status=eq.published&select=slug,published_at&order=published_at.desc&limit=100`,
    ) as { slug: string; published_at: string | null }[];

    slugs = batch
      .filter((r) => publishedAtMadridDay(r.published_at) === madridToday)
      .map((r) => r.slug);

    if (slugs.length === 0) {
      console.error(`Ningún retiro con published_at cae en hoy (${madridToday} Europa/Madrid).`);
      process.exit(1);
    }
    console.log(`Hoy ${madridToday} (Madrid): ${slugs.length} retiro(s) publicado(s)\n`);
  } else {
    const slug = argSlug();
    if (!slug) {
      console.error('Pasa --slug=... o --today');
      process.exit(1);
    }
    slugs = [slug];
  }

  for (let i = 0; i < slugs.length; i++) {
    await sendApprovedForSlug(base, skey, slugs[i]!, dryRun);
    if (!dryRun && i < slugs.length - 1) await new Promise((r) => setTimeout(r, 800));
  }

  console.log('\nListo. Revisa organizador y copia BCC en contacto@ si aplica.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
