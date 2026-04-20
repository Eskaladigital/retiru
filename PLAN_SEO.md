# PLAN_SEO — Retiru

> **Documento vivo de roadmap SEO**. Se actualiza según avanzamos: se marcan tareas completadas, se añaden notas y aprendizajes, y se registran cambios en el changelog.
>
> - **Fecha de creación**: 2026-04-20
> - **Última actualización**: 2026-04-20 (Fase 2 cerrada)
> - **Propietario**: Narciso
> - **Documento complementario**: `docs/SEO-LANDINGS.md` (estado descriptivo actual de landings y schemas)
>
> **Objetivo**: atacar sistemáticamente búsquedas tipo *"centros de yoga en Murcia"*, *"centro ayurveda en Madrid"*, *"meditación Madrid"* y equivalentes long-tail, combinando mejoras de contenido, schema, cobertura geográfica y Core Web Vitals.

---

## Índice

- [Contexto y estado de partida](#contexto-y-estado-de-partida)
- [Fase 1 — Quick wins (máximo ROI)](#fase-1--quick-wins-máximo-roi)
- [Fase 2 — Mejoras estructurales](#fase-2--mejoras-estructurales)
- [Fase 3 — Escala y long-tail](#fase-3--escala-y-long-tail)
- [Convenciones del plan](#convenciones-del-plan)
- [Changelog](#changelog)

---

## Contexto y estado de partida

### Qué tenemos hoy
- Directorio de centros con rutas bilingües:
  - `/es/centros/[tipo]` · `/es/centros/[tipo]/[provincia]` (+ espejos `/en/centers/...`).
  - `/es/centros-retiru/[slug]` (hub geográfico con las 3 disciplinas).
  - `/es/centro/[slug]` (ficha).
- Taxonomía limitada a **3 tipos**: `yoga | meditation | ayurveda` (migración `014_center_type_three_disciplines.sql`).
- `generateStaticParams` sólo genera pares tipo×provincia con ≥1 centro real (`getCenterTypeProvincePairs` en `src/lib/data/index.ts`).
- Metadata SEO consistente vía `generatePageMetadata` (`src/lib/seo/index.ts`).
- JSON-LD: `ItemList` en listados, `LocalBusiness` en fichas, `BreadcrumbList`, `FAQPage` sólo en `/centros/[tipo]` (no en provinciales).
- Sitemap bilingüe completo con todos los pares tipo×provincia reales (`src/app/sitemap.ts`).
- Portadas del blog **ya convertidas a WebP** (sección blog resuelta el 2026-04-20).

### Debilidades detectadas
1. Las landings `/centros/[tipo]/[provincia]` reutilizan el mismo `intro_es` de la categoría → contenido casi duplicado a nivel nacional vs provincial.
2. Falta `FAQPage` en landings provinciales.
3. Sin landings por ciudad (solo por provincia) → se pierde long-tail "yoga Getafe", "ayurveda Alcalá", etc.
4. Sin fallback amable cuando una provincia no tiene centros del tipo → 404 dinámica.
5. Schema `LocalBusiness` básico — falta `YogaStudio`, geo, `aggregateRating`, `priceRange`, `sameAs`.
6. Enlazado interno programático pobre entre tipos/provincias/ciudades.
7. Landings nacionales (`/es/centros/yoga`) tienen poco contenido aparte del listado.
8. Solo 3 tipos — no se cubren estilos (kundalini, vinyasa, iyengar...).
9. Core Web Vitals en listados de centros sin auditar (imágenes PNG, mapas...).
10. Posible canibalización entre `/centros-retiru/[slug]` y `/centros/[tipo]/[provincia]`.

---

## Fase 1 — Quick wins (máximo ROI)

> Objetivo: mover aguja en SERPs en 2 semanas, sin cambios estructurales. Todas estas acciones se pueden ejecutar en paralelo.

### 🟢 1. Intro editorial único por par tipo×provincia
- **Estado**: ✅ Completada (2026-04-20)
- **Problema**: contenido clonado entre `/centros/yoga` y `/centros/yoga/madrid` (reutiliza `cat.intro_es`).
- **Acción**:
  - Migración SQL: nueva tabla `center_type_province_seo` con `(type, province_slug, intro_es, intro_en, meta_title_es, meta_title_en, meta_description_es, meta_description_en, faq_es, faq_en JSONB, updated_at)`.
  - Script nuevo `scripts/generate-center-type-province-seo.mjs`:
    - Recorre `getCenterTypeProvincePairs()`.
    - Llama GPT-4o con dossier (tipo, provincia, número de centros, ciudades principales, estilos presentes) → genera intro 250–350 palabras + 5 FAQ.
    - Upsert en la tabla.
  - Modificar `src/app/(public)/es/centros/[tipo]/[provincia]/page.tsx` y espejo EN para que prioricen `center_type_province_seo.intro_*` sobre `cat.intro_*`.
  - Añadir script npm `seo:generate-type-province`.
- **Coste estimado**: ~$1 OpenAI · 3–4 h implementación.
- **Impacto esperado**: alto. Elimina duplicación más sangrante del directorio.
- **Dependencias**: ninguna.

### 🟢 2. FAQ schema + contenido por par tipo×provincia
- **Estado**: ✅ Completada (2026-04-20)
- **Problema**: `FAQPage` JSON-LD solo en landings nacionales, no provinciales.
- **Acción**:
  - Reutilizar `faq_es`/`faq_en` de la tabla del punto 1.
  - Renderizar bloque `<Accordion>` visible al final de `/centros/[tipo]/[provincia]`.
  - Emitir `jsonLdFAQ(...)` (helper ya existe en `src/lib/seo/index.ts`).
- **Impacto esperado**: muy alto en CTR por rich results en SERP.

### 🟢 3. Meta title/description optimizados con variantes
- **Estado**: ✅ Completada (2026-04-20)
- **Problema**: patrón rígido `Centros de {label} en {Provincia} | Retiru` pierde matches con variantes.
- **Acción**:
  - Guardar `meta_title_*` / `meta_description_*` en la misma tabla del #1.
  - Prompt al GPT-4o: pedir 2 variantes (A/B manual posterior) con palabras clave naturales ("2026", "verificados", "mejores", "agenda online"...).
  - `generateMetadata` de la ruta con fallback al patrón actual si campo vacío.
- **Impacto esperado**: medio–alto en CTR.

### 🟢 4. Landing fallback sin 404 cuando una provincia no tiene centros del tipo
- **Estado**: ✅ Completada (2026-04-20)
- **Problema**: "centros de ayurveda en Cuenca" → 404 dinámica; usuario y supply perdidos.
- **Acción** en `src/app/(public)/es/centros/[tipo]/[provincia]/page.tsx`:
  - Si `getCenters(type, province).length === 0`:
    - Render informativo "Aún no tenemos centros de {tipo} verificados en {provincia}".
    - Top 6 centros del mismo tipo en provincias limítrofes (tabla `province_neighbors` o distancia entre centroides de `destinations` geo).
    - CTA "Registra tu centro" (`/es/para-organizadores`).
    - `export const metadata = { robots: { index: false, follow: true } }` para no meter thin content al índice.
  - Réplica en EN.
- **Impacto**: preserva tráfico + captura supply. Evita spam en índice.
- **Esfuerzo**: 2 h.

### 🟢 5. Breadcrumbs visibles + `WebSite SearchAction` JSON-LD
- **Estado**: ✅ Parcialmente completada (2026-04-20)
- **Acción**:
  - Auditar que `/es/centros/[tipo]/[provincia]`, `/es/centro/[slug]`, `/es/centros-retiru/[slug]` renderizan breadcrumbs visibles además del schema.
  - Añadir en `src/app/(public)/es/layout.tsx` y `/en/layout.tsx` un JSON-LD global `WebSite` con `potentialAction: SearchAction` → `{SITE_URL}/es/buscar?q={search_term_string}`.
  - Verificar que existe la ruta `/es/buscar` (o ajustar al endpoint real).
- **Hecho**: `/es/buscar` y `/en/search` ahora leen el parámetro `?q=` del URL (cumple `SearchAction` existente en `jsonLdWebsite`).
- **Pendiente para repasar**: auditoría completa de breadcrumbs en todas las rutas críticas.
- **Impacto**: sitelinks searchbox en Google + mejor accesibilidad.
- **Esfuerzo**: 1 h.

---

## Fase 2 — Mejoras estructurales

> Objetivo: ampliar cobertura y consolidar arquitectura. ~1 semana de trabajo.

### 🟡 6. Páginas por ciudad (además de por provincia)
- **Estado**: ✅ Completada (2026-04-20) — migración 043 aplicada, 58 ciudades con SEO generado, rutas + sitemap + HTML sitemap en producción
- **Problema**: sólo tenemos `[tipo]/[provincia]`; "yoga Getafe", "ayurveda Alcalá de Henares" no tienen landing.
- **Acción**:
  - Asegurar columnas `city` + `city_slug` en `centers` (revisar si existen, si no migración).
  - Nueva ruta `/es/centros/[tipo]/[provincia]/[ciudad]` (+ espejo EN).
  - `generateStaticParams` devuelve solo ternas con ≥2 centros de ese tipo en esa ciudad (umbral configurable).
  - Reutilizar tabla SEO del #1 ampliada: añadir columna `city_slug` (nullable) → clave compuesta `(type, province_slug, city_slug NULL-safe)`.
  - Breadcrumb de 4 niveles: España › Madrid › Alcalá › Yoga.
  - Añadir entradas al sitemap.
- **Impacto**: alto en comunidades densas (Madrid, Barcelona, Valencia, Málaga).
- **Esfuerzo**: 1–2 días.

### 🟡 7. Hub geográfico unificado `/es/provincias/[slug]` y `/es/ciudades/[slug]`
- **Estado**: ✅ Completada (2026-04-20) — nuevas rutas `/es/provincias/[slug]` + `/en/provinces/[slug]` con hub multi-disciplina (intro editorial, top centros por tipo, retiros próximos, blog relacionado, FAQ, JSON-LD `CollectionPage`+`Place`). 301 desde `/centros-retiru/[slug]` para provincias. Sitemap XML y HTML actualizados. `/es/ciudades/[slug]` se difiere a Fase 3 tras validar tráfico.
- **Problema**: `centros-retiru/[slug]` y `destinos/[slug]` son sistemas paralelos sin un hub único por ciudad que combine todo.
- **Acción**:
  - Nueva ruta `/es/provincias/[slug]` (+ `/en/provinces/[slug]`) y `/es/ciudades/[slug]` si se valida tras #6.
  - Combina: intro editorial (IA), top-N centros por tipo, próximos retiros en la zona, artículos del blog que la mencionen, FAQ local.
  - JSON-LD: `CollectionPage` + `Place`.
  - 301 desde `/es/centros-retiru/[slug]` hacia el nuevo hub (consolidar link juice).
- **Impacto**: alto en queries generalistas "bienestar Madrid", "wellness Valencia".
- **Esfuerzo**: 2–3 días (incluye generación de copy IA masivo).

### 🟡 8. Enlazado interno programático
- **Estado**: ✅ Completada (2026-04-20) — módulo "Explora por provincia" ya existía en `/es/centros/[tipo]`; añadido "Otras provincias con {tipo}" y "Ciudades con centros de {tipo} en {provincia}" en `/es/centros/[tipo]/[provincia]`; módulo "Otros centros de {tipo} en {provincia}" en la ficha `/es/centro/[slug]`. Autolink geográfico en `RichContentBody` del blog vía nuevo helper `src/lib/auto-link-geo.ts`.
- **Acción**:
  - En `/es/centros/[tipo]` (España): módulo "Explora por provincia" con chips linkando a top 20 provincias (por nº de centros).
  - En `/es/centros/[tipo]/[provincia]`: módulo "Otras provincias con {tipo}" → top 6 cercanas.
  - En ficha `/es/centro/[slug]`: módulo "Otros centros de {tipo} en {provincia}" (auditar si existe).
  - En `RichContentBody` del blog: autolink regex de ciudades/provincias mencionadas a `/es/provincias/[slug]` o landing `[tipo]/[provincia]`.
- **Impacto**: alto. Crawl depth más corto, PageRank interno mejor distribuido.
- **Esfuerzo**: 1 día.

### 🟡 9. Contenido perennizado en `/es/centros/[tipo]` (landings nacionales)
- **Estado**: ✅ Completada (2026-04-20) — bloques añadidos en `/es/centros/[tipo]` y `/en/centers/[type]`: Top 6 provincias con mini-cards, "Explora {tipo} por provincia" (chips con todas), "Estilos más practicados" (6 estilos ES/EN por tipo), "Cómo elegir un centro de {tipo}" (5 tips), "Guías del blog sobre {tipo}" (3 últimos artículos de la categoría) y FAQ ampliada hasta 10 preguntas fusionando `categories.faq` + nuevas preguntas canónicas. Contenido editorial estático en `src/lib/center-type-editorial.ts`. JSON-LD FAQ actualizado con `mergedFaqs`.
- **Acción** (para yoga, meditación, ayurveda):
  - Bloque "Top 5 provincias" con mini-cards y número de centros.
  - Bloque "Tipos/estilos más practicados" (cubre long-tail informacional).
  - Bloque "Cómo elegir un centro de {tipo}" (checklist).
  - Bloque "Artículos del blog relacionados" (5 posts).
  - FAQ nacional ampliada a 10 preguntas.
  - Contenido extensible vía tabla `categories` (ya tiene `intro_es`/`faq`): ampliar estructura si es necesario.
- **Impacto**: medio-alto. Competir con portales sectoriales.
- **Esfuerzo**: 2 días.

---

## Fase 3 — Escala y long-tail

> Objetivo: multiplicar cobertura a 3–6 meses vista.

### 🔵 10. Taxonomía de estilos/subtipos
- **Estado**: ✅ Completada (2026-04-20) — migración `supabase/migrations/044_center_styles.sql` crea `styles` (catálogo seed con 24 estilos entre yoga/meditación/ayurveda) y `center_styles` M:N con trigger `check_center_style_type_match` para garantizar que el estilo pertenece al tipo del centro + RLS public read. Helpers nuevos en `src/lib/data/index.ts`: `getStylesForType`, `getStyleBySlug`, `getCentersByStyle`, `getProvincesForStyle`, `getStyleProvincePairs`, `getStylesForCenter`. Rutas nuevas `/es/centros/[tipo]/estilo/[estilo]` + provincial con mirror EN en `/en/centers/[type]/style/[style][/[province]]`. Umbrales: **nacional ≥ 3** centros totales, **provincial ≥ 5** centros en esa provincia (usuario: más conservador, evita thin content). Ambas landings publican `BreadcrumbList` + `ItemList` (+ `FAQPage` la nacional), cruzan enlaces con hub provincial y landings por tipo y están en `sitemap.ts` (0.7 nacional / 0.6 provincial) y en el sitemap HTML (`HtmlSitemap.tsx`) con grupos dedicados. Script `scripts/infer-center-styles.mjs` (+ `npm run centers:infer-styles[:dry]`) clasifica centros con GPT-4o-mini usando `description_es/en` + `services_es`, filtra por `min-confidence` (default 0.6), no duplica asignaciones (respeta trigger) y acepta `--force`, `--limit`, `--id`, `--concurrency`, `--min-confidence`. Pendiente operativo: aplicar la migración 044 en Supabase (SQL Editor — no hay `DATABASE_URL` local) y lanzar el script en dry-run sobre toda la base.
- **Problema**: sólo 3 tipos. Pierde "kundalini Madrid", "mindfulness Barcelona", "panchakarma España", "hatha Valencia"...
- **Acción**:
  - Migración: tabla `center_styles` (many-to-many con `centers`). Catálogo inicial: `kundalini`, `vinyasa`, `iyengar`, `ashtanga`, `hatha`, `yin`, `aereo`, `prenatal`, `mindfulness`, `vipassana`, `zen`, `panchakarma`, `marma`, etc.
  - Rutas: `/es/centros/[tipo]/estilo/[estilo]` (nacional) y `/es/centros/[tipo]/estilo/[estilo]/[provincia]` (provincial).
  - Facetado dinámico en listados con `?estilo=...`, canonical apuntando a la landing "clean" (evita duplicación).
  - Solo indexar combinaciones con umbral mínimo de centros.
  - Script de inferencia de estilo desde texto libre de `centers.description_es` + GPT-4o.
- **Impacto**: alto en long-tail.
- **Riesgo**: explosión de URLs si no se controla el umbral.
- **Esfuerzo**: 3–5 días.

### 🔵 11. Schema `LocalBusiness` enriquecido
- **Estado**: ✅ Completada (2026-04-20) — `jsonLdLocalBusiness` en `src/lib/seo/index.ts` acepta ahora `centerType`, `images[]`, `geo.GeoCoordinates` (lat/lng de `centers.latitude/longitude`), `sameAs` (website + Instagram + Facebook + Google Maps URL), `email`, `postalCode`, `areaServed`, `priceRange` sanitizado (solo símbolos €/$/texto corto) y `additionalType` a Wikidata para meditación/ayurveda. `@type` resuelto: `YogaStudio` para yoga, `HealthAndBeautyBusiness` + `category` para meditación/ayurveda. Añadido `@id` único por ficha para reutilización en JSON-LD compuestos. Invocaciones actualizadas en `/es/centro/[slug]` y `/en/center/[slug]`.
- **Acción** en `jsonLdLocalBusiness` (`src/lib/seo/index.ts`):
  - `@type` específico: `YogaStudio` cuando `type=yoga`; `HealthAndBeautyBusiness` con `category` para meditación/ayurveda.
  - `aggregateRating` si hay reviews en BD.
  - `priceRange` (€, €€, €€€).
  - `openingHoursSpecification` si guardamos horarios.
  - `sameAs`: Instagram, web oficial, Facebook (ya se scrapea en `scripts/scrape-center-socials-from-website.mjs`).
  - `geo.GeoCoordinates` con lat/lng.
  - `image` array con fotos del centro.
- **Impacto**: alto para paquete local Google Maps + rich results.
- **Esfuerzo**: 2–3 h (sólo añadir campos al generador JSON-LD).

### 🔵 12. Reviews verificadas propias
- **Estado**: ⬜ Pendiente
- **Problema**: todas las fichas idénticas estructuralmente; faltan señales de contenido único.
- **Acción**:
  - Tabla `center_reviews` (`user_id`, `center_id`, `rating 1-5`, `title`, `body`, `booking_id FK`, `created_at`, `status`).
  - Sólo pueden publicar usuarios con booking confirmado (validación en API).
  - Moderación admin.
  - Render en ficha + `Review` + `aggregateRating` en JSON-LD.
  - Notificaciones por email al centro cuando hay review nueva.
- **Impacto**: muy alto (CTR + diferenciación + SEO).
- **Esfuerzo**: 3–4 días.

### 🔵 13. Optimización Core Web Vitals en directorio
- **Estado**: ✅ Completada (2026-04-20) — migrados a `next/image` los listados principales (`CentrosClient`/`CentersClient` con `priority` en las 3 primeras + `sizes` responsive), fichas de centro y retiro (hero con `priority`, galería lazy), listados y fichas de tienda, landings editoriales `para-asistentes`/`for-attendees`/`para-organizadores`/`for-organizers`. Mapa Leaflet (`src/components/ui/center-map.tsx`) ahora se monta solo al entrar en viewport con `IntersectionObserver` (`rootMargin 200px`). Script nuevo `scripts/convert-center-covers-to-webp.mjs` (+ `npm run centers:covers-to-webp[:dry]`) convierte `centers.cover_url` y el array `centers.images` a WebP manteniendo el orden. `scripts/assign-center-images.mjs` ahora comprime las nuevas portadas a WebP directamente antes del upload (fallback al formato original si `sharp` falla). Dry-run piloto sobre 3 centros: -38% de peso.
- **Acción**:
  - Migrar `<img>` → `next/image` en listados (`/centros/[tipo]`, `/centros/[tipo]/[provincia]`, `/centros-retiru/[slug]`, fichas).
  - Primera imagen del fold con `priority`, resto `loading="lazy"`.
  - Mapa (Leaflet) con lazy-load sólo al hacer scroll al módulo.
  - Convertir a WebP las imágenes de centros almacenadas como PNG/JPG en Storage (aprovechar `scripts/convert-blog-covers-to-webp.mjs` como patrón → crear `scripts/convert-center-covers-to-webp.mjs`).
  - Revisar si `scripts/assign-center-images.mjs` guarda WebP directamente y, si no, adaptarlo.
- **Impacto**: alto (Core Web Vitals es factor de ranking).
- **Esfuerzo**: 1–2 días.

### 🔵 14. Consolidar canonical: `centros-retiru` vs `centros`
- **Estado**: ✅ Completada (2026-04-20) — cerrada al terminar Fase 2 #7. Canonical claro: `/es/provincias/[slug]` = hub multi-disciplina; `/es/centros/[tipo]/[provincia]` = landing por tipo. 301 permanente de `/centros-retiru/[slug]` → `/provincias/[slug]` para provincias activo. Enlazado cruzado: hub linka a landings por tipo, y landings por tipo linkan al hub desde el módulo "Explora multi-disciplina".
- **Problema**: posible canibalización entre `/es/centros-retiru/madrid` y `/es/centros/yoga/madrid` por términos similares.
- **Acción**:
  - Decisión estratégica clara:
    - `/es/provincias/[slug]` (tras #7) = hub geográfico de 3 disciplinas.
    - `/es/centros/[tipo]/[provincia]` = landing específica por tipo.
  - 301 desde `/es/centros-retiru/[slug]` → `/es/provincias/[slug]`.
  - Enlazado explícito entre hubs y landings.
- **Impacto**: medio (evita dilución).
- **Esfuerzo**: 1 día (depende de #7).

### 🔵 15. Monitorización continua
- **Estado**: ⬜ Pendiente
- **Acción**:
  - Integración con Google Search Console API: script `scripts/seo-gsc-report.mjs` que descargue últimos 28 días filtrando queries `centros de yoga *`, `centro ayurveda *`, `meditación *`.
  - Dashboard admin con:
    - Queries con impresiones altas + CTR bajo → candidatas a mejora de meta title.
    - URLs con 0 clics → candidatas a mejora de contenido/schema.
    - Evolución mensual de posición media.
  - Alertas si una URL indexada cae al 0 en impresiones.
- **Impacto**: continuo. Sin medición no hay mejora.
- **Esfuerzo**: 2–3 días.

---

## Convenciones del plan

- **Estados**: ⬜ Pendiente · 🟨 En progreso · ✅ Completada · ⛔ Bloqueada · 🚫 Descartada.
- **Prioridad visual**: 🟢 Fase 1 (ROI inmediato) · 🟡 Fase 2 (estructural) · 🔵 Fase 3 (escala).
- Al completar una tarea, **no se borra**: se marca ✅, se añade la fecha en el changelog y se enlazan los PRs/commits relevantes.
- Si una tarea deja de tener sentido, se marca 🚫 con justificación.
- Los scripts nuevos se registran en `package.json` con prefijo `seo:` y se documentan aquí.
- Cualquier nueva tabla/migración se indica con su número (`migrations/04X_...sql`).

---

## Changelog

### 2026-04-20 — Fase 3 (técnica): #10, #11, #13, #14 completadas

#### #14 Consolidar canonical — cerrada
- Cierre operativo al terminar Fase 2 #7: canonical geográfico = `/es/provincias/[slug]`; canonical por tipo = `/es/centros/[tipo]/[provincia]`. 301 `/centros-retiru/[slug]` → `/provincias/[slug]` activas. Enlazado cruzado bidireccional hub ⇄ landings por tipo.

#### #11 Schema `LocalBusiness` enriquecido
- 🔧 `src/lib/seo/index.ts` · `jsonLdLocalBusiness` acepta ahora `centerType`, `images[]`, `geo` (lat/lng), `sameAs` (website + Instagram + Facebook + Google Maps URL), `email`, `postalCode`, `areaServed`, `priceRange` sanitizado, `additionalType` Wikidata para meditación/ayurveda, y `@id` único.
- 🔧 `@type` dinámico: `YogaStudio` (yoga); `HealthAndBeautyBusiness` + `category` (meditación/ayurveda).
- 🔧 Invocaciones actualizadas en `src/app/(public)/es/centro/[slug]/page.tsx` y `src/app/(public)/en/center/[slug]/page.tsx` pasando `C.postal_code`, `C.email`, lista de `images`, `C.latitude/longitude`, `C.instagram`, `C.facebook`, `C.google_maps_url`, `price_range_*`, `areaServed = C.province`.

#### #13 Core Web Vitals
- 🔧 Migración completa de `<img>` → `next/image` en:
  - Listados: `CentrosClient.tsx` / `CentersClient.tsx` (`priority` en las 3 primeras + `sizes` responsive).
  - Ficha centro (`/es/centro/[slug]`, `/en/center/[slug]`): hero con `priority`, galería `loading="lazy"`.
  - Ficha retiro (`/es/retiro/[slug]`, `/en/retreat/[slug]`): logo organizador, hero con `priority`, galería lazy.
  - Tienda (listado y ficha): primeros 4 productos con `priority`, resto lazy.
  - Landings editoriales `para-asistentes`/`for-attendees` y `para-organizadores`/`for-organizers`: sliders y bloques con `priority` selectivo + lazy.
- 🔧 `src/components/ui/center-map.tsx`: Leaflet se monta solo al entrar en viewport con `IntersectionObserver` (`rootMargin: 200px`). CSS estático en top-level; JS dinámico bajo demanda. Placeholder "Cargando mapa…" mientras tanto.
- 🆕 `scripts/convert-center-covers-to-webp.mjs` (+ `npm run centers:covers-to-webp[:dry]`): convierte a WebP `centers.cover_url` y `centers.images[]` respetando el orden, con `--dry-run`, `--keep-original`, `--limit`, `--id`, `--quality`, `--cover-only`.
- 🔧 `scripts/assign-center-images.mjs`: conversión WebP en el momento del upload con `sharp` (quality 82, effort 5) y fallback al formato original si `sharp` falla.
- 📊 Dry-run piloto en 3 centros: −38 % de peso medio.

#### #10 Taxonomía de estilos
- 🆕 Migración `supabase/migrations/044_center_styles.sql`:
  - Catálogo `styles` (id, slug, `name_es/en`, `center_type`, `description_es/en`, `sort_order`, `is_active`) con seed de 24 estilos (yoga: kundalini, vinyasa, iyengar, ashtanga, hatha, yin, aereo, prenatal, restorative, acroyoga, jivamukti; meditación: mindfulness, vipassana, zen, metta, trascendental, guiada; ayurveda: panchakarma, marma, abhyanga, shirodhara, rasayana, dosha-balance, nutricion-ayurvedica).
  - Junction `center_styles` (center_id, style_id, `source` {ai/manual/claim}, `confidence`).
  - Trigger `check_center_style_type_match` (valida que `styles.center_type = centers.type` al insertar/actualizar).
  - RLS public read para ambas.
- 🆕 Helpers en `src/lib/data/index.ts`: `getStylesForType`, `getStyleBySlug`, `getCentersByStyle`, `getProvincesForStyle`, `getStyleProvincePairs`, `getStylesForCenter`. Interface `Style` exportada.
- 🆕 Rutas nuevas:
  - `src/app/(public)/es/centros/[tipo]/estilo/[estilo]/page.tsx` (nacional) — breadcrumb, hero, lista de provincias con el estilo, centros destacados, FAQ, JSON-LD `ItemList` + `BreadcrumbList` + `FAQPage`.
  - `src/app/(public)/es/centros/[tipo]/estilo/[estilo]/[provincia]/page.tsx` (provincial) — lista de centros en la provincia, enlace de vuelta al nacional, JSON-LD `ItemList` + `BreadcrumbList`.
  - Mirrors EN: `src/app/(public)/en/centers/[type]/style/[style]/page.tsx` y `…/[province]/page.tsx`.
  - `generateStaticParams`: nacional si `total ≥ 3`; provincial si `count ≥ 5` (umbral conservador según decisión del usuario).
- 🔧 `src/app/sitemap.ts`: entradas nuevas `priority 0.7` (nacional) / `0.6` (provincial) reusando `getStyleProvincePairs(5)`.
- 🔧 `src/components/sitemap/HtmlSitemap.tsx`: dos grupos nuevos bilingües — "Centros por tipo y estilo (nacional)" y "Centros por tipo, estilo y provincia".
- 🆕 `scripts/infer-center-styles.mjs` (+ `npm run centers:infer-styles[:dry]`): clasificador GPT-4o-mini con `response_format: json_object`, respeta catálogo cerrado por tipo, filtra por `--min-confidence` (default 0.6), soporta `--force`, `--limit`, `--id`, `--concurrency` (1-8). No duplica asignaciones ni viola el trigger.
- 📊 Run real 2026-04-20 con `--min-confidence=0.7 --concurrency=3`: 441/496 centros clasificados (89 % cobertura), 808 asignaciones, 18 landings nacionales + 44 provinciales elegibles para sitemap, 5m26s de ejecución.
- ✅ Migración 044 aplicada en Supabase (SQL Editor) y script `infer-center-styles.mjs` ejecutado en real con `--min-confidence=0.7 --concurrency=3` sobre 496 centros activos (yoga/meditación/ayurveda):
  - **441 centros con estilo (89 % de cobertura)** · 55 sin estilos (descripciones demasiado genéricas; reintentables luego).
  - **808 asignaciones totales** (media 1.83 estilos por centro) en 5 min 26 s.
  - **18 páginas nacionales** y **44 páginas provinciales** dentro de los umbrales (3 / 5 centros) → **62 landings nuevas** sobre long-tail.
  - Top estilos: Hatha 276, Vinyasa 146, Abhyanga 89, Yoga Nidra 56, Prenatal 40, Yin 34, Restorative 31, Kundalini 30, Ashtanga 20, Aéreo 19, Panchakarma 12, Iyengar 12, Marma 10, Shirodhara 9, Mindfulness 9, Power 7, Zen 3, Vipassana 3. Sin asignaciones: `trascendental`, `metta` (esperable, no hay centros dedicados).
- 🆕 `scripts/report-center-styles.mjs` — informe rápido de distribución por estilo, cobertura, pares estilo×provincia y estilos huérfanos.

### 2026-04-20 — Fase 2 completada (acciones #6 a #9)

#### #6 Páginas por ciudad — cerrado
- Ejecutado `node scripts/generate-center-type-province-seo.mjs --city --concurrency=3` → 58 ciudades generadas (yoga 50, ayurveda 7, meditation 1). Verificado sin años obsoletos con auditoría puntual.

#### #7 Hub geográfico unificado `/provincias/[slug]`
- 🆕 Rutas `src/app/(public)/es/provincias/[slug]/page.tsx` y `src/app/(public)/en/provinces/[slug]/page.tsx`. Contenido: hero, breadcrumb, intro editorial desde `GeoNode`, top-3 centros por tipo (yoga / meditación / ayurveda) con cards, "Próximos retiros en la zona" (helper nuevo `getUpcomingRetreatsForDestinations`), "Guías del blog" (helper nuevo `getBlogArticlesMentioning`), FAQ heredada de la disciplina dominante, JSON-LD `CollectionPage` + `Place` + `BreadcrumbList` + `FAQPage`.
- 🆕 Redirecciones 301 (`permanentRedirect`) desde `/es/centros-retiru/[slug]` y `/en/centers-retiru/[slug]` hacia el nuevo hub cuando el slug resuelve a una provincia (incluye fallback por nombre de provincia). `generateStaticParams` del path antiguo recorta ahora sólo `country` + `region`.
- 🔧 `src/app/sitemap.ts` cambia prioridad y path de provincias a `/es/provincias/[slug]` (0.85). HTML sitemap (`src/components/sitemap/HtmlSitemap.tsx`) actualiza títulos y hrefs del grupo provincial.

#### #8 Enlazado interno programático
- 🔎 Módulo "Explora por provincia" en `/es/centros/[tipo]` ya existía (conservado).
- 🔧 En `/es/centros/[tipo]/[provincia]` y espejo EN: se muestran siempre (no solo en fallback) hasta 8 "Otras provincias con {tipo}" y un módulo nuevo "Ciudades con centros de {tipo} en {provincia}" alimentado por `getCitiesForCenterTypeProvince`. Enlace extra al hub multi-disciplina `/provincias/[slug]`.
- 🔧 Ficha de centro `/es/centro/[slug]` y EN: sección "Otros centros de {tipo} en {provincia}" con 6 tarjetas (`getActiveCenters` filtrado + exclusión del actual).
- 🆕 `src/lib/auto-link-geo.ts`: helper server-side que inserta `<a href="/es/provincias/{slug}">` automáticamente en HTML del blog respetando etiquetas bloqueadas (`<a>`, `<h*>`, `<code>`, `<pre>`) y con tope global. Sin atributos `class` para que `sanitize-html` no los descarte; el estilo llega vía `prose` de Tailwind.
- 🔧 Integración en `src/app/(public)/es/blog/[slug]/page.tsx` y EN: se cargan provincias con centros activos y se aplica `autoLinkGeoHtml` al contenido antes de `RichContentBody`.

#### #9 Contenido perennizado en landings nacionales
- 🆕 `src/lib/center-type-editorial.ts`: datos estáticos bilingües para yoga, meditación y ayurveda (6 estilos + 5 tips "cómo elegir" + 5 FAQs canónicas por tipo).
- 🔧 `/es/centros/[tipo]` y `/en/centers/[type]`: top 6 provincias (mini-cards numeradas), "Explora {tipo} por provincia" (chips con todas), "Estilos más practicados", "Cómo elegir", "Guías del blog sobre {tipo}" (query a `blog_articles` por categoría, últimos 3) y FAQ ampliada con fusión `cat.faq` + `EXTRA_FAQS_BY_TYPE` hasta un máximo de 10. JSON-LD FAQ ahora usa `mergedFaqs`.

#### Ajustes transversales
- 🔧 `src/app/(public)/es/centros-retiru/[slug]/page.tsx`: `canLinkType` ya no compara con `'province'` (tras redirección, ese caso es inalcanzable) para destrabar `tsc --noEmit`.

### 2026-04-20 — Fase 2 #6 (páginas por ciudad) — código completo
- 🆕 Migración `supabase/migrations/043_center_type_province_city_seo.sql` — extiende `center_type_province_seo` con `city_slug` + `city_name`, reemplaza UNIQUE por dos índices parciales (provincial vs ciudad).
- 🆕 Helpers en `src/lib/data/index.ts`: `getCenterTypeProvinceCitySeo`, `getCenterTypeProvinceCityTriples(min=2)`, `getCentersByProvinceCity`, `getCitiesForCenterTypeProvince`. Ampliada la interface `CenterTypeProvinceSeo` con `city_slug` y `city_name`.
- 🆕 Rutas:
  - `src/app/(public)/es/centros/[tipo]/[provincia]/[ciudad]/page.tsx`
  - `src/app/(public)/en/centers/[type]/[province]/[city]/page.tsx`
  - Breadcrumb 4 niveles (Home › Centros › Centros de {tipo} › {Provincia} › {Ciudad}), JSON-LD ItemList + BreadcrumbList + FAQPage, fallback amable con `noindex` si 0 centros, módulo "Otras zonas de {provincia}".
  - `generateStaticParams` con umbral `≥ 2` centros → 58 páginas (yoga 50, ayurveda 7, meditation 1).
- 🆕 Sitemap XML + HTML sitemap incluyen ahora las rutas de ciudad (58 bilingües → 116 entradas extra).
- 🆕 Script `scripts/generate-center-type-province-seo.mjs` ampliado:
  - Flags nuevos: `--city` (solo ciudades), `--all` (provincias + ciudades), `--city-min=N` (default 2).
  - `buildDossier` ahora diferencia entre scope provincial y ciudad/barrio; system prompt adaptado para enfocar texto al barrio cuando aplica (p.ej. Eixample, Arganzuela).
  - Upsert refactor: select por triple y update/insert explícitos (los índices parciales impiden un `onConflict` simple).

### 2026-04-20 — Fase 1 completada
- ✅ **#1, #2, #3 (contenido único por par tipo×provincia + FAQ + meta optimizada)**:
  - Migración `supabase/migrations/042_center_type_province_seo.sql` con tabla `center_type_province_seo` (intro, meta, FAQ bilingües + RLS) aplicada en producción.
  - Helper `getCenterTypeProvinceSeo` en `src/lib/data/index.ts`.
  - Script `scripts/generate-center-type-province-seo.mjs` con dossier por par (tipo, provincia, ciudades, muestra de centros) → GPT-4o → JSON estructurado. Flags: `--dry-run`, `--force`, `--limit`, `--type`, `--province`, `--concurrency`.
  - Scripts npm: `seo:type-province` y `seo:type-province:dry`.
  - **97 pares generados** (yoga 61, ayurveda 26, meditation 10) en 2 pasadas (se tuvo que regenerar 65 por tocar años obsoletos como "2023" en meta titles; prompt endurecido para prohibir años específicos → evergreen).
  - `src/app/(public)/es/centros/[tipo]/[provincia]/page.tsx` y espejo EN: `generateMetadata` usa `meta_title_*/meta_description_*` nuevos; render prioriza `intro_*` de la nueva tabla sobre `cat.intro_*`; bloque FAQ accordion con `jsonLdFAQ`.
- ✅ **#4 (fallback sin 404)**: páginas tipo×provincia sin centros muestran mensaje amable, top 6 provincias alternativas con ese tipo y CTA "Registra tu centro". Metadata con `noIndex: !hasCenters` para no meter thin content al índice.
- ✅ **#5 parcial (`?q=` URL param)**: `/es/buscar` y `/en/search` leen `searchParams.get('q')` como estado inicial y sincronizan URL con `history.replaceState` al escribir. `SearchAction` del `jsonLdWebsite` ya era funcional; ahora la UI lo respeta.
- 🆕 **Extra**: HTML sitemap interno en `/es/sitemap` y `/en/sitemap` (`noindex`, no enlazado desde footer). Componente server `src/components/sitemap/HtmlSitemap.tsx`.
- 🆕 Plan creado. Se identifican 15 acciones en 3 fases.
- ✅ (fuera de este plan, ya hecho) Portadas del blog convertidas de PNG a WebP — 152 MB → 9.7 MB (-94%). `scripts/convert-blog-covers-to-webp.mjs`.
- ✅ (fuera de este plan, ya hecho) Open Graph + Twitter card por artículo de blog con `alt`, `width`, `height`, `type: article`. Archivos: `src/app/(public)/es/blog/[slug]/page.tsx`, `src/app/(public)/en/blog/[slug]/page.tsx`.
