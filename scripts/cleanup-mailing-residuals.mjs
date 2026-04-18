#!/usr/bin/env node
/**
 * Limpia los residuos del footer antiguo que quedaron colgando después de
 * update-mailing-footers.mjs (el regex anterior paraba en el primer </tr>
 * anidado, dejando suelta la cola con «Todos los derechos reservados» + ESKALA).
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Residuos a eliminar: desde el </table> suelto + <p> "Todos los derechos reservados"
// hasta el </tr> que lo cierra (puede llevar o no "Cancelar suscripción").
const residualRegex =
  /\s*<\/table>\s*<p[^>]*>\s*&copy; 2026 Retiru\. Todos los derechos reservados\.[\s\S]*?<\/tr>/g;

function processFile(absPath) {
  const src = readFileSync(absPath, 'utf8');
  if (!residualRegex.test(src)) {
    residualRegex.lastIndex = 0;
    return { status: 'clean' };
  }
  residualRegex.lastIndex = 0;
  const out = src.replace(residualRegex, '');
  writeFileSync(absPath, out, 'utf8');
  return { status: 'cleaned' };
}

const targets = [];
for (const name of readdirSync(join(root, 'mailing'))) {
  if (name.endsWith('.html') && name !== 'firma-andrea.html') {
    targets.push({ rel: `mailing/${name}`, abs: join(root, 'mailing', name) });
  }
}
for (const name of readdirSync(join(root, 'mailing', 'app'))) {
  if (name.endsWith('.html') && name !== 'index.html') {
    targets.push({ rel: `mailing/app/${name}`, abs: join(root, 'mailing', 'app', name) });
  }
}

let cleaned = 0;
let clean = 0;
for (const t of targets) {
  const r = processFile(t.abs);
  if (r.status === 'cleaned') {
    console.log(`🧹 ${t.rel}`);
    cleaned++;
  } else {
    clean++;
  }
}
console.log(`\nLimpiados: ${cleaned} · Ya limpios: ${clean}`);
