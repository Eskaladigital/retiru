#!/usr/bin/env node
/**
 * Genera los PNG de los iconos de redes sociales para los mailings
 * a partir de los SVG descargados de Simple Icons en public/email/.
 *
 * Sale en 64x64 (para retina, se muestran a 32x32 en el HTML del mail).
 */
import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dir = join(root, 'public', 'email');

const icons = ['instagram', 'facebook'];
const size = 96;

for (const name of icons) {
  const svg = readFileSync(join(dir, `${name}.svg`));
  await sharp(svg, { density: 300 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(join(dir, `${name}.png`));
  console.log(`✅ public/email/${name}.png (${size}x${size})`);
}
