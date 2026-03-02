# RETIRU — Estructura de contenido y SEO para landings

Documento de referencia sobre la estructura de contenido único de las landings y cómo hacerlas atractivas para SEO.

---

## 1. Estructura actual de landings con slug

| Tipo | Ruta | Slug = | Contenido único |
|------|------|--------|-----------------|
| **Retiros por ciudad** | `/es/retiros-retiru/[slug]` | Ciudad/destino (murcia, ibiza, barcelona) | Hero + H1 + lista filtrada |
| **Centros por ciudad** | `/es/centros-retiru/[slug]` | Ciudad (madrid, barcelona, murcia) | Hero + H1 + lista filtrada |
| **Destinos** | `/es/destinos/[slug]` | Destino (ibiza, mallorca) | H1 + lista filtrada |
| **Ficha retiro** | `/es/retiro/[slug]` | Retiro individual | Galería, descripción, programa, reseñas, CTA |
| **Ficha centro** | `/es/centro/[slug]` | Centro individual | Galería, descripción, servicios, reseñas |
| **Ficha producto** | `/es/tienda/[slug]` | Producto | Detalle de producto |
| **Perfil organizador** | `/es/organizador/[slug]` | Organizador | Perfil público |
| **Artículo blog** | `/es/blog/[slug]` | Post | Contenido editorial |

---

## 2. Qué tienen hoy (SEO)

| Landing | Metadata | JSON-LD | Breadcrumb | OG image |
|---------|----------|---------|------------|----------|
| retiros-retiru/[slug] | ✅ title, description | ❌ | ❌ | ❌ |
| centros-retiru/[slug] | ✅ title, description | ❌ | ❌ | ❌ |
| destinos/[slug] | ✅ | ❌ | ❌ | ❌ |
| retiro/[slug] | ✅ title, description, keywords | ✅ Event, BreadcrumbList | ✅ visual | Dinámica |
| centro/[slug] | ✅ title, description, keywords | ❌ | ❌ | ❌ |
| tienda/[slug] | ✅ dinámica | ❌ | ❌ | ❌ |
| blog/[slug] | ✅ dinámica | ❌ | ❌ | ❌ |

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
| retiros-retiru/[slug] | `ItemList` (lista de retiros) + `CollectionPage` | Pendiente |
| centros-retiru/[slug] | `ItemList` (lista de centros) + `CollectionPage` | Pendiente |
| destinos/[slug] | `ItemList` + `Place` (si el destino es un lugar) | Pendiente |
| retiro/[slug] | `Event` + `BreadcrumbList` | ✅ Implementado |
| centro/[slug] | `LocalBusiness` / `HealthAndBeautyBusiness` | Pendiente |
| tienda/[slug] | `Product` | Pendiente |
| blog/[slug] | `Article` | Pendiente |

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
- `alternates` en metadata (ya implementado en `generatePageMetadata`).

### F. Internal linking

- Desde listas: enlaces a fichas individuales.
- Desde fichas: "Más retiros en [destino]", "Centros en [ciudad]".
- Desde blog: enlaces a retiros y centros relacionados.

---

## 5. Prioridades de implementación

1. ~~**Crítico**: `generateMetadata` en destinos/[slug]~~ ✅ Hecho.
2. ~~**Alto**: JSON-LD Event + Breadcrumb en retiro/[slug]~~ ✅ Hecho.
3. **Alto**: JSON-LD LocalBusiness en centro/[slug].
4. **Alto**: Párrafo introductorio por ciudad en retiros-retiru y centros-retiru.
5. **Medio**: JSON-LD ItemList en listas por ciudad.
6. **Medio**: FAQ por destino + schema FAQPage.
7. **Medio**: OG images dinámicas por centro (retiro ya tiene).
8. **Bajo**: JSON-LD Article en blog.

---

## 6. Fuentes de contenido único

Para no duplicar contenido entre landings:

- **BD**: tabla `destinations` o `cities` con campos `seo_title`, `seo_description`, `intro_text`, `faq_json`.
- **CMS**: si se usa un CMS, gestionar textos por destino.
- **Archivos**: `content/destinos/[slug].md` con frontmatter (title, description, intro, faq).

---

## 7. Resumen

- **Listas**: filtran por BD pero necesitan contenido editorial único (intro, FAQ, tips) y schema ItemList.
- **Fichas**: retiros y centros tienen buen contenido; falta JSON-LD y OG dinámico.
- **Destinos**: sin metadata y sin contenido único; prioridad alta.
- **Blog**: contenido editorial; falta schema Article y metadata por artículo.
