#!/usr/bin/env node
/**
 * Intenta crear un usuario vía admin.createUser para reproducir el error real.
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

const { createClient } = await import('@supabase/supabase-js');
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const testEmail = `__diag_${Date.now()}@retiru-test.local`;
console.log(`\n🧪 Probando crear usuario: ${testEmail}\n`);

const { data, error } = await admin.auth.admin.createUser({
  email: testEmail,
  password: 'TempPass12345!',
  email_confirm: true,
  user_metadata: { full_name: 'Diagnóstico Test', phone: '+34666112233' },
});

if (error) {
  console.log('❌ ERROR (este es el error real del trigger):');
  console.log('   status:', error.status);
  console.log('   code:  ', error.code);
  console.log('   name:  ', error.name);
  console.log('   msg:   ', error.message);
  console.log('\n   JSON:', JSON.stringify(error, null, 2));
} else {
  console.log('✅ Usuario creado:', data.user.id);
  const { data: prof } = await admin.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
  console.log('   Profile:', prof);
  console.log('\n🧹 Limpiando...');
  const { error: delErr } = await admin.auth.admin.deleteUser(data.user.id);
  console.log(delErr ? `   ⚠ No se pudo borrar: ${delErr.message}` : '   ✅ Borrado.');
}
