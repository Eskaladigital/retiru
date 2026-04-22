# RETIRU — Estructura de contenido y SEO para landings

Documento de referencia sobre la estructura de contenido único de las landings y cómo hacerlas atractivas para SEO.

---

## 1. Estructura actual de landings con slug

| Tipo | Ruta | Slug = | Contenido único |
|------|------|--------|-----------------|
| **Retiros por ciudad** | `/es/retiros-retiru/[slug]` | Ciudad/destino (murcia, ibiza, barcelona) | Hero + H1 + lista filtrada |
| **Centros por ciudad** | `/es/centros-retiru/[slug]` | Ciudad (madrid, barcelona, murcia) | Hero + H1 + lista filtrada |
| **Destinos** | `/es/destinos/[slug]` | Destino (ibiza, mallorca) | H1 + lista filtrada |
| **Ficha retiro** | `/es/retiro/[slug]` | Retiro individual | Portada + galería → **breadcrumb** → título y cuerpo (descripción, programa, reseñas) + sidebar reserva / CTA móvil |
| **Ficha centro** | `/es/centro/[slug]` | Centro individual | Galería → **breadcrumb** → título y cuerpo (descripción, servicios, reseñas) + barra lateral contacto/mapa |
| **Ficha producto** | `/es/tienda/[slug]` | Producto | Detalle de producto |
| **Perfil organizador** | `/es/organizador/[slug]` | Organizador | Perfil público |
| **Artículo blog** | `/es/blog/[slug]` | Post | Contenido editorial |
| **Centros por tipo** | `/es/centros/[tipo]` | Tipo (yoga/meditacion/ayurveda) | H1 + intro + top 6 provincias + chips + estilos + FAQ (hasta 10) + blog relacionado |
| **Centros tipo+provincia** | `/es/centros/[tipo]/[provincia]` | Tipo + provincia | Intro editorial IA + lista + FAQ provincial + ciudades + otras provincias |
| **Centros tipo+provincia+ciudad** | `/es/centros/[tipo]/[provincia]/[ciudad]` | Tipo + provincia + ciudad | Intro IA por barrio/ciudad + lista + FAQ + "otras zonas" |
| **Centros tipo+estilo** | `/es/centros/[tipo]/estilo/[estilo]` | Tipo + estilo (Fase 3 #10) | Intro del estilo + provincias + centros destacados + FAQ |
| **Centros tipo+estilo+provincia** | `/es/centros/[tipo]/estilo/[estilo]/[provincia]` | Tipo + estilo + provincia | Lista filtrada + enlace al nacional del estilo |
| ~~Hub provincia~~ | ~~`/es/provincias/[slug]`~~ | **DESCARTADA (2026-04-22)** — canibalizaba con Cap. 3 Tipo×Prov. Ver §8.1. | 301 → `/es/centros/yoga/[prov]` (disciplina dominante) |

---

## 2. Qué tienen hoy (SEO)

Resumen rápido; el detalle de schemas implementados está en **§4.B** (p. ej. `ItemList` + `FAQPage` en listas por ciudad cuando aplica, `Event`/`LocalBusiness`/`Product`/`BlogPosting` en fichas).

| Landing | Metadata | JSON-LD destacado | OG image |
|---------|----------|-------------------|----------|
| retiros-retiru/[slug] | ✅ | ✅ ItemList (lista) + FAQ si hay contenido BD | Según hero |
| centros-retiru/[slug] | ✅ (301 → provincias si es provincia) | ✅ ItemList + FAQ si aplica | Según hero |
| retiros-[category] / + destino | ✅ intros/meta BD | ✅ ItemList / FAQ combinados | Por defecto |
| centros/[tipo] / + provincia / + ciudad | ✅ intros/meta BD (042/043) | ✅ ItemList + FAQPage + BreadcrumbList | Por defecto |
| centros/[tipo]/estilo/[estilo] (+/[prov]) | ✅ intros desde catálogo `styles` | ✅ ItemList + BreadcrumbList (+ FAQPage nacional) | Por defecto |
| provincias/[slug] | ✅ | ✅ CollectionPage + Place + BreadcrumbList + FAQPage | Por defecto |
| destinos/[slug] | ✅ | ItemList / Place (según implementación) | — |
| retiro/[slug] | ✅ | ✅ Event + BreadcrumbList | Dinámica |
| centro/[slug] | ✅ | ✅ LocalBusiness enriquecido (YogaStudio/HealthAndBeautyBusiness + geo + sameAs + images + priceRange) + BreadcrumbList | Dinámica |
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
| Centros tipo+provincia+ciudad | `getCenterTypeProvinceCityTriples(2)` | `/es/centros/[tipo]/[prov]/[ciudad]` | `/en/centers/[type]/[prov]/[city]` | Umbral ≥ 2 centros en la ciudad |
| Centros tipo+estilo (nacional) | `getStyleProvincePairs(3)` agregado por estilo | `/es/centros/[tipo]/estilo/[estilo]` | `/en/centers/[type]/style/[style]` | Umbral ≥ 3 centros con el estilo |
| Centros tipo+estilo+provincia | `getStyleProvincePairs(5)` | `/es/centros/[tipo]/estilo/[estilo]/[prov]` | `/en/centers/[type]/style/[style]/[prov]` | Umbral ≥ 5 centros en la provincia |
| Hub provincia | `getGeoNodeBySlug('province')` | `/es/provincias/[slug]` | `/en/provinces/[slug]` | Solo provincias con al menos 1 centro |

Todas las entradas incluyen `alternates` con hreflang ES/EN.

### Generación estática condicional

`generateStaticParams()` en las páginas de centros por provincia y retiros por destino usa:
- `getCenterProvinces()` — solo provincias con centros activos
- `getDestinationsWithRetreats()` — solo destinos con retiros publicados y vigentes

Así no se generan páginas vacías ("thin content") en el deploy.

---

## 8. Estrategia de diferenciación (anti-canibalización)

> Añadida 2026-04-22. Es el **contrato estratégico** al que debe ajustarse cualquier generación futura de contenido SEO para las ~266 landings programáticas. Su razón de ser: impedir que Google vea varias landings como el mismo intent (canibalización) y disuelva su PageRank.

### 8.1 Mapa de capas y sus intents primarios

| Capa | Ruta | Nº | Intent **primario** (ÚNICO) | Query típica |
|------|------|----|------------------------------|--------------|
| 1 · Nacional tipo | `/es/centros/[tipo]` | 3 | "¿Qué es {disciplina}? ¿Dónde practicarla en España?" | "centros de yoga en España" |
| 2 · Tipo×Estilo | `/es/centros/[tipo]/estilo/[estilo]` | 10 | "¿Qué es {estilo}? ¿En qué se diferencia?" | "qué es yoga vinyasa" |
| 3 · Tipo×Prov | `/es/centros/[tipo]/[provincia]` | 97 | "**Directorio** de centros de {tipo} en {Prov}" | "centros de yoga Madrid" |
| 4 · Estilo×Prov | `/es/centros/[tipo]/estilo/[estilo]/[provincia]` | 44 | "Centros de {tipo}-{estilo} concretamente en {Prov}" | "kundalini yoga Madrid" |
| 5 · Tipo×Prov×Ciudad | `/es/centros/[tipo]/[provincia]/[ciudad]` | 58 | "Centros de {tipo} en {Ciudad} — acceso, transporte, carácter" | "yoga Arganzuela" |
| (DESCARTADA) Hub Prov | `/es/provincias/[slug]` | 57 | — | — |

**Capa Hub Prov (`/es/provincias/[slug]`) descartada el 2026-04-22** tras decidir que solapaba intent con Capa 3 ("yoga Madrid" competía con "bienestar Madrid" porque Google lee ambas como wellness/yoga genérico). Se elimina el código y se redirigen sus URLs a la Capa 3 con la disciplina dominante (yoga para provincias con yoga, meditación para provincias solo con meditación, etc.).

### 8.2 Matriz de secciones PROHIBIDAS por capa

Esta es la regla más importante. **Una sección existe en una capa y SOLO en esa capa.** Si una landing "hija" ya tiene información, la "madre" enlaza hacia ella en vez de duplicarla.

| Sección editorial | Cap. 1 Nac. tipo | Cap. 3 Tipo×Prov | Cap. 5 Tipo×Prov×Ciudad | Cap. 2 Tipo×Estilo | Cap. 4 Estilo×Prov |
|---|:---:|:---:|:---:|:---:|:---:|
| `why_here` (por qué aquí) | ✅ disciplina | ✅ territorio | ❌ (heredado) | ✅ estilo | ⚠️ intersección estilo×prov |
| `what_to_expect` (qué esperar) | ✅ sesión-tipo genérica | ✅ formatos locales | ✅ acceso al barrio | ✅ sesión-estilo | ❌ |
| `how_to_choose` (cómo elegir) | ✅ criterios genéricos | ⚠️ criterios + ref local | ✅ cercanía, transporte, aparcamiento | ✅ distinguir buen profesor del estilo | ❌ |
| `history` (tradición/origen) | ✅ disciplina en España | ❌ | ❌ | ✅ origen del estilo | ❌ |
| `faq_expanded` (7-10 Q&A) | ✅ genérica | ✅ provincial | ✅ hiperlocal | ✅ estilo | ✅ estilo+prov |

Leyenda · ✅ obligatoria · ⚠️ condicional · ❌ **prohibida** (la hereda su padre vía enlace interno)

### 8.3 Patrones únicos de H1 y meta_title

Cada capa tiene un patrón DISTINTO que no puede replicarse en otra capa:

| Capa | Patrón H1 | Patrón meta_title |
|------|-----------|--------------------|
| 1 | `Centros de {tipo} en España` | `Centros de {tipo} · directorio Retiru` |
| 2 | `{Estilo}: {tipo} {adjetivo-estilo}` | `{Estilo} en España · dónde practicar` |
| 3 | `Centros de {tipo} en {Prov}` | `Centros de {tipo} en {Prov} · {N} opciones` |
| 4 | `{Estilo} en {Prov}` | `{Estilo} en {Prov} · {N} escuelas` |
| 5 | `{Tipo} en {Ciudad} ({Prov})` | `{Tipo} en {Ciudad} · centros verificados` |

Sin años (`2024`, `2025`…), sin superlativos vacíos (`mejores`), sin patrones duplicados entre capas. La Capa 2 evita la palabra "centros" para diferenciarse de la Capa 1.

### 8.4 Reglas de supresión automática (`suppress_reason`)

Una landing se marca `noindex` cuando su índice amenaza con canibalizar a otra de mayor prioridad:

| Regla | Condición | Acción | Razón SEO |
|-------|-----------|--------|-----------|
| R1 | Ciudad tiene ≥ 60% de los centros de la provincia (Cap. 5) | `noindex`, absorbe Cap. 3 | La provincia ya cubre el intent. |
| R2 | Estilo×Prov (Cap. 4) con ≤ 3 centros | `noindex`, enlace al estilo nacional | Poca oferta = thin content. |
| R3 | Estilo representa ≥ 40% del tipo (Cap. 2) — hatha (47% yoga), abhyanga (100% ayurveda visible) | El contenido pasa a ángulo **niche/didáctico** obligatorio | Evita canibalizar Cap. 1 con la misma query. |
| R4 | Centros en una Cap. 3 < 2 | `noindex` + fallback amable | Thin content. Ya implementado. |
| R5 | Provincia duplicada (ej. `lerida` vs `lleida`) | 301 del no-canónico al canónico | Misma entidad con dos slugs. |

El campo `suppress_reason` (ENUM `'duplicate_of_parent' | 'thin_content' | 'dominant_style_educational_only' | 'duplicate_province_slug'`) vive en las tablas SEO y guía al renderer para emitir `noIndex: true` o aplicar el ángulo nicho.

### 8.5 Ángulo especial "niche_angle" para estilos dominantes

Los estilos que dominan el tipo NO pueden ser páginas de listado comercial — competirían con el tipo. Los tratamos como contenido **educativo/didáctico** con un ángulo purista:

| Landing | Ángulo editorial | Intent objetivo |
|---------|-----------------|-----------------|
| `/es/centros/yoga/estilo/hatha` | "Hatha tradicional vs hatha moderno occidentalizado" | Usuario purista que ya sabe lo que es yoga |
| `/es/centros/ayurveda/estilo/abhyanga` | "El masaje ayurvédico: técnica, aceites, formación" | Usuario con interés en la técnica, no en "un centro cercano" |

Estas landings **no listan centros en primer plano** (solo una pequeña pasarela al final). El grueso del texto es historia + diferenciación + para quién. Las landings Cap. 4 (`/estilo/hatha/madrid`) pueden mantenerse si superan R2 porque el intent es hiperespecífico.

### 8.6 Enlazado jerárquico unidireccional

```
Cap. 1 Nacional tipo ──→ Cap. 3 Tipo×Prov ──→ Cap. 5 Ciudad ──→ Ficha centro
     │                         │
     └──→ Cap. 2 Estilo ──→ Cap. 4 Estilo×Prov
```

- **Nunca cross-canonicals** entre capas (salvo el 301 legacy `centros-retiru` → `centros/yoga/...`).
- **Nunca enlaces horizontales** entre provincias a otras provincias salvo en el módulo "Otras provincias con {tipo}" (que va a la MISMA capa).
- **Los chips de ciudades de Cap. 3** siempre enlazan a Cap. 5, nunca a provincias distintas.
- **La ficha del centro** enlaza hacia arriba (breadcrumb) y lateralmente ("Otros centros de {tipo} en {provincia}"), pero nunca cross-capa a Cap. 2/Cap. 4.

### 8.7 Almacenamiento del nuevo contenido rico

Migración `045_seo_sections.sql` añade a las 4 tablas SEO (`categories`, `destinations`, `center_type_province_seo`, `styles`):

```sql
ADD COLUMN sections_es JSONB NOT NULL DEFAULT '[]',
ADD COLUMN sections_en JSONB NOT NULL DEFAULT '[]',
ADD COLUMN serp_data   JSONB,  -- {paa, related, local_pack, featured_snippet, fetched_at}
ADD COLUMN suppress_reason TEXT; -- NULL, 'duplicate_of_parent', 'thin_content', 'dominant_style_educational_only', 'duplicate_province_slug'
```

Formato de `sections_*`:

```json
[
  { "key": "why_here",       "heading": "Por qué practicar ayurveda en Álava", "html": "<p>...</p>" },
  { "key": "what_to_expect", "heading": "Qué esperar en tu primera sesión en Vitoria-Gasteiz", "html": "..." },
  { "key": "how_to_choose",  "heading": "Cómo elegir un centro en Álava",       "html": "..." },
  { "key": "history",        "heading": "Tradición ayurvédica en el País Vasco", "html": "..." }
]
```

Orden del array = orden de renderizado. `key` es estable para identificar sección (usado por el renderer). `heading` es el H2 visible. `html` es contenido seguro (sanitizado) con solo `<p>, <ul>, <ol>, <li>, <strong>, <em>`.

Nueva tabla `style_province_seo` paralela para Cap. 4 (mismos campos que `center_type_province_seo` pero con columna `style_slug`).

### 8.8 Flujo de generación con SerpApi + OpenAI

Script unificado `scripts/generate-seo-sections.mjs`:

1. **Carga dossier de BD** (centros reales, ciudades, estilos, conteos).
2. **Consulta SerpApi** por la query local canónica de la landing. Captura:
   - `people_also_ask[]` → alimenta `faq_expanded`.
   - `related_searches[]` → palabras clave para el prompt.
   - `local_results.places[]` → valida nombres reales de centros.
   - `answer_box` / `featured_snippet` → señala el intent dominante.
3. **Prompt GPT-4o diferente por capa** (respeta §8.2 §8.3 §8.5).
4. **Upsert** en la tabla correspondiente.
5. **Cacheo** del `serp_data` en la fila — si se regenera el texto en < 30 días, se reutiliza sin llamar a SerpApi.

Flags: `--capa=1..5`, `--type=yoga`, `--province=madrid`, `--city=arganzuela`, `--style=vinyasa`, `--force`, `--dry-run`, `--limit=N`, `--concurrency=2`.

Coste estimado una tanda completa (266 landings): ~$1 SerpApi + ~$24 OpenAI GPT-4o = **~$25**.

### 8.9 Slugs canónicos para provincias duplicadas

Decisión revisada del 2026-04-22 **tras auditoría con `npm run seo:audit-provinces`**. La regla general: **el slug canónico es aquel donde están la mayoría de los centros reales** (no el "oficialmente más correcto"), porque queremos alinear el directorio operativo con el SEO.

| Slug canónico | Aliases (301 → canónico) | Centros netos | Notas |
|---------------|--------------------------|---------------|-------|
| `alava` | — | (sin duplicado) | |
| **`baleares`** | `islas-baleares` | 25+3=28 | "Baleares" tiene 25 centros vs 3 del oficial. Google Trends confirma que es el término más buscado en España. |
| `gipuzkoa` | `guipuzcoa` | 9+1=10 | |
| `lleida` | `lerida` | 4+1=5 | |
| `santa-cruz-de-tenerife` | `tenerife` | 21+1=22 | Provincia ≠ isla. |
| `pyrenees-atlantiques` | `pirineos-atlanticos` | 2+3=5 | Francia. Consolidar para superar R4. |

**Provincias "huérfanas" (1 centro)** que NO se consolidan pero quedan automáticamente `suppress_reason='thin_content'` por R4:
- `gironde` (Francia, 1) · `pyrenees-orientales` (Francia, 1) · `braganza` (Portugal, 1) — sus landings NO se generan ni indexan.

**Andorra** (2 centros) se mantiene como país independiente — tiene su propio intent geográfico ("yoga Andorra") y supera R4.

La consolidación se ejecuta con `scripts/consolidate-duplicate-provinces.mjs`:
- Por defecto `--dry-run` (solo muestra qué haría).
- Con `--execute` aplica los `UPDATE centers SET province = canónico` + limpia filas obsoletas de `center_type_province_seo`.
- Las redirecciones 301 de URLs viejas (`/es/centros/yoga/lerida` → `/es/centros/yoga/lleida`, etc.) se añaden a `src/middleware.ts` en una lista fija `DUPLICATE_PROVINCE_REDIRECTS`.

---

## 9. Resumen

- **Listas por destino/provincia**: ✅ Contenido editorial (intro, FAQ) generado por IA en BD, schema ItemList.
- **Landings por categoría**: ✅ `/es/retiros-yoga`, `/es/retiros-meditacion`, etc. con intro, FAQ, destinos, JSON-LD.
- **Landings categoría+destino**: ✅ `/es/retiros-yoga/ibiza` con contenido combinado, FAQ, JSON-LD.
- **Landings centros por tipo**: ✅ `/es/centros/yoga`, `/es/centros/meditacion`, `/es/centros/ayurveda` con top provincias, estilos, tips, FAQ ampliada, blog relacionado y JSON-LD `FAQPage + ItemList + BreadcrumbList`. (Redirección 308 desde `/es/centros-*` antiguas.)
- **Landings tipo+provincia**: ✅ `/es/centros/yoga/madrid` con intro única, listado, FAQ, "otras provincias", "ciudades con centros", JSON-LD.
- **Landings tipo+provincia+ciudad**: ✅ `/es/centros/yoga/madrid/getafe` (58 páginas generadas en primera ronda; umbral ≥ 2 centros).
- **Landings tipo+estilo (nacional y provincial)**: ✅ `/es/centros/yoga/estilo/vinyasa`, `/es/centros/yoga/estilo/vinyasa/barcelona`, etc. (Fase 3 #10). **18 nacionales + 44 provinciales** elegibles tras correr `npm run centers:infer-styles --min-confidence=0.7` sobre 496 centros (441 clasificados, 89 % cobertura).
- **Hub provincia**: ✅ `/es/provincias/[slug]` (Fase 3 #7) con top centros por tipo, retiros próximos, blog local y `CollectionPage + Place`. Canonical geográfico.
- **Fichas**: ✅ JSON-LD Event, LocalBusiness enriquecido (YogaStudio/HealthAndBeautyBusiness + geo + sameAs + priceRange + images + areaServed), Product, BlogPosting, BreadcrumbList.
- **Sitemap**: ✅ Completo y bilingüe, con todas las landings programáticas incluidas (estáticas + provincia + ciudad + estilos nacional/provincial + hub provincia).
- **Internal linking**: ✅ Home → categorías → destinos; breadcrumbs en todas las landings; módulos "Otras provincias con {tipo}", "Ciudades con centros", "Otros centros de {tipo} en {provincia}" y autolink de provincias en el blog (`src/lib/auto-link-geo.ts`).
- **Core Web Vitals**: ✅ `next/image` + WebP + lazy-map Leaflet (Fase 3 #13). Script `centers:covers-to-webp` para masivo.
