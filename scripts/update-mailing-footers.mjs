#!/usr/bin/env node
/**
 * Propaga el nuevo footer (firma centrada + logo 90px + iconos PNG sociales +
 * nav limpio + copyright minimalista) a todas las plantillas de mailing.
 *
 * - mailing/*.html                → variante "marketing" (lleva «Cancelar suscripción»)
 * - mailing/app/*.html            → variante "transaccional" (sin cancelar suscripción)
 *
 * Deja intacta retiru-recordatorio-centro.html (ya se migró a mano) y todo
 * archivo que ya contenga el nuevo patrón (idempotente).
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ─── Bloques de firma + footer nuevos ─────────────────────────────────────────

const socialBlock = `                            <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin-top: 18px;">
                                <tr>
                                    <td style="padding: 0 8px;">
                                        <a href="https://www.instagram.com/retiru.es" style="text-decoration: none;">
                                            <img src="https://www.retiru.com/email/instagram.png" alt="Instagram" width="28" height="28" style="display: block; border: 0; width: 28px; height: 28px;" />
                                        </a>
                                    </td>
                                    <td style="padding: 0 8px;">
                                        <a href="https://www.facebook.com/retiru.es" style="text-decoration: none;">
                                            <img src="https://www.retiru.com/email/facebook.png" alt="Facebook" width="28" height="28" style="display: block; border: 0; width: 28px; height: 28px;" />
                                        </a>
                                    </td>
                                </tr>
                            </table>`;

const navBlock = `                            <table cellpadding="0" cellspacing="0" border="0" align="center" class="footer-nav" style="margin-top: 20px;">
                                <tr>
                                    <td style="padding: 0 8px;"><a href="https://www.retiru.com/es/centros-retiru" style="color: #999999; text-decoration: none; font-size: 11px; font-family: Arial, sans-serif;">Centros</a></td>
                                    <td style="color: #cccccc; padding: 0 4px;">&middot;</td>
                                    <td style="padding: 0 8px;"><a href="https://www.retiru.com/es/retiros-retiru" style="color: #999999; text-decoration: none; font-size: 11px; font-family: Arial, sans-serif;">Retiros</a></td>
                                    <td style="color: #cccccc; padding: 0 4px;">&middot;</td>
                                    <td style="padding: 0 8px;"><a href="https://www.retiru.com/es/para-organizadores" style="color: #999999; text-decoration: none; font-size: 11px; font-family: Arial, sans-serif;">Para organizadores</a></td>
                                    <td style="color: #cccccc; padding: 0 4px;">&middot;</td>
                                    <td style="padding: 0 8px;"><a href="https://www.retiru.com/es/contacto" style="color: #999999; text-decoration: none; font-size: 11px; font-family: Arial, sans-serif;">Contacto</a></td>
                                </tr>
                            </table>`;

const signatureBlock = `                    <!-- FIRMA -->
                    <tr>
                        <td style="padding: 28px 40px 24px; text-align: center; border-top: 1px solid #eee;">
                            <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #1a1a1a; font-family: Arial, sans-serif;">
                                Un abrazo del equipo de Retiru
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #999999; font-family: Arial, sans-serif; line-height: 1.6;">
                                Hecho con cari&ntilde;o desde Murcia
                            </p>
                        </td>
                    </tr>`;

const makeFooter = ({ withUnsubscribe }) => {
  const copyright = withUnsubscribe
    ? `                                &copy; 2026 Retiru &middot; <a href="mailto:contacto@retiru.com?subject=No%20quiero%20recibir%20m%C3%A1s%20emails%20de%20Retiru" style="color: #bbbbbb; text-decoration: underline;">Cancelar suscripci&oacute;n</a>`
    : `                                &copy; 2026 Retiru`;

  return `                    <!-- FOOTER -->
                    <tr>
                        <td style="background-color: #fafafa; padding: 32px 30px; text-align: center; border-top: 1px solid #eee;">
                            <a href="https://www.retiru.com" style="text-decoration: none;">
                                <img src="https://www.retiru.com/Logo_retiru.png" alt="Retiru" width="90" style="display: block; margin: 0 auto; max-width: 90px; height: auto; border: 0;" />
                            </a>
${socialBlock}
${navBlock}
                            <p style="margin: 20px 0 0 0; font-size: 10px; color: #bbbbbb; font-family: Arial, sans-serif; line-height: 1.7;">
${copyright}
                            </p>
                        </td>
                    </tr>`;
};

// ─── Regex para encontrar el bloque FIRMA + FOOTER antiguo ───────────────────
// Captura desde el <!-- FIRMA/SIGNATURE --> hasta el </tr> que cierra el
// footer (el que contiene 'Web por ESKALA' o 'Todos los derechos reservados').
const firmaFooterRegex =
  /[ \t]*<!--[^>]*(?:FIRMA|SIGNATURE)[^>]*-->[\s\S]*?<!--[^>]*(?:FOOTER)[^>]*-->[\s\S]*?<\/tr>/;

// ─── Proceso ─────────────────────────────────────────────────────────────────
function processFile(absPath, variant) {
  const src = readFileSync(absPath, 'utf8');

  if (src.includes('https://www.retiru.com/email/instagram.png')) {
    return { file: absPath, status: 'already-migrated' };
  }

  if (!firmaFooterRegex.test(src)) {
    return { file: absPath, status: 'pattern-not-found' };
  }

  const replacement =
    signatureBlock + '\n\n' + makeFooter({ withUnsubscribe: variant === 'marketing' });
  const out = src.replace(firmaFooterRegex, replacement);

  if (out === src) {
    return { file: absPath, status: 'no-change' };
  }

  writeFileSync(absPath, out, 'utf8');
  return { file: absPath, status: 'updated' };
}

const results = [];

// Marketing (lleva cancelar suscripción)
const marketingDir = join(root, 'mailing');
for (const name of readdirSync(marketingDir)) {
  if (!name.endsWith('.html')) continue;
  if (name === 'firma-andrea.html') continue;
  const abs = join(marketingDir, name);
  if (!statSync(abs).isFile()) continue;
  results.push({ name: `mailing/${name}`, ...processFile(abs, 'marketing') });
}

// Transaccionales
const appDir = join(root, 'mailing', 'app');
for (const name of readdirSync(appDir)) {
  if (!name.endsWith('.html')) continue;
  if (name === 'index.html') continue;
  const abs = join(appDir, name);
  results.push({ name: `mailing/app/${name}`, ...processFile(abs, 'transactional') });
}

console.log('Resultados:');
for (const r of results) {
  const icon =
    r.status === 'updated' ? '✅' : r.status === 'already-migrated' ? '⏭️ ' : '❌';
  console.log(`  ${icon} ${r.status.padEnd(18)} ${r.name}`);
}
const updated = results.filter((r) => r.status === 'updated').length;
const skipped = results.filter((r) => r.status === 'already-migrated').length;
const errors = results.filter((r) => r.status === 'pattern-not-found').length;
console.log(`\nActualizados: ${updated} · Ya migrados: ${skipped} · Errores: ${errors}`);
