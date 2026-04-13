# RETIRU — Estructura de contenido y SEO para landings

Documento de referencia sobre la estructura de contenido único de las landings y cómo hacerlas atractivas para SEO.

---

## 1. Estructura actual de landings con slug

| Tipo | Ruta | Slug = | Contenido único |
|------|------|--------|-----------------|
| **Retiros por ciudad** | `/es/retiros-retiru/[slug]` | Ciudad/destino (murcia, ibiza, barcelona) | Hero + H1 + lista filtrada |
| **Centros por ciudad** | `/es/centros-retiru/[slug]` | Ciudad (madrid, barcelona, murcia) | Hero + H1 + lista filtrada |
| **Destinos** | `/es/destinos/[slug]` | Destino (ibiza, mallorca) | H1 + lista filtrada |
| **Ficha retiro** | `/es/retiro/[slug]` | Retiro individual | Portada grande + bloque «Galería del retiro» (resto de fotos), descripción, programa, reseñas, CTA |
| **Ficha centro** | `/es/centro/[slug]` | Centro individual | Galería, descripción, servicios, reseñas |
| **Ficha producto** | `/es/tienda/[slug]` | Producto | Detalle de producto |
| **Perfil organizador** | `/es/organizador/[slug]` | Organizador | Perfil público |
| **Artículo blog** | `/es/blog/[slug]` | Post | Contenido editorial |

---

## 2. Qué tienen hoy (SEO)

Resumen rápido; el detalle de schemas implementados está en **§4.B** (p. ej. `ItemList` + `FAQPage` en listas por ciudad cuando aplica, `Event`/`LocalBusiness`/`Product`/`BlogPosting` en fichas).

| Landing | Metadata | JSON-LD destacado | OG image |
|---------|----------|-------------------|----------|
| retiros-retiru/[slug] | ✅ | ✅ ItemList (lista) + FAQ si hay contenido BD | Según hero |
| centros-retiru/[slug] | ✅ | ✅ ItemList + FAQ si aplica | Según hero |
| retiros-[category] / + destino | ✅ intros/meta BD | ✅ ItemList / FAQ combinados | Por defecto |
| centros/[tipo] / + provincia | ✅ | ✅ ItemList | Por defecto |
| destinos/[slug] | ✅ | ItemList / Place (según implementación) | — |
| retiro/[slug] | ✅ | ✅ Event + BreadcrumbList | Dinámica |
| centro/[slug] | ✅ | ✅ LocalBusiness + BreadcrumbList | Dinámica |
| tienda/[slug] | ✅ | ✅ Product + BreadcrumbList | Dinámica |
| blog/[slug] | ✅ | ✅ BlogPosting + BreadcrumbList | Por artículo |

---

## 3. Contenido único por tipo de landing

### Para listas (retiros-retiru/slug, centros-retiru/slug, destinos/slug)

Las listas filtran por BD pero **no tienen contenido editorial único**. Para SEO:

1. **Párrafo introductorio** (150–300 palabras) por ciudad/destino:
   - Ej: "Murcia es uno de los destinos más desconocidos para retiros en España. La combinación de clima mediterráneo, costa y montaña la convierte en..."
   - Guardar en BD o en archivos de contenido (ej. `content/destinos/murcia.md`).

2. **Por qué [destino] para retiros**:
   - 3–5 bullets: clima, naturaleza, accesibilidad, tipos de retiros típicos.

3. **Enlaces internos**:
   - "Retiros en destinos cercanos: Granada, Almería, Alicante"
   - "Centros de yoga en otras ciudades"

4. **FAQ por destino**:
   - "¿Cuántos retiros hay en Murcia?"
   - "¿Cuál es la mejor época para un retiro en Ibiza?"
   - "¿Hay retiros de yoga para principiantes en [ciudad]?"

### Para fichas (retiros, centro, producto)

- **Retiros**: Ya tienen descripción, programa, reseñas. Falta: JSON-LD Event, breadcrumb en schema, OG image dinámica.
- **Centros**: Falta JSON-LD LocalBusiness (schema.org/HealthAndBeautyBusiness).
- **Productos**: Falta JSON-LD Product.

### Para blog

- Schema Article con author, datePublished, dateModified.
- OG image por artículo.

---

## 4. Ideas para hacer las landings más atractivas (SEO)

### A. Contenido editorial único

