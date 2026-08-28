# RETIRU — Rutas y estructura de URLs

Documentación de la arquitectura de rutas y landings.

---

## ⚠️ Patrón de rewrites del middleware (URL pública ≠ carpeta App Router)

Para tres familias de rutas, **la URL pública NO coincide con la carpeta del App Router**. El usuario y Google ven la URL bonita, pero internamente Next sirve el `page.tsx` desde otra carpeta. Esto se resuelve en `src/middleware.ts` con `NextResponse.rewrite()` (transparente, sin redirect).

| URL pública (lo que ven usuarios y sitemap) | Carpeta interna (App Router) | Por qué |
|---|---|---|
| `/es/retiros-retiru` y `/es/retiros-retiru/[slug]` | `(public)/es/destino-retiros/` y `…/[slug]/` | Si la carpeta literal `retiros-retiru/` viviese al lado de la dinámica `retiros-[category]/`, **Next 14 da 500** (colisión App Router). |
| `/es/retiros-[category]` y `/es/retiros-[category]/[destination]` | `(public)/es/cat-retiros/[category]/` (+ `[destination]/`) | Misma razón: el segmento dinámico hermano `retiros-retiru` (literal) provoca 404 al matchear el dinámico `retiros-[category]` en Next 14. Renombrando a `cat-retiros/[category]` desaparece la colisión. |
| `/es/retiros-en/[slug]` | `(public)/es/geo-retiros/[slug]/` | Mismo prefijo `retiros-` que la dinámica `retiros-[category]`. Para evitar el match ambiguo se sirve desde `geo-retiros/[slug]`. Esta página usa `export const dynamic = 'force-dynamic'` (combina cookies del layout + jerarquía geográfica al vuelo). |

Equivalente EN exactamente igual:

- `/en/retreats-retiru(/[slug])` → `(public)/en/destination-retreats/...`
- `/en/retreats-[category](/[destination])` → `(public)/en/cat-retreats/[category]/...`
- `/en/retreats-in/[slug]` → `(public)/en/geo-retreats/[slug]/`

**Reglas de oro (no romper esto):**

1. Las URLs públicas (sitemap, links internos, canonicals, alternates, JSON-LD, redirects, …) deben seguir siendo `retiros-retiru/...`, `retiros-yoga/ibiza`, `retiros-en/...`. No publicar nunca `cat-retiros`, `destino-retiros` ni `geo-retiros` hacia fuera.
2. Los `Link href=` y `redirect()` también pueden seguir apuntando a la URL pública: el middleware reescribe igualmente.
3. Si añades nuevas rutas con prefijo `retiros-XXX` (ES) o `retreats-XXX` (EN), o tocas las que ya están, revisa primero estos rewrites en `src/middleware.ts` — el orden importa: más específico → más genérico.
4. En `PUBLIC_PATHS` (mismo archivo) deben aparecer las **carpetas internas** (`/es/cat-retiros`, `/es/destino-retiros`, `/es/geo-retiros`, …) para que el middleware de auth no las trate como protegidas.

---

