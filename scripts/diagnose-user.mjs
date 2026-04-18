#!/usr/bin/env node
/**
 * RETIRU · Diagnóstico de registro/login de un usuario concreto
 * Comprueba: auth.users, profiles, notification_preferences, confirmación de email,
 * identidades, y prueba el trigger handle_new_user.
 *
 * Uso: node scripts/diagnose-user.mjs <email>
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnvLocal() {
  const envPath = join(root, '.env.local');
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eq = trimmed.indexOf('=');
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
  });
}

loadEnvLocal();

const email = (process.argv[2] || '').trim().toLowerCase();
if (!email) {
  console.error('Uso: node scripts/diagnose-user.mjs <email>');
  process.exit(1);
}

const { createClient } = await import('@supabase/supabase-js');

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

console.log(`\n🔍 Diagnóstico de "${email}"\n`);

// 1) Buscar en auth.users (paginado)
let foundUser = null;
let page = 1;
const perPage = 200;
while (true) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
  if (error) { console.error('❌ auth.listUsers:', error.message); process.exit(1); }
  foundUser = data.users.find(u => (u.email || '').toLowerCase() === email);
  if (foundUser) break;
  if (data.users.length < perPage) break;
  page++;
  if (page > 50) break;
}

if (!foundUser) {
  console.log('❌ NO existe en auth.users. El usuario NUNCA completó el signUp, o fue borrado.');
} else {
  console.log('✅ Existe en auth.users');
  console.log('   id:              ', foundUser.id);
  console.log('   email:           ', foundUser.email);
  console.log('   email_confirmed: ', foundUser.email_confirmed_at || '—');
  console.log('   confirmed_at:    ', foundUser.confirmed_at || '—');
  console.log('   last_sign_in_at: ', foundUser.last_sign_in_at || '—');
  console.log('   created_at:      ', foundUser.created_at);
  console.log('   updated_at:      ', foundUser.updated_at);
  console.log('   user_metadata:   ', JSON.stringify(foundUser.user_metadata));
  console.log('   identities:      ', (foundUser.identities || []).map(i => i.provider).join(', ') || '—');
  console.log('   banned_until:    ', foundUser.banned_until || '—');
}

// 2) profiles
if (foundUser) {
  const { data: profile, error: errP } = await admin
    .from('profiles')
    .select('*')
    .eq('id', foundUser.id)
    .maybeSingle();
  if (errP) console.log('❌ profiles error:', errP.message);
  else if (!profile) console.log('⚠  NO hay fila en profiles para este id (trigger handle_new_user falló)');
  else {
    console.log('✅ profiles OK');
    console.log('   full_name:', profile.full_name);
    console.log('   phone:    ', profile.phone);
    console.log('   created_at:', profile.created_at);
  }

  // 3) notification_preferences
  const { data: np, error: errN } = await admin
    .from('notification_preferences')
    .select('*')
    .eq('user_id', foundUser.id)
    .maybeSingle();
  if (errN) console.log('❌ notification_preferences error:', errN.message);
  else if (!np) console.log('⚠  No hay notification_preferences (trigger handle_new_profile falló)');
  else console.log('✅ notification_preferences OK');

  // 4) user_roles
  const { data: roles } = await admin.from('user_roles').select('role').eq('user_id', foundUser.id);
  console.log('   roles:', roles?.map(r => r.role).join(', ') || '—');
}

// 5) Comprobar el trigger handle_new_user en DB
console.log('\n🔧 Estado del trigger handle_new_user');
const { data: fn, error: errFn } = await admin.rpc('exec_sql', {
  sql: "SELECT prosrc, proconfig FROM pg_proc WHERE proname = 'handle_new_user'"
}).maybeSingle?.() || { data: null, error: { message: 'rpc exec_sql no existe' } };
if (errFn) console.log('  (no se puede inspeccionar pg_proc via RPC):', errFn.message);

// 6) Comprobar profiles huérfanos (users sin profile)
console.log('\n🔎 Usuarios SIN profile (trigger roto?):');
let orphanCount = 0;
let p = 1;
while (true) {
  const { data } = await admin.auth.admin.listUsers({ page: p, perPage });
  if (!data || !data.users.length) break;
  const ids = data.users.map(u => u.id);
  const { data: profs } = await admin.from('profiles').select('id').in('id', ids);
  const withProfile = new Set((profs || []).map(x => x.id));
  for (const u of data.users) {
    if (!withProfile.has(u.id)) {
      orphanCount++;
      console.log(`   - ${u.email} (${u.id}) created ${u.created_at}`);
    }
  }
  if (data.users.length < perPage) break;
  p++;
  if (p > 50) break;
}
if (orphanCount === 0) console.log('  (ninguno — trigger funcionando)');
else console.log(`\n⚠  ${orphanCount} usuarios sin profile detectados.`);

console.log('\nFin diagnóstico.\n');