| Elemento | Dónde | Ejemplo |
|---------|-------|---------|
| Intro por ciudad | eventos-retiru/[slug], centros-retiru/[slug] | "Murcia, entre mar y montaña, ofrece retiros de yoga, meditación y naturaleza en entornos poco masificados." |
| Intro por destino | destinos/[slug] | "Ibiza es el destino estrella para retiros de yoga en España. Calas secretas, villas con vistas y una energía única." |
| Tips por destino | Cualquier lista | "Consejos: mejor época (abril–octubre), qué llevar, nivel de yoga recomendado." |
| Comparativas | Blog o secciones | "Retiros en Madrid vs Barcelona: qué elegir según tu estilo." |

### B. Schema.org (JSON-LD)

| Landing | Schema recomendado | Estado |
|---------|---------------------|--------|
| retiros-retiru/[slug] | `ItemList` (lista de retiros) | ✅ Implementado |
| centros-retiru/[slug] | `ItemList` (lista de centros) | ✅ Implementado |
| destinos/[slug] | `ItemList` + `Place` (si el destino es un lugar) | Pendiente (Place) |
| retiro/[slug] | `Event` + `BreadcrumbList` | ✅ Implementado |
| centro/[slug] | `LocalBusiness` + `BreadcrumbList` | ✅ Implementado |
| tienda/[slug] | `Product` + `BreadcrumbList` | ✅ Implementado |
| blog/[slug] | `BlogPosting` + `BreadcrumbList` | ✅ Implementado |
| para-organizadores | `FAQPage` | ✅ Implementado |
| for-organizers | `FAQPage` | ✅ Implementado |

### C. Rich snippets

- **FAQ**: `FAQPage` en landings con preguntas frecuentes.
- **Breadcrumbs**: `BreadcrumbList` en todas las páginas con navegación.
- **Eventos**: `Event` con precio, fecha, ubicación.
- **Reseñas**: `aggregateRating` dentro de Event, Product, LocalBusiness.

### D. Imágenes y OG

- `og:image` dinámica por retiro/centro/artículo.
- `alt` descriptivo en todas las imágenes.
- Imágenes optimizadas (WebP, tamaños responsive).

### E. URLs y estructura

- `canonical` en todas las páginas.
- `hreflang` para ES/EN alternativas.
- `alternates` en metadata (ya implementado en `generatePageMetadata` y en posts del blog con `x-default` → versión ES).
- `<html lang>`: dinámico `es` / `en` según ruta (`middleware` envía `x-retiru-locale`, `app/layout.tsx`).

### F. Internal linking

- Desde listas: enlaces a fichas individuales.
- Desde fichas: "Más retiros en [destino]", "Centros en [ciudad]".
- Desde blog: enlaces a retiros y centros relacionados.

---

## 5. Prioridades de implementación

1. ~~**Crítico**: `generateMetadata` en destinos/[slug]~~ ✅ Hecho.
2. ~~**Alto**: JSON-LD Event + Breadcrumb en retiro/[slug]~~ ✅ Hecho.
3. ~~**Alto**: Conectar centros-retiru/[slug] y retiros-retiru/[slug] a Supabase (eliminar datos hardcodeados)~~ ✅ Hecho.
4. ~~**Alto**: Completar sitemap bilingüe con centros por provincia, retiros por destino, organizadores, productos (~1.956 URLs)~~ ✅ Hecho.
5. ~~**Alto**: Generación estática condicional — solo generar páginas de provincia/destino con contenido real~~ ✅ Hecho.
6. ~~**Alto**: JSON-LD LocalBusiness en centro/[slug]~~ ✅ Hecho.
7. ~~**Alto**: Párrafo introductorio por ciudad en retiros-retiru y centros-retiru~~ ✅ Hecho — contenido generado por IA en BD.
8. ~~**Medio**: Crear landings por tipo+ciudad (centros-yoga/[slug], retiros-yoga/[slug], etc.)~~ ✅ Implementado.
9. ~~**Medio**: JSON-LD ItemList en listas por ciudad~~ ✅ Implementado.
10. ~~**Medio**: FAQ por destino + schema FAQPage~~ ✅ Implementado.
11. **Medio**: OG images dinámicas por centro (retiro ya tiene).
12. ~~**Bajo**: JSON-LD Article en blog~~ ✅ Hecho.

---

## 6. Fuentes de contenido único

Contenido diferenciador almacenado en BD (generado con IA via `scripts/generate-seo-content.mjs`):