## Rutas públicas (ES)

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/es` | `src/app/(public)/es/page.tsx` | Home: tres caminos (centros + clases/actividades de 1 día + retiros multi-día); bloques separados vía `durationKind` |
| `/es/buscar` | `src/app/(public)/es/buscar/page.tsx` | Buscador general (retiros + centros) |
| `/es/retiros-retiru` | `src/app/(public)/es/destino-retiros/page.tsx` (vía rewrite del middleware) | Lista experiencias (`getPublishedRetreats`: publicados, `start_date > hoy`, `end_date ≥ hoy`). Filtro UX `?formato=clases` (`duration_days = 1`) / `?formato=retiros` (`duration_days > 1`); EN: `?format=classes` / `?format=retreats` |
| `/es/retiros-retiru/[slug]` | `src/app/(public)/es/destino-retiros/[slug]/page.tsx` (vía rewrite del middleware) | Eventos por `destinations.slug`: admite **hoja** (ciudad) o nivel superior (**provincia / CCAA / país**). Mismo filtro de formato. Los retiros se enlazan a destinos hoja; el listado agrega todos los descendientes vía `getLeafDestinationIdsForRetreatFilter` en `getPublishedRetreats`. |
| `/es/retiro/[slug]` | `src/app/(public)/es/retiro/[slug]/page.tsx` | Ficha de retiro (galería `retreat_images` → breadcrumb → contenido + sidebar reserva; mismo patrón visual que centro). Sigue accesible por URL directa aunque el evento ya haya empezado; los **listados** no muestran retiros en curso. |
| `/es/centros-retiru` | `src/app/(public)/es/centros-retiru/page.tsx` | **Mapa** de centros (Leaflet + MapTiler). No crear `/es/mapa`. Móvil: Filtros y Lugares suben hoja; Mapa solo cierra. `DirectoryMapView` + `DirectoryLeafletMap`. |
| `/es/centros-retiru/[slug]` | `src/app/(public)/es/centros-retiru/[slug]/page.tsx` | Landing SEO (listado por provincia/ciudad). **No** es el hub-mapa. |
| `/es/centro/[slug]` | `src/app/(public)/es/centro/[slug]/page.tsx` | Ficha de centro (galería → breadcrumb → contenido + contacto / mapa) |
| `/es/destinos` | `src/app/(public)/es/destinos/page.tsx` | Destinos |
| `/es/destinos/[slug]` | `src/app/(public)/es/destinos/[slug]/page.tsx` | Destino por slug |
| `/es/organizador/[slug]` | `src/app/(public)/es/organizador/[slug]/page.tsx` | Perfil organizador |
| `/es/para-asistentes` | `src/app/(public)/es/para-asistentes/page.tsx` | Para asistentes: experiencias de bienestar (clases, actividades, retiros), garantías, pago seguro |
| `/es/para-organizadores` | `src/app/(public)/es/para-organizadores/page.tsx` | Para centros, organizadores y profesores (clases): onboarding con CTAs altos |
| `/es/tienda` | `src/app/(public)/es/tienda/page.tsx` | Tienda (`shop_products`); si no hay productos, encuesta `ProductInterestSurvey` → `shop_product_interests` |
| `/es/tienda/[slug]` | `src/app/(public)/es/tienda/[slug]/page.tsx` | Ficha de producto |
| `/es/blog` | `src/app/(public)/es/blog/page.tsx` | Blog (`?q=` búsqueda por título/resumen, `?categoria=` slug categoría). **Editorial:** `docs/BLOG-EDITORIAL.md` |
| `/es/blog/[slug]` | `src/app/(public)/es/blog/[slug]/page.tsx` | Artículo de blog (contenido informativo; cola en `docs/BLOG-TITULOS-PROPUESTOS.md`) |
| `/es/sobre-nosotros` | `src/app/(public)/es/sobre-nosotros/page.tsx` | Sobre nosotros |
| `/es/ayuda` | `src/app/(public)/es/ayuda/page.tsx` | Centro de ayuda (FAQs) |
| `/es/contacto` | `src/app/(public)/es/contacto/page.tsx` | Contacto (CTA «Iniciar chat» abre `SupportChatWidget` vía evento `retiru:open-support-chat`) |
| `/es/condiciones` | `src/app/(public)/es/condiciones/page.tsx` | Condiciones de uso y precios + tarjetas a los tres acuerdos contractuales |
| `/es/legal/terminos` | `src/app/(public)/es/legal/terminos/page.tsx` | Términos legales generales del visitante/usuario web |
| `/es/legal/contrato-organizador` | `src/app/(public)/es/legal/contrato-organizador/page.tsx` | Contrato del organizador (12 cláusulas, fuente única `src/lib/legal/organizer-contract.tsx`) |
| `/es/legal/contrato-centro` | `src/app/(public)/es/legal/contrato-centro/page.tsx` | Contrato del centro del directorio (cláusulas en `src/lib/legal/center-contract.tsx`, borrador 0.1) |
| `/es/legal/privacidad` | `src/app/(public)/es/legal/privacidad/page.tsx` | Política de privacidad |
| `/es/legal/cookies` | `src/app/(public)/es/legal/cookies/page.tsx` | Política de cookies |
| `/es/retiros-[category]` | `src/app/(public)/es/cat-retiros/[category]/page.tsx` (vía rewrite del middleware) | Landing SEO por categoría de retiro (ej. `/es/retiros-yoga`) |
| `/es/retiros-[category]/[destination]` | `src/app/(public)/es/cat-retiros/[category]/[destination]/page.tsx` (vía rewrite del middleware) | Categoría + destino |
| `/es/retiros-en/[slug]` | `src/app/(public)/es/geo-retiros/[slug]/page.tsx` (vía rewrite del middleware; `force-dynamic`) | Landing geográfica jerárquica (país / CCAA / provincia) |
| `/es/centros/[tipo]` | `src/app/(public)/es/centros/[tipo]/page.tsx` | Centros por tipo (`yoga` / `meditacion` / `ayurveda` en URL ES) |
| `/es/centros/[tipo]/[provincia]` | `src/app/(public)/es/centros/[tipo]/[provincia]/page.tsx` | Tipo + provincia |
| `/es/centros/[tipo]/[provincia]/[ciudad]` | `src/app/(public)/es/centros/[tipo]/[provincia]/[ciudad]/page.tsx` | Tipo + provincia + ciudad (long-tail; umbral ≥ 2 centros) |
| `/es/centros/[tipo]/estilo/[estilo]` | `src/app/(public)/es/centros/[tipo]/estilo/[estilo]/page.tsx` | Centros por tipo + **estilo** (nacional). Umbral ≥ 3 centros. `dynamic = 'force-dynamic'` |
| `/es/centros/[tipo]/estilo/[estilo]/[provincia]` | `src/app/(public)/es/centros/[tipo]/estilo/[estilo]/[provincia]/page.tsx` | Tipo + estilo + provincia. Umbral ≥ 5 centros. `dynamic = 'force-dynamic'` |
| `/es/provincias/[slug]` | `src/app/(public)/es/provincias/[slug]/page.tsx` | **Redirect 301** → `/es/centros/{tipo-dominante}/{slug}`. Hub descartado 2026-04-22 (§8.1 SEO-LANDINGS.md). |

---

## Rutas públicas (EN)

| Ruta | Archivo |
|------|---------|
| `/en` | `src/app/(public)/en/page.tsx` |
| `/en/search` | `src/app/(public)/en/search/page.tsx` |
| `/en/retreats-retiru` | `src/app/(public)/en/destination-retreats/page.tsx` (vía rewrite del middleware) |
| `/en/retreats-retiru/[slug]` | `src/app/(public)/en/destination-retreats/[slug]/page.tsx` (vía rewrite del middleware) |
| `/en/retreat/[slug]` | `src/app/(public)/en/retreat/[slug]/page.tsx` |
| `/en/centers-retiru` | `src/app/(public)/en/centers-retiru/page.tsx` (mapa; mismo `DirectoryMapView` que ES) |
| `/en/centers-retiru/[slug]` | `src/app/(public)/en/centers-retiru/[slug]/page.tsx` |
| `/en/center/[slug]` | `src/app/(public)/en/center/[slug]/page.tsx` |
| `/en/destinations` | `src/app/(public)/en/destinations/page.tsx` |
| `/en/destinations/[slug]` | `src/app/(public)/en/destinations/[slug]/page.tsx` |
| `/en/organizer/[slug]` | `src/app/(public)/en/organizer/[slug]/page.tsx` |
| `/en/for-attendees` | `src/app/(public)/en/for-attendees/page.tsx` |
| `/en/for-organizers` | `src/app/(public)/en/for-organizers/page.tsx` |
| `/en/retreats-[category]` | `src/app/(public)/en/cat-retreats/[category]/page.tsx` (vía rewrite del middleware) |
| `/en/retreats-[category]/[destination]` | `src/app/(public)/en/cat-retreats/[category]/[destination]/page.tsx` (vía rewrite del middleware) |
| `/en/retreats-in/[slug]` | `src/app/(public)/en/geo-retreats/[slug]/page.tsx` (vía rewrite del middleware; `force-dynamic`) |
| `/en/centers/[type]` | `src/app/(public)/en/centers/[type]/page.tsx` |
| `/en/centers/[type]/[province]` | `src/app/(public)/en/centers/[type]/[province]/page.tsx` |
| `/en/centers/[type]/[province]/[city]` | `src/app/(public)/en/centers/[type]/[province]/[city]/page.tsx` |
| `/en/centers/[type]/style/[style]` | `src/app/(public)/en/centers/[type]/style/[style]/page.tsx` |
| `/en/centers/[type]/style/[style]/[province]` | `src/app/(public)/en/centers/[type]/style/[style]/[province]/page.tsx` |
| `/en/provinces/[slug]` | `src/app/(public)/en/provinces/[slug]/page.tsx` — **Redirect 301** → `/en/centers/{type}/{slug}`. Deprecated 2026-04-22. |
| `/en/shop` | `src/app/(public)/en/shop/page.tsx` — misma lógica que `/es/tienda` (encuesta si no hay productos) |
| `/en/shop/[slug]` | `src/app/(public)/en/shop/[slug]/page.tsx` |
| `/en/blog` | `src/app/(public)/en/blog/page.tsx` — listado; `?q=` búsqueda, `?category=` slug |
| `/en/blog/[slug]` | `src/app/(public)/en/blog/[slug]/page.tsx` |
| `/en/about` | `src/app/(public)/en/about/page.tsx` |
| `/en/help` | `src/app/(public)/en/help/page.tsx` |
| `/en/contact` | `src/app/(public)/en/contact/page.tsx` — CTA «Start chat» abre el widget de soporte (`retiru:open-support-chat`) |
| `/en/condiciones` | `src/app/(public)/en/condiciones/page.tsx` |
| `/en/legal/terminos` | `src/app/(public)/en/legal/terminos/page.tsx` |
| `/en/legal/contrato-organizador` | `src/app/(public)/en/legal/contrato-organizador/page.tsx` |
| `/en/legal/contrato-centro` | `src/app/(public)/en/legal/contrato-centro/page.tsx` |
| `/en/legal/privacidad` | `src/app/(public)/en/legal/privacidad/page.tsx` |
| `/en/legal/cookies` | `src/app/(public)/en/legal/cookies/page.tsx` |

---

## Idiomas del producto

Retiru solo publica contenido en **español** e **inglés**. Ver regla completa en `README.md` → **Idiomas del producto**.

**Importante para quien edita contenido o usa un agente de IA:** el idioma del chat (hebreo, chino, etc.) no determina el idioma del copy. Un artículo de blog, una ficha de retiro o un texto de landing se redactan en **es/en** según la ruta o el campo (`description_es`, `title_en`, …), no en el idioma de quien pide el cambio.

---

## Selector de idioma (header / footer)

El enlace **English / Español** no apunta solo a la home: calcula la ruta equivalente (`src/lib/locale-path.ts`), p. ej. `/es/blog` → `/en/blog`, `/es/centro/foo` → `/en/center/foo`, `/es/centros/yoga` → `/en/centers/yoga`, `/es/centros/meditacion` → `/en/centers/meditation`.

- **Artículos del blog** con `slug` distinto de `slug_en`: se consulta `GET /api/blog/alternate-path?path=…` para enlazar a la URL canónica del otro idioma.
- **Área de cuenta** (`/es/perfil`, `/es/mis-*`, `/es/mensajes`, `/es/facturas`…): al pasar a inglés se redirige a **`/en`** (esas rutas solo existen en español).
- **Panel organizador** (`/es/panel/...` ↔ `/en/panel/...`): mismas rutas en ambos idiomas (dashboard, eventos, asistentes, mensajes, etc.). El selector ES/EN enlaza a la ruta equivalente.
- El enlace usa **`<a href>`** (navegación completa) para que el documento se regenere con el `<html lang>` correcto y sin estado cliente obsoleto. Además, `PublicShell` sincroniza `document.documentElement.lang` en cambios de ruta por `next/link`.

---

## Autenticación

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/es/login` | `src/app/(public)/es/(auth)/login/page.tsx` | Inicio de sesión (solo email/contraseña) |
| `/es/registro` | `src/app/(public)/es/(auth)/registro/page.tsx` | Registro (solo email, sin Google OAuth) |
| `/en/login` | `src/app/(public)/en/(auth)/login/page.tsx` | Login (EN) |
| `/en/register` | `src/app/(public)/en/(auth)/register/page.tsx` | Register (EN) |

