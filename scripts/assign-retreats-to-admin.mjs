#!/usr/bin/env node
// Reasigna los 10 retiros existentes al usuario admin contacto@eskaladigital.com
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envPath = join(root, '.env.local');
if (!existsSync(envPath)) { console.error('No .env.local'); process.exit(1); }
readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
  const t = line.trim();
  if (t && !t.startsWith('#')) {
    const eq = t.indexOf('=');
    if (eq > 0) {
      let val = t.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
      process.env[t.slice(0, eq).trim()] = val;
    }
  }
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const ADMIN_EMAIL = 'contacto@eskaladigital.com';

async function main() {
  // 1. Buscar usuario admin por email
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) { console.error('Error listando usuarios:', listErr.message); process.exit(1); }

  let adminUser = users.find(u => u.email === ADMIN_EMAIL);

  if (!adminUser) {
    console.log(`Usuario ${ADMIN_EMAIL} no encontrado en auth. Creándolo...`);
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: 'RetAdmin2026!',
      email_confirm: true,
      user_metadata: { full_name: 'Narciso Pardo (Admin)' },
    });
    if (createErr) { console.error('Error creando usuario:', createErr.message); process.exit(1); }
    adminUser = newUser.user;
    console.log(`✓ Usuario creado: ${adminUser.id}`);
  } else {
    console.log(`✓ Usuario encontrado: ${adminUser.id} (${adminUser.email})`);
  }

  const userId = adminUser.id;

  // 2. Asegurar perfil en profiles
  const { error: profErr } = await supabase.from('profiles').upsert({
    id: userId,
    email: ADMIN_EMAIL,
    full_name: 'Narciso Pardo',
    role: 'admin',
    preferred_locale: 'es',
  }, { onConflict: 'id' });
  if (profErr) console.error('Error perfil:', profErr.message);
  else console.log('✓ Perfil admin asegurado');

  // 3. Buscar o crear organizer_profile para este usuario
  const { data: existingOrg } = await supabase
    .from('organizer_profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  let orgId;
  if (existingOrg) {
    orgId = existingOrg.id;
    console.log(`✓ Organizer profile existente: ${orgId}`);
  } else {
    const { data: newOrg, error: orgErr } = await supabase.from('organizer_profiles').insert({
      user_id: userId,
      business_name: 'Retiru Experiences',
      slug: 'retiru-experiences',
      description_es: 'Organizador de retiros y experiencias de bienestar en los mejores destinos de España.',
      description_en: 'Retreat organizer and wellness experiences in the best destinations in Spain.',
      location: 'España',
      languages: ['es', 'en'],
      status: 'verified',
      verified_at: new Date().toISOString(),
      avg_rating: 4.8,
      review_count: 42,
    }).select('id').single();

    if (orgErr) {
      // Si ya existe el slug, actualizar el user_id
      const { data: bySlug } = await supabase
        .from('organizer_profiles')
        .select('id, user_id')
        .eq('slug', 'retiru-experiences')
        .single();

      if (bySlug) {
        orgId = bySlug.id;
        if (bySlug.user_id !== userId) {
          await supabase.from('organizer_profiles')
            .update({ user_id: userId })
            .eq('id', orgId);
          console.log(`✓ Organizer profile reasignado a admin: ${orgId}`);
        } else {
          console.log(`✓ Organizer profile ya apunta al admin: ${orgId}`);
        }
      } else {
        console.error('Error creando organizer:', orgErr.message);
        process.exit(1);
      }
    } else {
      orgId = newOrg.id;
      console.log(`✓ Organizer profile creado: ${orgId}`);
    }
  }

  // 4. Reasignar todos los retiros a este organizer_profile
  const { data: retreats } = await supabase
    .from('retreats')
    .select('id, slug, organizer_id');

  if (!retreats || retreats.length === 0) {
    console.log('No hay retiros en la base de datos.');
    return;
  }

  console.log(`\nRetiros encontrados: ${retreats.length}`);

  let updated = 0;
  for (const r of retreats) {
    if (r.organizer_id === orgId) {
      console.log(`  ✓ ${r.slug} — ya asignado`);
      continue;
    }
    const { error: updErr } = await supabase
      .from('retreats')
      .update({ organizer_id: orgId })
      .eq('id', r.id);
    if (updErr) {
      console.error(`  ✗ ${r.slug}: ${updErr.message}`);
    } else {
      console.log(`  ✓ ${r.slug} — reasignado`);
      updated++;
    }
  }

  // 5. Actualizar el perfil demo viejo si existía
  const demoUserId = '00000000-0000-0000-0000-000000000001';
  const demoOrgId = '00000000-0000-0000-0000-000000000010';

  if (orgId !== demoOrgId) {
    // Si el organizer_profile viejo sigue referenciando retiros, actualizarlos
    const { data: orphan } = await supabase
      .from('retreats')
      .select('id')
      .eq('organizer_id', demoOrgId);
    if (orphan && orphan.length > 0) {
      await supabase.from('retreats').update({ organizer_id: orgId }).eq('organizer_id', demoOrgId);
      console.log(`  → ${orphan.length} retiros huérfanos reasignados`);
    }
  }

  console.log(`\n═══ Resultado: ${updated} retiros reasignados al admin (${ADMIN_EMAIL}) ═══`);
  console.log(`Organizer ID: ${orgId}`);
  console.log(`User ID: ${userId}`);
}

main().catch(console.error);
