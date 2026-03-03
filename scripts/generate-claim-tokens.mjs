// Genera tokens de reclamación para centros con email (para incluir en el mail de bienvenida).
// Uso: node scripts/generate-claim-tokens.mjs [--limit N] [--dry-run]
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limitIdx = args.indexOf('--limit');
const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : null;

function generateToken() {
  return randomBytes(32).toString('base64url');
}

async function main() {
  const { data: centers, error } = await supabase
    .from('centers')
    .select('id, name, email, slug')
    .not('email', 'is', null)
    .is('claimed_by', null)
    .order('name');

  if (error) { console.error('Error:', error.message); process.exit(1); }

  const { data: existingTokens } = await supabase
    .from('claim_tokens')
    .select('center_id');

  const alreadyHasToken = new Set((existingTokens || []).map(t => t.center_id));
  let toProcess = centers.filter(c => c.email && !alreadyHasToken.has(c.id));

  if (limit) toProcess = toProcess.slice(0, limit);

  console.log(`Centros con email sin reclamar: ${centers.length}`);
  console.log(`Ya tienen token: ${alreadyHasToken.size}`);
  console.log(`Tokens a generar: ${toProcess.length}`);
  if (dryRun) { console.log('(dry-run, no se insertará nada)'); return; }

  const tokens = toProcess.map(c => ({
    center_id: c.id,
    token: generateToken(),
    expires_at: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
  }));

  const BATCH = 100;
  let inserted = 0;
  for (let i = 0; i < tokens.length; i += BATCH) {
    const batch = tokens.slice(i, i + BATCH);
    const { error: insErr } = await supabase.from('claim_tokens').insert(batch);
    if (insErr) {
      console.error(`Error batch ${i}: ${insErr.message}`);
    } else {
      inserted += batch.length;
      process.stdout.write(`\r  Insertados: ${inserted}/${tokens.length}`);
    }
  }

  console.log('\n\nResultado:');
  console.log(`  Tokens generados: ${inserted}`);

  console.log('\nEjemplo de URLs:');
  for (const t of tokens.slice(0, 3)) {
    const center = toProcess.find(c => c.id === t.center_id);
    console.log(`  ${center?.name}: https://retiru.com/es/reclamar/${t.token}`);
  }
}

main().catch(console.error);