Parámetros opcionales en registro: `?redirect=/ruta&claim=true` (redirige tras registro y contextualiza para reclamar centro).

---

## Dashboard de usuario (requiere login)

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/es/mis-reservas` | `src/app/(public)/es/(dashboard)/mis-reservas/page.tsx` | Reservas como asistente; en eventos periódicos con reserva activa, botón «Ampliar o modificar inscripción» (calendario de la serie) |
| `/es/mensajes` | `src/app/(public)/es/(dashboard)/mensajes/page.tsx` | Bandeja de mensajes (+ botón soporte) |
| `/es/mensajes/[id]` | `src/app/(public)/es/(dashboard)/mensajes/[id]/page.tsx` | Conversación individual (chat / soporte) |
| `/es/perfil` | `src/app/(public)/es/(dashboard)/perfil/page.tsx` | Datos personales desde `profiles` (Supabase); guardar vía `PATCH /api/profile` |
| `/es/mis-centros` | `src/app/(public)/es/(dashboard)/mis-centros/page.tsx` | Centros reclamados, propuestas pendientes, reclamar / proponer nuevo. Al proponer centro, el modal exige descripción, actividades/servicios y portada manual desde dispositivo o portada generada con IA. |
| `/es/mis-eventos` | `src/app/(public)/es/(dashboard)/mis-eventos/page.tsx` | Eventos/retiros creados (contrato + banner de verificación si aplica) |
| `/es/mis-eventos/nuevo` | `src/app/(public)/es/(dashboard)/mis-eventos/nuevo/page.tsx` | Wizard crear evento (TinyMCE descripción, portada + hasta 8 fotos, RLS `retreat-images`) |
| `/es/mis-eventos/[id]` | `src/app/(public)/es/(dashboard)/mis-eventos/[id]/page.tsx` | Editar evento |
| `/es/mis-eventos/verificacion` | `src/app/(public)/es/(dashboard)/mis-eventos/verificacion/page.tsx` | Pasos KYC organizador + subida a `organizer-docs` |
| `/es/panel` | `src/app/(public)/es/(organizer)/panel/page.tsx` | Dashboard organizador |
| `/es/panel/eventos` | `src/app/(public)/es/(organizer)/panel/eventos/page.tsx` | Lista de retiros (contrato si aplica) |
| `/es/panel/eventos/nuevo` | `src/app/(public)/es/(organizer)/panel/eventos/nuevo/page.tsx` | Wizard nuevo retiro (si no hay `contract_accepted_at`, redirección a `/es/panel/eventos` para el contrato) |
| `/es/panel/eventos/[id]` | `src/app/(public)/es/(organizer)/panel/eventos/[id]/page.tsx` | Editar retiro |
| `/es/panel/eventos/[id]/reservas` | `src/app/(public)/es/(organizer)/panel/eventos/[id]/reservas/page.tsx` | Reservas del retiro |
| `/es/panel/eventos/[id]/checkin` | `src/app/(public)/es/(organizer)/panel/eventos/[id]/checkin/page.tsx` | Check-in |
| `/es/panel/asistentes` | `src/app/(public)/es/(organizer)/panel/asistentes/page.tsx` | Asistentes |
| `/es/panel/mensajes` | `src/app/(public)/es/(organizer)/panel/mensajes/page.tsx` | Mensajes del organizador (+ soporte) |
| `/es/panel/resenas` | `src/app/(public)/es/(organizer)/panel/resenas/page.tsx` | Reseñas |
| `/es/panel/analiticas` | `src/app/(public)/es/(organizer)/panel/analiticas/page.tsx` | Analíticas |
| `/es/panel/verificacion` | `src/app/(public)/es/(organizer)/panel/verificacion/page.tsx` | Verificación KYC (`VerificacionClient`) |
| `/es/panel/configuracion` | `src/app/(public)/es/(organizer)/panel/configuracion/page.tsx` | Configuración perfil organizador |

**Panel EN (mismo árbol):** `src/app/(public)/en/(organizer)/panel/` — `/en/panel`, `/en/panel/eventos`, `…/nuevo`, `…/[id]`, `…/reservas`, `…/checkin`, `asistentes`, `mensajes`, `resenas`, `analiticas`, `verificacion`, `configuracion`. Asistentes y mensajes reutilizan la página ES; el resto tiene UI en inglés donde aplica.

Cualquier usuario logueado (incluido admin) accede a estas secciones desde el menú de usuario.

---

## Rutas de claim (reclamar centro)

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/es/reclamar/[token]` | `src/app/(public)/es/reclamar/[token]/page.tsx` | Link mágico de email |
| `/en/claim/[token]` | `src/app/(public)/en/claim/[token]/page.tsx` | Magic link (EN) |

