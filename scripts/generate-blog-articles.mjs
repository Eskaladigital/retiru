#!/usr/bin/env node
/**
 * RETIRU · Generar 10 artículos de blog con IA (OpenAI + SerpAPI)
 * Usa .env.local: SUPABASE_*, OPENAI_API_KEY, SERPAPI_API_KEY
 *
 * Uso: node scripts/generate-blog-articles.mjs
 * No necesitas ejecutar nada en Supabase — todo se inserta automáticamente.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ─── Cargar .env.local ─────────────────────────────────────────────────────
function loadEnvLocal() {
  const envPath = join(root, '.env.local');
  if (!existsSync(envPath)) {
    console.error('❌ .env.local no encontrado');
    process.exit(1);
  }
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

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── SerpAPI: búsqueda para contexto ────────────────────────────────────────
async function searchSerp(query, serpKey) {
  try {
    const res = await fetch(
      `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${serpKey}&hl=es&num=5`
    );
    const data = res.ok ? await res.json() : null;
    if (data?.organic_results?.length) {
      return data.organic_results
        .map((r) => r.snippet || r.title)
        .filter(Boolean)
        .slice(0, 5)
        .join('\n');
    }
  } catch (e) {
    console.warn('  ⚠ SerpAPI:', e.message);
  }
  return '';
}

// ─── OpenAI: generar artículo ───────────────────────────────────────────────
async function generateArticle(topic, serpContext, openaiKey) {
  const systemPrompt = `Eres redactor de Retiru (retiru.com), plataforma de retiros y escapadas de bienestar en España.
Escribe artículos de blog útiles, bien estructurados y optimizados para SEO.
Tono cercano pero profesional. Incluye menciones naturales a Retiru cuando sea relevante.

FORMATO DEL CONTENIDO (markdown soportado):
- Encabezados de sección: ### Título (con línea en blanco antes y después)
- Sub-encabezados: #### Subtítulo
- Listas con viñeta: - elemento (cada uno en su propia línea)
- Listas numeradas: 1. elemento (cada uno en su propia línea)
- Negrita: **texto**
- Cursiva: *texto*
- Párrafos separados por doble salto de línea
- NO uses tablas, imágenes ni HTML
- Asegúrate de que cada elemento de lista esté en una línea independiente

Responde SOLO con un JSON válido, sin markdown ni texto extra.`;

  const userPrompt = `Genera un artículo de blog sobre: "${topic}"

${serpContext ? `Contexto actual de búsqueda (usa para enriquecer, no copies literal):\n${serpContext}\n\n` : ''}

Devuelve un JSON con estas claves exactas:
{
  "title_es": "título en español",
  "title_en": "título en inglés",
  "slug": "slug-url-unico",
  "excerpt_es": "resumen 1-2 frases en español",
  "excerpt_en": "resumen 1-2 frases en inglés",
  "content_es": "contenido completo en español, 800-1200 palabras, usa ### para secciones, - para listas, **negrita**, párrafos con doble salto",
  "content_en": "contenido completo en inglés, 600-900 palabras, mismo formato markdown que content_es",
  "read_time_min": número estimado de minutos de lectura,
  "meta_title_es": "título SEO 50-60 caracteres",
  "meta_description_es": "meta descripción 150-160 caracteres"
}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || res.statusText);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error('OpenAI no devolvió contenido');

  // Extraer JSON (puede venir envuelto en ```json ... ```)
  let jsonStr = raw;
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) jsonStr = match[1].trim();

  return JSON.parse(jsonStr);
}

// ─── Imágenes Unsplash por tema ─────────────────────────────────────────────
const COVER_IMAGES = [
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&q=80', // yoga
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80', // playa
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80', // wellness
  'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=1200&q=80', // meditación
  'https://images.unsplash.com/photo-1545389336-cf090694435e?w=1200&q=80',   // yoga aéreo
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80',   // wellness
  'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=80', // yoga
  'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1200&q=80',   // montaña
  'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=1200&q=80', // retiro
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80',   // spa
];

// ─── Temas para los 10 artículos ────────────────────────────────────────────
const TOPICS = [
  { topic: 'Guía completa: cómo elegir tu primer retiro de yoga en España', categorySlug: 'guias' },
  { topic: 'Los 10 mejores destinos para retiros de bienestar en España 2026', categorySlug: 'destinos' },
  { topic: 'Beneficios del retiro detox y ayuno intermitente: qué dice la ciencia', categorySlug: 'bienestar' },
  { topic: 'Meditación guiada para principiantes: 5 técnicas que funcionan', categorySlug: 'bienestar' },
  { topic: 'Yoga aéreo: la tendencia que revoluciona los retiros en 2026', categorySlug: 'guias' },
  { topic: 'Retiros de fin de semana: qué esperar, cómo prepararte y mejores opciones', categorySlug: 'guias' },
  { topic: 'Retiros de silencio en España: guía completa y mejores destinos', categorySlug: 'destinos' },
  { topic: 'Retiros de yoga y surf: la combinación perfecta para desconectar', categorySlug: 'destinos' },
  { topic: 'Cuándo y cómo cancelar un retiro: políticas y consejos prácticos', categorySlug: 'guias' },
  { topic: 'Tendencias de wellness en España 2026: retiros que marcarán el año', categorySlug: 'bienestar' },
];

async function main() {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const serpKey = process.env.SERPAPI_API_KEY;

  if (!url || !serviceKey) {
    console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
    process.exit(1);
  }
  if (!openaiKey) {
    console.error('❌ Falta OPENAI_API_KEY en .env.local');
    process.exit(1);
  }
  if (!serpKey) {
    console.error('❌ Falta SERPAPI_API_KEY en .env.local');
    process.exit(1);
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(url, serviceKey);

  console.log('\n📚 RETIRU · Generando 10 artículos de blog con IA\n');

  // 1. Asegurar categorías
  const categories = [
    { name_es: 'Guías', name_en: 'Guides', slug: 'guias', sort_order: 1 },
    { name_es: 'Bienestar', name_en: 'Wellness', slug: 'bienestar', sort_order: 2 },
    { name_es: 'Destinos', name_en: 'Destinations', slug: 'destinos', sort_order: 3 },
  ];

  for (const cat of categories) {
    await supabase.from('blog_categories').upsert(cat, { onConflict: 'slug' });
  }
  console.log('   ✓ Categorías de blog listas');

  // 2. Obtener author_id (admin o primer perfil)
  const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1);
  let authorId = admins?.[0]?.id;
  if (!authorId) {
    const { data: anyProfile } = await supabase.from('profiles').select('id').limit(1);
    authorId = anyProfile?.[0]?.id;
  }
  if (!authorId) {
    console.error('❌ No hay perfiles en la BD. Crea un usuario (admin) primero.');
    process.exit(1);
  }
  console.log(`   ✓ Autor: ${authorId.slice(0, 8)}...`);

  // 3. Obtener IDs de categorías
  const { data: cats } = await supabase.from('blog_categories').select('id, slug');
  const catMap = Object.fromEntries((cats || []).map((c) => [c.slug, c.id]));

  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < TOPICS.length; i++) {
    const { topic, categorySlug } = TOPICS[i];
    const catId = catMap[categorySlug];
    if (!catId) {
      console.warn(`   ⚠ Categoría "${categorySlug}" no encontrada, usando guias`);
      catMap[categorySlug] = catMap.guias;
    }

    console.log(`\n   [${i + 1}/10] ${topic.slice(0, 50)}...`);

    try {
      // SerpAPI para contexto
      const serpContext = await searchSerp(`retiros ${topic} España 2026`, serpKey);
      if (serpContext) console.log('      🔍 Contexto SerpAPI obtenido');

      // OpenAI
      const article = await generateArticle(topic, serpContext, openaiKey);
      console.log('      ✨ Artículo generado');

      const slug = article.slug || slugify(article.title_es);
      const titleEn = article.title_en || article.title_es;
      const slugEn = article.slug_en || slugify(titleEn);
      const coverImage = COVER_IMAGES[i] || COVER_IMAGES[0];

      const row = {
        title_es: article.title_es,
        title_en: titleEn,
        slug,
        slug_en: slugEn !== slug ? slugEn : null,
        excerpt_es: article.excerpt_es,
        excerpt_en: article.excerpt_en || article.excerpt_es,
        content_es: article.content_es,
        content_en: article.content_en || article.content_es,
        category_id: catMap[categorySlug] || catMap.guias,
        author_id: authorId,
        cover_image_url: coverImage,
        read_time_min: article.read_time_min || 8,
        is_published: true,
        published_at: new Date().toISOString(),
        meta_title_es: article.meta_title_es || article.title_es,
        meta_description_es: article.meta_description_es || article.excerpt_es,
        view_count: 0,
      };

      const { error } = await supabase.from('blog_articles').upsert(row, {
        onConflict: 'slug',
        ignoreDuplicates: false,
      });

      if (error) {
        console.error(`      ❌ Error: ${error.message}`);
      } else {
        inserted++;
        console.log(`      ✅ Insertado: ${slug}`);
      }
    } catch (e) {
      console.error(`      ❌ ${e.message}`);
    }

    // Pequeña pausa para no saturar APIs
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log(`\n✅ Completado: ${inserted} artículos insertados/actualizados`);
  console.log('   Revisa tu blog en /es/blog o /en/blog\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
