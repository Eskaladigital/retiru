# Blog Retiru — Línea editorial

Documento de referencia para **redactores, scripts de IA y agentes**. Alineado con la estrategia de contenido en redes: el blog **no vende retiros**; atrae interés general sobre lo que hay **detrás** de un retiro (yoga, meditación, ayurveda, nutrición, recetas).

> **Cola de títulos programada:** [`docs/BLOG-TITULOS-PROPUESTOS.md`](BLOG-TITULOS-PROPUESTOS.md) (100 títulos en orden de publicación).

---

## Qué es el blog (y qué no)

| Sí | No |
|----|-----|
| Recetas (ayurvédicas, vegetarianas, post-yoga, estacionales) | «Retiros en [Murcia / Cabo de Gata / …]» |
| Nutrición con datos útiles (vitaminas, proteína vegetal, FODMAPs…) | Logística de reserva (maleta, cancelación, seguro, reseñas del retiro) |
| Un **tipo** de yoga o meditación por artículo (Hatha, Vipassana, Metta…) | «Cómo elegir tu retiro perfecto» (ya cubierto) |
| Aceites ayurvédicos concretos (sésamo, Brahmi, neem…) | Listas «top destinos» o comparativas geográficas de retiros |
| Tratamientos ayurvédicos (Shirodhara, Nasya, Panchakarma…) | Artículos que compiten con landings SEO (`/es/centros/...`, `/es/provincias/...`) |
| Prácticas (pranayama, rutinas, coherencia cardíaca…) | Contenido promocional de Retiru en cada párrafo |

**Objetivo SEO:** captar búsquedas informativas del público general. Retiru puede mencionarse al final o en un párrafo natural («si quieres profundizar en X, en Retiru hay retiros de…»), no como eje del artículo.

**Misma línea que Instagram:** educar sobre bienestar; los retiros se descubren solos en la plataforma.

---

## Tono y límites

- Cercano pero **profesional y sobrio**; sin misticismo vacío ni estética «hippie».
- **No** promover: cacao ceremonial, ayahuasca, psilocibina, rituales con sustancias, chamanismo comercial, modas esotéricas.
- **Sí:** yoga, meditación, ayurveda clásica, nutrición basada en evidencia razonable, recetas prácticas, salud integrativa aplicable.
- **Idiomas:** artículos en **español e inglés** (`title_en`, `content_en`, `slug_en` cuando aplique). El idioma del chat no cambia el idioma del contenido.

---

## Categorías del blog (Supabase)

| Slug | Uso editorial |
|------|----------------|
| `guias` | Solo guías **prácticas de bienestar** (técnica, rutina, «cómo hacer»). Evitar guías de compra/reserva de retiros. |
| `bienestar` | Nutrición, salud digestiva, estrés, sueño, recetas, ciencia aplicada. |
| `destinos` | **Evitar** para nuevos artículos salvo excepción editorial acordada. Las landings geográficas ya cubren destinos. |

Al crear artículos nuevos, preferir **`bienestar`** o **`guias`** según el tema. Rotación sugerida en la cola: receta → nutrición → yoga/meditación → ayurveda.

---

## Formato del artículo

- **800–1200 palabras** (ES); EN algo más corto si se traduce.
- Markdown: `###` secciones, listas con `-`, negrita con `**`.
- Sin tablas HTML ni imágenes embebidas en el cuerpo (portada aparte).
- Incluir **datos concretos**: ingredientes, pasos, duraciones, precauciones, «para quién no conviene».
- Un artículo = **un ángulo**. No duplicar otro post del blog ni una landing.

---

## Antes de proponer o generar un título

1. Leer títulos ya publicados/programados (Supabase o seeds en `supabase/seed/016_blog_from_csv.sql`).
2. Consultar la cola en [`BLOG-TITULOS-PROPUESTOS.md`](BLOG-TITULOS-PROPUESTOS.md).
3. Comprobar que el ángulo **no** sea una landing disfrazada (geo + retiros).

---

## Scripts y herramientas

| Script | Notas |
|--------|--------|
| `scripts/publish-blog-queue.mjs` | Cola de 100 títulos: texto (GPT-4o-mini) + portada IA + `published_at` cada 3–4 días desde 21-may-2026. Flags: `--limit`, `--offset`, `--resume`, `--skip-covers`, `--dry-run`. Progreso: `scripts/.blog-queue-progress.json`. |
| `scripts/import-blog-csv.mjs` | Importación masiva; validar títulos contra esta línea editorial. |
| `npm run blog:translate-en` | Traduce ES→EN respetando tono. |
| `npm run blog:backfill-covers-ai` | Portadas fotorrealistas acordes al tema (receta → bodegón, yoga → práctica, etc.). |

---

### Artículos programados (published_at futuro)

- En BD: `is_published = true` y `published_at` en el futuro.
- En web pública: **no visibles** hasta que `published_at <= NOW()` (filtro en app + política RLS `blog_pub`, migración `046_blog_public_scheduled.sql`).
- Admin (`/administrator/blog`) sigue viendo todos.


- **Autolink geográfico** (`src/lib/auto-link-geo.ts`): enlaza provincias/ciudades mencionadas de pasada; no forzar nombres de destino solo por SEO.
- Enlazar a **centros o retiros** solo si el artículo lo pide de forma natural (p. ej. tras explicar Shirodhara: «algunos centros de ayurveda en Retiru ofrecen…»).