---

## Slug = ciudad o identificador

- **retiros-retiru/[slug]** / **retreats-retiru/[slug]**: slug = ciudad/destino (murcia, barcelona, ibiza, etc.)
- **centros-retiru/[slug]** / **centers-retiru/[slug]**: slug = ciudad (murcia, madrid, barcelona, etc.)
- **centro/[slug]** / **center/[slug]**: slug = identificador del centro (yoga-sala-madrid, spa-termal-murcia, etc.)
- **retiro/[slug]** / **retreat/[slug]**: slug = identificador del retiro
- **organizador/[slug]** / **organizer/[slug]**: slug = identificador del organizador

### Fichas de detalle (retiro y centro) — layout público

- **Orden:** imágenes (portada + galería) **primero**; **breadcrumb de texto debajo** (ancho completo del `container-wide`, separador `›`), **no** encima de la imagen; después título, metadatos y cuerpo.
- **Fondo:** bloque de fotos sobre `bg-background` (misma base que el `body`), sin franja de color distinta en el hero de la ficha de retiro (alineado con la ficha de centro).
- **Implementación:** `es/retiro/[slug]/page.tsx`, `en/retreat/[slug]/page.tsx`, `es/centro/[slug]/page.tsx`, `en/center/[slug]/page.tsx`.

---

## Landings SEO programáticas (implementadas)

### Retiros por categoría (ES / EN)

| Ruta ES | Ruta EN | Descripción |
|---------|---------|-------------|
| `/es/retiros-[category]` | `/en/retreats-[category]` | Índice de retiros por categoría (yoga, meditacion, ayurveda, etc.) |
| `/es/retiros-[category]/[destination]` | `/en/retreats-[category]/[destination]` | Retiros de categoría en destino específico |

