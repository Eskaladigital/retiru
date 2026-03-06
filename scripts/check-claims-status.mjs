#!/usr/bin/env node
/**
 * Verifica el estado real de los claims en la base de datos.
 * Uso: node scripts/check-claims-status.mjs
 *      node scripts/check-claims-status.mjs --center "Mahashakti"
 *      node scripts/check-claims-status.mjs --email pedro@escuelamahashakti.com
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envPath = join(root, '.env.local');

if (!existsSync(envPath)) {
  console.error('No se encontró .env.local. Cópialo desde .env.example y rellena las credenciales.');
  process.exit(1);
}

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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

// Filtros opcionales por argumentos
const args = process.argv.slice(2);
const idxCenter = args.indexOf('--center');
const idxEmail = args.indexOf('--email');
const centerFilter = args.find((a) => a.startsWith('--center='))?.split('=')[1] ?? (idxCenter >= 0 ? args[idxCenter + 1] : null);
const emailFilter = args.find((a) => a.startsWith('--email='))?.split('=')[1] ?? (idxEmail >= 0 ? args[idxEmail + 1] : null);

async function main() {
  console.log('═══ VERIFICACIÓN DE CLAIMS EN BASE DE DATOS ═══\n');

  const { data: claims, error } = await supabase
    .from('center_claims')
    .select(`
      id, center_id, user_id, status, method, notes, admin_notes,
      reviewed_by, created_at, reviewed_at,
      centers!center_id(id, name, slug, email),
      profiles!user_id(id, full_name, email)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al consultar claims:', error.message);
    process.exit(1);
  }

  let list = claims || [];

  if (centerFilter) {
    list = list.filter((c) => c.centers?.name?.toLowerCase().includes(centerFilter.toLowerCase()));
    console.log(`Filtro por centro: "${centerFilter}"\n`);
  }
  if (emailFilter) {
    list = list.filter(
      (c) =>
        c.profiles?.email?.toLowerCase().includes(emailFilter.toLowerCase()) ||
        c.centers?.email?.toLowerCase().includes(emailFilter.toLowerCase())
    );
    console.log(`Filtro por email: "${emailFilter}"\n`);
  }

  const pending = list.filter((c) => c.status === 'pending').length;
  const approved = list.filter((c) => c.status === 'approved').length;
  const rejected = list.filter((c) => c.status === 'rejected').length;

  console.log(`Total claims (filtrados): ${list.length}`);
  console.log(`  → Pendientes: ${pending}`);
  console.log(`  → Aprobados:  ${approved}`);
  console.log(`  → Rechazados: ${rejected}`);
  console.log('');

  if (list.length === 0) {
    console.log('No hay claims que coincidan con los filtros.');
    return;
  }

  console.log('── Detalle de cada claim ──\n');

  for (const c of list) {
    const statusColor = c.status === 'approved' ? '\x1b[32m' : c.status === 'rejected' ? '\x1b[31m' : '\x1b[33m';
    const reset = '\x1b[0m';

    console.log(`ID:        ${c.id}`);
    console.log(`Centro:    ${c.centers?.name || c.center_id}`);
    console.log(`  Email:   ${c.centers?.email || '—'}`);
    console.log(`Solicitante: ${c.profiles?.full_name || 'Sin nombre'}`);
    console.log(`  Email:   ${c.profiles?.email || '—'}`);
    console.log(`Estado:    ${statusColor}${c.status}${reset}  ← ESTADO REAL EN BD`);
    console.log(`Método:    ${c.method}`);
    console.log(`Creado:    ${c.created_at}`);
    console.log(`Revisado:  ${c.reviewed_at || '—'}`);
    if (c.reviewed_by) {
      console.log(`Revisado por: ${c.reviewed_by}`);
    }
    console.log('---');
  }

  // Diagnóstico si hay inconsistencia
  const mahashakti = list.find(
    (c) =>
      c.centers?.name?.toLowerCase().includes('mahashakti') ||
      c.profiles?.email?.toLowerCase().includes('pedro@escuelamahashakti')
  );
  if (mahashakti && mahashakti.status === 'approved') {
    console.log('\n⚠️  DIAGNÓSTICO: El claim de Escuela de Yoga Integral Mahashakti está APROBADO en la BD.');
    console.log('   Si la página sigue mostrando "pending", puede deberse a:');
    console.log('   1. Caché del navegador o de Vercel — prueba Ctrl+Shift+R (recarga forzada)');
    console.log('   2. El mensaje "Claim ya está approved" indica que la API detectó que ya estaba aprobado');
    console.log('   3. Tras aprobar, la página hace reload solo si res.ok; con 409 no recarga');
    console.log('   → Solución: cambiar a pestaña "Aprobados" o recargar la página manualmente.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