- **Categorías** (`categories`): `intro_es`, `intro_en`, `meta_title_*`, `meta_description_*`, `faq` (JSONB). Migraciones 028.
- **Destinos** (`destinations`): `intro_es`, `intro_en`, `meta_title_*`, `meta_description_*`, `faq` (JSONB). Migraciones original + 029.
- **Combinaciones** (categoría+destino, tipo+provincia): contenido combinado de ambas fuentes en la página.

---

## 7. Sitemap dinámico (`src/app/sitemap.ts`)

El sitemap se genera en build time con ISR (`revalidate = 3600`). Genera URLs **bilingües** (ES + EN) para cada recurso dinámico.

### URLs incluidas

| Tipo | Fuente | ES | EN | Condición |
|------|--------|----|----|-----------|
| Estáticas | Hardcoded | `/es/...` | `/en/...` | Siempre |
| Centros individuales | `centers` (status=active) | `/es/centro/[slug]` | `/en/center/[slug]` | Siempre |
| Centros por provincia | `getCenterProvinces()` | `/es/centros-retiru/[slug]` | `/en/centers-retiru/[slug]` | Solo si hay >= 1 centro en la provincia |
| Retiros individuales | `retreats` (published, vigente) | `/es/retiro/[slug]` | `/en/retreat/[slug]` | Siempre |
| Retiros por destino | `getDestinationsWithRetreats()` | `/es/retiros-retiru/[slug]` | `/en/retreats-retiru/[slug]` | Solo si hay >= 1 retiro en el destino |
| Blog | `blog_articles` (published) | `/es/blog/[slug]` | `/en/blog/[slug_en \|\| slug]` | Siempre; canonical EN usa `slug_en` si existe; redirección 301 desde slug ES en `/en/blog/` |
| Destinos | `destinations` (active) | `/es/destinos/[slug]` | `/en/destinations/[slug]` | Siempre |
| Organizadores | `organizer_profiles` (verified) | `/es/organizador/[slug]` | `/en/organizer/[slug]` | Siempre |
| Productos | `products` (`status=active`) en **sitemap**; fichas `/es/tienda/*` leen **`shop_products`** | `/es/tienda/[slug]` | `/en/shop/[slug]` | Entradas sitemap si hay filas en `products`; alinear con `shop_products` si en tu proyecto solo usas una tabla |
| Retiros por categoría | `getCategoriesWithRetreats()` | `/es/retiros-[cat]` | `/en/retreats-[cat]` | Solo categorías con retiros |
| Retiros cat+destino | `getCategoryDestinationPairs()` | `/es/retiros-[cat]/[dest]` | `/en/retreats-[cat]/[dest]` | Solo pares con retiros |
| Centros por tipo | Fijo (3 tipos) | `/es/centros/[tipo]` | `/en/centers/[type]` | Siempre |
| Centros tipo+provincia | `getCenterTypeProvincePairs()` | `/es/centros/[tipo]/[prov]` | `/en/centers/[type]/[prov]` | Solo pares con centros |

Todas las entradas incluyen `alternates` con hreflang ES/EN.

### Generación estática condicional

`generateStaticParams()` en las páginas de centros por provincia y retiros por destino usa:
- `getCenterProvinces()` — solo provincias con centros activos
- `getDestinationsWithRetreats()` — solo destinos con retiros publicados y vigentes

Así no se generan páginas vacías ("thin content") en el deploy.

---

## 8. Resumen

- **Listas por destino/provincia**: ✅ Contenido editorial (intro, FAQ) generado por IA en BD, schema ItemList.
- **Landings por categoría**: ✅ `/es/retiros-yoga`, `/es/retiros-meditacion`, etc. con intro, FAQ, destinos, JSON-LD.
- **Landings categoría+destino**: ✅ `/es/retiros-yoga/ibiza` con contenido combinado, FAQ, JSON-LD.
- **Landings centros por tipo**: ✅ `/es/centros/yoga`, `/es/centros/meditacion`, `/es/centros/ayurveda` con provincias, JSON-LD. (Redirección 308 desde `/es/centros-*` antiguas.)
- **Landings tipo+provincia**: ✅ `/es/centros/yoga/madrid` con listado filtrado, JSON-LD.
- **Fichas**: ✅ JSON-LD Event, LocalBusiness, Product, BlogPosting, BreadcrumbList.
- **Sitemap**: ✅ Completo y bilingüe, con todas las landings programáticas incluidas.
- **Internal linking**: ✅ Home enlaza a categorías, categorías enlazan a destinos, breadcrumbs en todas las landings.