Categorías disponibles: yoga, meditacion, ayurveda, detox, naturaleza, gastronomia, wellness, aventura, silencio, arte-creatividad, desarrollo-personal.

Slug EN equivalente: yoga, meditation, ayurveda, detox, nature, gastronomy, wellness, adventure, silent, art-creativity, personal-growth.

### Centros por tipo (ES / EN)

| Ruta ES | Ruta EN | Descripción | Umbral SSG |
|---------|---------|-------------|------------|
| `/es/centros/[tipo]` | `/en/centers/[type]` | Índice de centros por tipo (yoga, meditacion, ayurveda) | Siempre (3 tipos) |
| `/es/centros/[tipo]/[provincia]` | `/en/centers/[type]/[province]` | Centros de tipo en provincia específica | ≥ 1 centro |
| `/es/centros/[tipo]/[provincia]/[ciudad]` | `/en/centers/[type]/[province]/[city]` | Tipo + provincia + ciudad (long-tail) | ≥ 2 centros |
| `/es/centros/[tipo]/estilo/[estilo]` | `/en/centers/[type]/style/[style]` | Centros por tipo y **estilo** (Ashtanga, Kundalini, Vinyasa…) nacional | ≥ 3 centros totales |
| `/es/centros/[tipo]/estilo/[estilo]/[provincia]` | `/en/centers/[type]/style/[style]/[province]` | Tipo + estilo + provincia | ≥ 5 centros en la provincia |

Tipos ES: yoga, meditacion, ayurveda. Tipos EN (= BD): yoga, meditation, ayurveda.

**Estilos disponibles (catálogo `styles`, seed en migración 044):**
- Yoga: `kundalini`, `vinyasa`, `hatha`, `iyengar`, `ashtanga`, `yin`, `restorative`, `aereo`, `prenatal`, `power`, `nidra`, `bikram`.
- Meditación: `mindfulness`, `vipassana`, `zen`, `trascendental`, `metta`.
- Ayurveda: `panchakarma`, `marma`, `shirodhara`, `abhyanga`.

La asignación centro↔estilo vive en la tabla puente `center_styles` (many-to-many; trigger `check_center_style_type_match` valida que `styles.center_type = centers.type`). Inferencia automática con GPT-4o-mini vía `npm run centers:infer-styles`.

**Nota técnica:** las 4 páginas de estilo y la landing geográfica `geo-retiros/[slug]` (rewrite de `/es/retiros-en/[slug]`) usan `export const dynamic = 'force-dynamic'` (no ISR): el layout padre `(public)/layout.tsx` llama a `cookies()` vía `getCurrentUserForHeader`, lo que causaba errores `DYNAMIC_SERVER_USAGE` cuando Next 14 intentaba pre-renderizar estas páginas con `revalidate`. SSR puro + caché de Supabase anon es suficiente.

**SEO Cap. 4:** contenido opcional en `style_province_seo` (migración 045). Solo deben existir filas para URLs que responden **200** (≥5 centros); mantener con `npm run seo:prune-style-province`. La ruta provincial renderiza `SeoSections` si hay `sections_es`. URL ES de meditación: segmento **`meditacion`**, no `meditation`.

> Las landings de categoría (`cat-retiros/[category]`, `cat-retreats/[category]`) sí siguen con `revalidate = 3600` + `generateStaticParams` (entran en SSG/ISR sin colisiones porque su carpeta ya no comparte prefijo con las literales `retiros-retiru` / `retiros-en` — ese fue el motivo del rewrite).

### ~~Hub geográfico provincial (ES / EN)~~ — DESCARTADO 2026-04-22

| Ruta ES | Ruta EN | Estado |
|---------|---------|--------|
| `/es/provincias/[slug]` | `/en/provinces/[slug]` | **Redirect 301** → `/es/centros/{tipo-dominante}/{slug}` / `/en/centers/{type}/{slug}`. Descartado por canibalización con Cap. 3 (Tipo × Provincia). Ver §8.1 SEO-LANDINGS.md. |

Flujo actual: `/es/centros-retiru/[slug-provincia]` → redirect 301 directo a `/es/centros/{tipo}/{slug}` (bypassing `/es/provincias/`).

### Generación de contenido

Contenido único por categoría y destino generado con IA y almacenado en BD (tablas `categories` y `destinations`): `intro_es`, `intro_en`, `meta_title_*`, `meta_description_*`, `faq` (JSONB).

**Contenido en BD:** intros, meta y FAQ por categoría y destino (`scripts/generate-seo-content.mjs`; flags `--categories`, `--destinations`, `--force`). Migraciones `028_categories_seo_fields.sql`, `029_destinations_meta_seo.sql`.

Las URLs concretas salen de slugs en BD (categorías con retiros, destinos, provincias con centros por tipo).

---

## Componentes de búsqueda

| Componente | Uso | Campos |
|------------|-----|--------|
| `HeroSearch` | Home | Toggle Centros / Retiros y clases + campos según modo |
| `EventosSearch` | retiros-retiru, retiros-retiru/[slug] | Texto, destino, fechas (el filtro de formato vive en `EventosClient`) |
| `CentrosSearch` | centros-retiru, centros-retiru/[slug] | Texto, tipo, ciudad |

---

## Valoraciones en listados de retiros

En **cards** de retiros/clases (home bloques «Clases y actividades» y «Retiros populares», `/es/retiros-retiru`, `/es/retiros-retiru/[slug]`, `/es/buscar` cuando el ítem es retiro, equivalentes EN, y componentes `EventCard` / `event-card` si se usan en listados):

- Lo que se muestra como estrellas + contador es la **media y el número de reseñas del organizador** (`organizer_profiles`, derivado de `reviews` por `organizer_id`), no el agregado del retiro concreto.
- Si el organizador **no tiene** reseñas visibles, **no** se renderiza el bloque de valoración (evita mostrar `0.0 (0)`).

