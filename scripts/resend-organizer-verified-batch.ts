/**
 * Reenvío manual del mail "organizador verificado" (misma plantilla que producción).
 * Usa SMTP + Supabase (.env.local). Copia archivo: SMTP_INTERNAL_COPY_EMAIL o contacto@retiru.com.
 *
 * IDs = organizer_profiles de las verificaciones del 2026-05-13 bloque admin (~12:45–12:49 UTC).
 * Uso:
 *   npx tsx scripts/resend-organizer-verified-batch.ts
 *   npx tsx scripts/resend-organizer-verified-batch.ts --dry-run
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
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

const ORGANIZER_IDS = [
  '66228c30-29ac-46d9-93e2-19e354714e8d', // Lourdes — 12:45:21
  '413bdf51-d7a4-4b85-89ed-ba53ff2e0ffa', // Marina — 12:45:35
  '3998fa85-2c0a-4b1f-8d23-5595e692a179', // MatriaLur — 12:45:52
  'ad076339-32ae-4a2f-bef5-46e36e263dab', // Jessica — 12:47:49
  '1e73ab08-8ae2-4571-b693-08152ad106b0', // Zunamys Tomás — 12:48:41
  '79e367f3-730d-4227-83e5-c48825fcaffd', // Marta — 12:48:53
];

async function restGet(base: string, key: string, path: string) {
  const res = await fetch(`${base.replace(/\/$/, '')}/rest/v1/${path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 400)}`);
  return JSON.parse(text);
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  loadEnvLocal();

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const skey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error('Faltan SMTP_HOST / SMTP_USER / SMTP_PASSWORD en .env.local');
    process.exit(1);
  }
  if (!base || !skey) {
    console.error('Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const inClause = ORGANIZER_IDS.join(',');
  const orgRows = await restGet(
    base,
    skey,
    `organizer_profiles?id=in.(${inClause})&select=id,business_name,slug,user_id,verified_at,status`,
  );

  const userIds = [...new Set((orgRows as { user_id: string }[]).map((r) => r.user_id).filter(Boolean))];
  const profPath = `profiles?id=in.(${userIds.join(',')})&select=id,email,preferred_locale`;
  const profRows = await restGet(base, skey, profPath);

  const profById = Object.fromEntries(
    (profRows as { id: string; email: string | null; preferred_locale: string | null }[]).map((p) => [p.id, p]),
  );

  const { sendOrganizerVerifiedEmail } = await import('../src/lib/email/index');

  console.log(`${dryRun ? '[DRY-RUN] ' : ''}Organizadores a notificar: ${ORGANIZER_IDS.length}\n`);

  for (const oid of ORGANIZER_IDS) {
    const row = (orgRows as { id: string; business_name: string | null; slug: string; user_id: string }[]).find(
      (o) => o.id === oid,
    );
    if (!row) {
      console.error(`⚠️  No existe organizer_profiles ${oid}`);
      continue;
    }
    const profile = profById[row.user_id];
    const email = profile?.email?.trim();
    const locale = (profile?.preferred_locale || 'es') as 'es' | 'en';
    const businessName = row.business_name || 'Organizador';

    if (!email) {
      console.error(`⚠️  Sin email en profiles para ${businessName} (${oid})`);
      continue;
    }

    console.log(`→ ${businessName} (${email}) locale=${locale} slug=${row.slug}`);

    if (dryRun) continue;

    try {
      const result = await sendOrganizerVerifiedEmail({
        to: email,
        locale,
        businessName,
        organizerSlug: row.slug,
      });
      console.log('   OK', (result as { data?: { id?: string } })?.data?.id ?? '');
    } catch (e) {
      console.error('   Fallo:', e instanceof Error ? e.message : e);
    }

    await new Promise((r) => setTimeout(r, 800));
  }

  console.log('\nListo. Revisa buzón de cada organizador y copia interna en contacto@ si aplica.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
