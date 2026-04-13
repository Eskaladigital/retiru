#!/usr/bin/env node
/**
 * Ejecuta moderación de contenido con IA sobre un retiro en Supabase.
 * Uso: node scripts/moderate-retreat.mjs [slug]
 * Si no se pasa slug, usa el retiro de Alma Nómada.
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envPath = join(root, '.env.local');
if (!existsSync(envPath)) { console.error('Falta .env.local'); process.exit(1); }
readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
  const t = line.trim();
  if (t && !t.startsWith('#')) {
    const eq = t.indexOf('=');
    if (eq > 0) {
      let val = t.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
        val = val.slice(1, -1);
      process.env[t.slice(0, eq).trim()] = val;
    }
  }
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseKey) { console.error('Faltan credenciales de Supabase'); process.exit(1); }
if (!openaiKey) { console.error('Falta OPENAI_API_KEY en .env.local'); process.exit(1); }

const slug = process.argv[2] || 'alma-nomada-retiro-de-mujeres-en-marruecos-mayo-y-octubre-mnfr24i1';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log(`\n🔍 Buscando retiro: ${slug}\n`);

const { data: retreat, error } = await supabase
  .from('retreats')
  .select('id, title_es, description_es, description_en, schedule, total_price')
  .eq('slug', slug)
  .single();

if (error || !retreat) { console.error('Retiro no encontrado:', error?.message); process.exit(1); }

console.log(`📋 ${retreat.title_es}`);
console.log(`💰 Precio oficial: ${retreat.total_price} €\n`);
console.log('━'.repeat(60));
console.log('⏳ Ejecutando moderación con Claude...\n');

const MODERATION_PROMPT = `Eres un moderador de contenido para Retiru, una plataforma de retiros. Tu trabajo es detectar información sensible que NO debe aparecer en las fichas públicas de retiros.

**REGLAS DE NEGOCIO:**

1. **NUNCA deben aparecer:**
   - Teléfonos (móviles, WhatsApp, Telegram)
   - Emails de contacto personal/directo
   - Enlaces a sistemas de reserva externos (Booking.com, Airbnb, formularios externos)
   - Redes sociales personales para contacto directo
   - Frases como "contáctame en...", "escríbeme a...", "reserva en..."

2. **SÍ pueden aparecer:**
   - Nombres de facilitadores/profesores (ej: "Facilitación: María Pérez")
   - Nombres de empresas coordinadoras (ej: "Coordinación en Marruecos: Marruecos Mágico Viaje")
   - URLs de alojamientos mencionados como referencia (ej: "Riad Jolie — https://www.riad-jolie.com")
   - Instagram/redes del NEGOCIO (no personal) si no invitan a saltarse Retiru
   - Precios que coincidan EXACTAMENTE con el rango oficial del retiro

3. **PRECIOS:**
   - Si el texto menciona un precio, debe coincidir con el precio oficial del sistema
   - Si menciona precios diferentes o "descuentos especiales por contacto directo" → FLAG crítico

**Tu tarea:**
Analiza el contenido y devuelve un JSON con:
- \`issues\`: array de problemas encontrados (type, field, severity, description, suggestedFix)
- \`hasCriticalIssues\`: true si hay algo que impide publicar (severity: high)

Tipos de issue:
- \`contact_info\`: emails, teléfonos, WhatsApp
- \`external_booking\`: links a booking/reserva externa
- \`price_mismatch\`: precios diferentes al oficial
- \`other\`: otros problemas

Severity:
- \`high\`: impide publicar (datos de contacto directo, booking externo, precios incorrectos)
- \`medium\`: revisar manualmente (ambiguo)
- \`low\`: informativo

**Formato de respuesta (solo JSON válido, sin markdown):**
{
  "hasCriticalIssues": boolean,
  "issues": [
    {
      "type": "contact_info" | "external_booking" | "price_mismatch" | "other",
      "field": "description_es" | "description_en" | "schedule.day1" | etc,
      "severity": "high" | "medium" | "low",
      "description": "descripción del problema en español",
      "suggestedFix": "sugerencia de cómo arreglarlo (opcional)"
    }
  ]
}`;

const contentToCheck = JSON.stringify({
  title: retreat.title_es,
  official_price: retreat.total_price,
  description_es: retreat.description_es || '',
  description_en: retreat.description_en || '',
  schedule: retreat.schedule || [],
}, null, 2);

const client = new OpenAI({ apiKey: openaiKey });

const response = await client.chat.completions.create({
  model: 'gpt-4o',
  temperature: 0.1,
  max_tokens: 2000,
  messages: [
    { role: 'system', content: MODERATION_PROMPT },
    { role: 'user', content: `Analiza este contenido de retiro y detecta información sensible que no debe publicarse:\n\n\`\`\`json\n${contentToCheck}\n\`\`\`\n\nDevuelve SOLO el JSON de moderación, sin texto adicional.` },
  ],
});

const text = response.choices[0]?.message?.content || '';
let result;
try {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  result = JSON.parse(cleaned);
} catch {
  console.error('Error parseando JSON:', text);
  process.exit(1);
}

console.log('━'.repeat(60));

if (result.hasCriticalIssues) {
  console.log('🚫 RESULTADO: HAY PROBLEMAS CRÍTICOS — No debería publicarse\n');
} else if (result.issues?.length > 0) {
  console.log('⚠️  RESULTADO: Advertencias encontradas (no críticas)\n');
} else {
  console.log('✅ RESULTADO: Contenido limpio — Se puede publicar\n');
}

if (result.issues?.length > 0) {
  for (const issue of result.issues) {
    const icon = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢';
    console.log(`${icon} [${issue.severity.toUpperCase()}] ${issue.type}`);
    console.log(`   Campo: ${issue.field}`);
    console.log(`   ${issue.description}`);
    if (issue.suggestedFix) {
      console.log(`   💡 ${issue.suggestedFix}`);
    }
    console.log('');
  }
} else {
  console.log('   No se detectaron problemas en el contenido.\n');
}

console.log('━'.repeat(60));