En la **ficha** `/es/retiro/[slug]` (y EN): el bloque principal de opiniones corresponde a reseñas del **retiro**; la valoración del organizador se muestra **por separado** (p. ej. en la zona del organizador).

Código de referencia: `getOrganizerReviewStats`, `organizerHasRatingToShow` en `src/lib/utils/index.ts`; listados consumen `organizer` incluido en el `select` de `getPublishedRetreats` (`src/lib/data/index.ts`).

---

## Carpetas en `src/app/(public)/es`

### Público principal

| Carpeta | URL pública | Contenido |
|---------|-------------|-----------|
| `destino-retiros/` (rewrite desde `retiros-retiru`) | `/es/retiros-retiru` y `/es/retiros-retiru/[slug]` | Lista global y por destino, `EventosClient` |
| `cat-retiros/[category]/` (rewrite desde `retiros-[category]`) | `/es/retiros-yoga`, `/es/retiros-yoga/ibiza`, … | Landing por categoría + `[destination]/` |
| `geo-retiros/[slug]/` (rewrite desde `retiros-en`) | `/es/retiros-en/[slug]` | Landing geográfica jerárquica país/CCAA/provincia (`force-dynamic`) |
| `centros-retiru/` | `/es/centros-retiru` y `…/[slug]` | Directorio, `[slug]/` por provincia |
| `centros/[tipo]/` | Por tipo BD (URL ES `meditacion` ↔ BD `meditation`) + `[provincia]/` |
| `retiro/[slug]/` | Ficha retiro (galería → breadcrumb → contenido + sidebar) |
| `centro/[slug]/` | Ficha centro (galería → breadcrumb → contenido + sidebar) |
| `buscar/` | Buscador unificado |
| `destinos/` | Destinos + `[slug]` |
| `organizador/[slug]/` | Perfil organizador |
| `para-asistentes/` | Experiencias de bienestar (clases, actividades, retiros) + garantías |
| `para-organizadores/` | Centros, organizadores y profesores (clases) |
| `tienda/` | Listado + `[slug]` ficha producto (`shop_products`) |
| `blog/` | Blog + `[slug]` |
| `legal/` | Términos, privacidad, cookies |
| `sobre-nosotros/`, `contacto/`, `ayuda/`, `condiciones/` | Estáticas |

### Landings dinámicas (implementadas)

- **Retiros por categoría:** `/es/retiros-yoga`, `/es/retiros-meditacion/ibiza`, etc. → carpeta interna **`cat-retiros/[category](/[destination])`** servida via rewrite del middleware. Ver tabla "Patrón de rewrites del middleware" arriba.
- **Retiros por destino (lista raíz y por slug):** `/es/retiros-retiru`, `/es/retiros-retiru/murcia`, … → carpeta interna **`destino-retiros/(/[slug])`** vía rewrite.
- **Landing geográfica (país/CCAA/provincia):** `/es/retiros-en/[slug]` → carpeta interna **`geo-retiros/[slug]`** vía rewrite. `force-dynamic`.
- **Centros por tipo:** canónicas **`/es/centros/yoga`**, **`/es/centros/meditacion/madrid`**, etc. → carpeta **`centros/[tipo]`**. Las URLs antiguas con guión (`/es/centros-yoga`, …) redirigen **308** a la forma con barra (`next.config.js`).

Ver tablas arriba y `docs/SEO-LANDINGS.md`.

---

## Panel de administrador (protegido; rol `admin` en `user_roles`)

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/administrator` | `src/app/administrator/page.tsx` | Dashboard admin |
| `/administrator/usuarios` | `src/app/administrator/usuarios/page.tsx` | Gestión usuarios (`user_roles` en UI) + Mensaje → soporte |
| `/administrator/organizadores` | `src/app/administrator/organizadores/page.tsx` | Gestión organizadores + enlace a verificación |
| `/administrator/organizadores/[id]/verificar` | `src/app/administrator/organizadores/[id]/verificar/page.tsx` | Revisar pasos KYC y documentos (`organizer_verification_steps`, signed URLs) |
| `/administrator/retiros` | `src/app/administrator/retiros/page.tsx` | Aprobar/rechazar (moderación IA opcional si `ANTHROPIC_API_KEY`), filtros por estado visual |
| `/administrator/retiros/[id]/editar` | `src/app/administrator/retiros/[id]/editar/page.tsx` | Editar retiro (admin) |
| `/administrator/centros` | `src/app/administrator/centros/page.tsx` | Gestión centros |
| `/administrator/claims` | `src/app/administrator/claims/page.tsx` | Gestión claims de centros |
| `/administrator/mensajes` | `src/app/administrator/mensajes/page.tsx` | Moderación + soporte (`?open=convId`) |
| `/administrator/mails` | `src/app/administrator/mails/page.tsx` | CRM de campañas de mailing (listado + crear) |
| `/administrator/mails/nueva` | `src/app/administrator/mails/nueva/page.tsx` | Crear campaña en borrador (subject/slug/descripción) |
| `/administrator/mails/[slug]` | `src/app/administrator/mails/[slug]/page.tsx` | Detalle: pestañas Contenido (gen. con IA), Preview, Audiencia, Envío |
| `/administrator/mails/bajas` | `src/app/administrator/mails/bajas/page.tsx` | Panel de bajas de marketing: listado de `email_suppressions`, búsqueda, alta manual y revertir baja |
| `/administrator/blog` | `src/app/administrator/blog/page.tsx` | Gestión blog |
| `/administrator/tienda` | `src/app/administrator/tienda/page.tsx` | Productos + resultados encuesta (`docs/SHOP-SURVEY.md`) |
| `/administrator/reembolsos` | `src/app/administrator/reembolsos/page.tsx` | Reembolsos |
| `/administrator/reporting` | `src/app/administrator/reporting/page.tsx` | Reporting y métricas |

Protegido por middleware y comprobación de admin. No indexado en buscadores.

---

## API endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/centers/claim` | Reclamar un centro (auto-aprueba si email coincide) |
| POST | `/api/centers/propose` | Proponer centro nuevo desde Google Maps (queda `pending_review`; usuario autenticado). Requiere descripción, `services_es` e imagen: `cover_url` generada con IA o `cover_upload` manual; puede añadir `images_uploads`. |
| GET | `/api/admin/center-claims` | Listar claims (admin) |
| POST | `/api/admin/center-claims` | Aprobar/rechazar claim (admin) |
| POST | `/api/admin/retreats` | Aprobar, rechazar, cancelar, archivar o eliminar retiro (admin) |
| POST | `/api/admin/retreats/moderate` | Moderación IA de texto/precios (admin; opcional sin `ANTHROPIC_API_KEY`) |
| PATCH | `/api/admin/retreats/[id]` | Editar retiro (admin) |
| GET | `/api/admin/organizers/[id]` | Detalle organizador para admin (verificación) |
| POST | `/api/admin/organizers/[id]` | Aprobar/rechazar pasos de verificación u operaciones de revisión (admin) |
| GET | `/api/admin/organizers/[id]/doc-url` | URL firmada temporal para documento en `organizer-docs` |
| POST | `/api/retreats/create` | Crear retiro (auto-crea organizer_profile) |
| POST | `/api/retreats/generate-cover-image` | Portada IA: cuerpo con **briefing completo** del evento (textos, destino, fechas, categorías, programa, incluidos…); **gpt-5.6-terra** genera un único párrafo-prompt en español; **gpt-image-2** genera la imagen (`1536x1024`, `high`); usuario autenticado; `OPENAI_API_KEY`; bucket `retreat-images` |
| POST | `/api/admin/blog/generate-cover-image` | Portada IA de artículo de blog (solo admin): título, extracto, contenido, categoría; mismo agente gpt-5.6-terra ×2 + gpt-image-2; bucket `retreat-images` (`blog/ai-cover-*`) |
| POST | `/api/centers/generate-cover-image` | Portada IA de centro (propietario reclamado o admin; también prealta sin `center_id`): nombre, descripción, tipo, ubicación, servicios; mismo agente; bucket `centers` (`{centerId}/ai-cover-*` o `generated/ai-cover-*`) |
| PATCH | `/api/retreats/[id]` | Actualizar retiro (solo propietario) |
| POST | `/api/retreats/[id]` | Cancelar retiro (propietario, action=cancel): marca reservas activas —incl. `reserved_no_payment`— como `cancelled_by_organizer`, reembolsa pagadas y notifica |
| DELETE | `/api/retreats/[id]` | Eliminar retiro (propietario; bloquea si hay cualquier inscripción activa, no solo confirmadas) |
| POST | `/api/retreats/series` | Convertir un evento existente en periódico (propietario): crea la serie con el evento como master; si ya está publicado genera las ocurrencias al momento |
| GET | `/api/retreats/series/[id]` | Fechas futuras reservables de la serie para el calendario de inscripción (público): id, slug, fecha, plazas libres (restando reservas sin pago) y, con sesión, cuáles ya tiene reservadas el usuario. Horizonte máximo: 7 semanas (`SERIES_BOOKING_HORIZON_DAYS`) |
| POST | `/api/retreats/series/[id]` | Gestión de serie de evento periódico (propietario): `close_date` cierra una fecha sin reservas (vacaciones, se añade a `skip_dates`) y `stop` detiene la serie |
| POST | `/api/storage/retreat-images` | Subir imagen al bucket `retreat-images` con service role (legacy/integraciones; el wizard del organizador usa subida directa desde el cliente para evitar límite de tamaño del body en serverless) |
| PATCH | `/api/profile` | Actualizar perfil propio (`full_name`, `phone` obligatorio con ≥9 dígitos, `bio`) |
| POST | `/api/shop/product-interest` | Encuesta tienda «próximamente»: guardar valoración por categoría (`action: rating`) o comentario en filas existentes (`action: comment`); sesión anónima vía `sessionId` en body; service role en servidor |
| GET | `/api/messages/conversations` | Listar conversaciones del usuario |
| POST | `/api/messages/conversations` | Crear/recuperar conversación sobre un retiro |
| GET | `/api/messages/conversations/[id]` | Obtener mensajes de una conversación |
| POST | `/api/messages/conversations/[id]` | Enviar mensaje en una conversación |
| POST | `/api/messages/support` | Crear/recuperar conversación de soporte con admin |
| GET | `/api/admin/messages` | Listar todas las conversaciones (admin, incluye soporte) |
| POST | `/api/admin/messages/support` | Admin crea/obtiene conversación de soporte con un usuario (targetUserId) |
| DELETE | `/api/admin/messages/[messageId]` | Borrar mensaje (solo admin) |
| POST | `/api/checkout` | Reserva/pago: con `{ retreatId }` crea Stripe Checkout **o** reserva sin pago (`reserved_no_payment`) si falta el mínimo, la confirmación es manual o el cobro online no está activo (modo lanzamiento); respuesta puede incluir `{ reserved: true, bookingId }`. Con `{ bookingId }` (reserva existente) crea sesión Stripe para pagar antes del deadline. Con `{ seriesId, retreatIds? }` (evento periódico) reserva las fechas seleccionadas en el calendario —o todas las futuras publicadas si no llega `retreatIds`— donde el usuario no esté inscrito y haya plaza (`{ reserved: true, series: true, datesBooked }`); el pago, si el cobro está activo, se completa por fecha desde Mis reservas |
| POST | `/api/webhooks/stripe` | Webhook Stripe (checkout.session.completed, charge.refunded) |
| PATCH | `/api/bookings/[id]` | Organizador confirma/rechaza reserva |
| POST | `/api/bookings/[id]` | Asistente cancela su reserva (action=cancel): aplica la garantía Retiru de 48 h y los tramos de la política del evento, reembolsa vía Stripe (total o parcial) y avisa por email a ambas partes |
| GET | `/api/bookings/[id]/form` | Obtener formulario post-reserva del asistente |
| POST | `/api/bookings/[id]/form` | Guardar respuestas del formulario post-reserva |
| GET | `/api/organizer/commission-tier` | Nivel de comisión escalonada del organizador autenticado (para formulario PVP) |
| POST | `/api/organizer/contract` | Aceptar contrato (crea `organizer_profile`, `contract_accepted_at`, rol `organizer` vía `assignRole`) |
| GET | `/api/organizer/verification` | Estado global de verificación KYC |
| POST | `/api/organizer/verification/[step]` | Marcar paso enviado / subir metadatos de documento |
| GET | `/api/organizer/dashboard` | KPIs reales del organizador |
| GET | `/api/organizer/attendees` | Listar asistentes cross-evento (incluye `reserved_no_payment`; agrega por serie) |
| GET | `/api/organizer/events/[id]/bookings` | Listar bookings de un evento |
| GET | `/api/organizer/events/[id]/bookings/export` | Exportar asistentes a CSV |
| PATCH | `/api/organizer/bookings/[id]/payment` | Legacy: marcar liquidación/pago complementario (modelo histórico 80 % fuera de plataforma; con pago 100 % suele no aplicar) |
| POST | `/api/organizer/events/[id]/broadcast` | Enviar mensaje a todos los asistentes |
| GET | `/api/organizer/events/[id]/communications` | Timeline de comunicaciones del evento |
| POST | `/api/cron/payment-reminders` | Cron legacy: no-op con pago 100 % (antes recordatorio del 80 %); **no** está en `vercel.json` |
| POST | `/api/cron/sla-deadlines` | Cron (horario en `vercel.json`): reservas `pending_confirmation` con `sla_deadline` vencido (organizador con confirmación manual que no confirma a tiempo) → cancelación, reembolso Stripe íntegro si hubo cobro, email `sendBookingExpiredEmail` al asistente; `CRON_SECRET` |
| POST | `/api/cron/payment-deadlines` | Cron: procesa plazos de pago de reservas sin pago — gracia +24h y cancelación automática |
| POST | `/api/cron/event-reminders` | Cron: recordatorios pre-evento (7d y 2d) |
| POST | `/api/cron/review-requests` | Cron: solicitar reseñas post-evento |
| GET / POST | `/api/cron/mailing-tick` | Cron (cada minuto): envía un micro-lote (`batch_size_per_tick`) de cada campaña en `sending`, respetando `max_per_hour`; pausa automática si OVH devuelve rate-limit; auth con `CRON_SECRET` |
| GET / POST | `/api/cron/series-occurrences` | Cron (diario 05:00 en `vercel.json`): eventos periódicos — genera las ocurrencias que falten hasta el horizonte de cada serie activa (`retreat_series`) y recoloca `is_series_next`; `CRON_SECRET` |
| GET / POST | `/api/unsubscribe` | Baja de marketing. Con `?t=<marketing_opt_out_token>` hace one-click unsubscribe (`List-Unsubscribe-Post` compatible). Sin token, muestra un formulario bilingüe (ES/EN vía `?lang=` o `Accept-Language`) donde el usuario introduce su email; al enviarlo, marca los `centers` con ese email como opt-out e inserta en `email_suppressions` para bloquear futuros envíos. Respuesta genérica siempre (no revela si el email existía) |
| GET / POST | `/api/admin/mailing/campaigns` | Listar campañas (vista `mailing_campaigns_stats`) o crear borrador |
| GET / PATCH / DELETE | `/api/admin/mailing/campaigns/[slug]` | Detalle/edición/borrado (solo `draft`) |
| POST | `/api/admin/mailing/campaigns/[slug]/generate` | Generar HTML con OpenAI `gpt-5.6-terra` usando referencias previas; SSE de logs |
| GET | `/api/admin/mailing/campaigns/[slug]/preview` | HTML renderizado con datos reales (para `<iframe>` de preview) |
| POST | `/api/admin/mailing/campaigns/[slug]/send-test` | Envía un test a un email arbitrario (sin tocar `mailing_recipients`) |
| POST | `/api/admin/mailing/campaigns/[slug]/populate-recipients` | Volcar destinatarios según `audience_filter` (`all`/`claimed`/`not_claimed`/`test_emails`) |
| POST | `/api/admin/mailing/campaigns/[slug]/start` | Pasa la campaña a `sending` (valida HTML + `pending` > 0) |
| POST | `/api/admin/mailing/campaigns/[slug]/pause` | Marca `is_paused=true` |
| POST | `/api/admin/mailing/campaigns/[slug]/resume` | Marca `is_paused=false` (o `draft → sending`) |
| POST | `/api/admin/mailing/campaigns/[slug]/retry-failed` | Re-encola los `failed` como `pending` |
| POST | `/api/admin/mailing/campaigns/[slug]/archive` | Marca `archived` (referencia para la IA) |
| GET | `/api/admin/mailing/campaigns/[slug]/recipients` | Listado paginado y filtrable por estado |
| GET | `/api/admin/mailing/references` | Campañas con `has_html=true` para usar como referencia de la IA |
| GET | `/api/admin/mailing/centers-search` | Buscar centros activos por nombre (selector del panel) |
| GET / POST / DELETE | `/api/admin/mailing/suppressions` | Admin: listar bajas (`?q=`), añadir manual (`source='admin'`, marca también los centros con ese email) y revertir baja (`?id=`) |
