# RETIRU — Rutas y estructura de URLs

Documentación de la arquitectura de rutas y landings.

---

## Rutas públicas (ES)

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/es` | `app/es/page.tsx` | Home |
| `/es/buscar` | `app/es/(public)/buscar/page.tsx` | Buscador general |
| `/es/eventos-retiru` | `app/es/(public)/eventos-retiru/page.tsx` | Lista eventos (hero + EventosSearch) |
| `/es/eventos-retiru/[slug]` | `app/es/(public)/eventos-retiru/[slug]/page.tsx` | Eventos por ciudad |
| `/es/centros-retiru` | `app/es/(public)/centros-retiru/page.tsx` | Directorio centros (hero + CentrosSearch) |
| `/es/centros-retiru/[slug]` | `app/es/(public)/centros-retiru/[slug]/page.tsx` | Centros por ciudad |
| `/es/centro/[slug]` | `app/es/(public)/centro/[slug]/page.tsx` | Ficha de centro |
| `/es/retiros/[slug]` | `app/es/(public)/retiros/[slug]/page.tsx` | Ficha de evento |
| `/es/destinos` | `app/es/(public)/destinos/page.tsx` | Destinos |
| `/es/destinos/[slug]` | `app/es/(public)/destinos/[slug]/page.tsx` | Destino por slug |
| `/es/para-organizadores` | `app/es/(public)/para-organizadores/page.tsx` | Para centros y organizadores |
| `/es/tienda` | `app/es/(public)/tienda/page.tsx` | Tienda |
| `/es/blog` | `app/es/(public)/blog/page.tsx` | Blog |

---

## Rutas públicas (EN)

| Ruta | Archivo |
|------|---------|
| `/en` | `app/en/page.tsx` |
| `/en/search` | `app/en/(public)/search/page.tsx` |
| `/en/events-retiru` | `app/en/(public)/events-retiru/page.tsx` |
| `/en/events-retiru/[slug]` | `app/en/(public)/events-retiru/[slug]/page.tsx` |
| `/en/centers-retiru` | `app/en/(public)/centers-retiru/page.tsx` |
| `/en/centers-retiru/[slug]` | `app/en/(public)/centers-retiru/[slug]/page.tsx` |
| `/en/center/[slug]` | `app/en/(public)/center/[slug]/page.tsx` |
| `/en/retreats/[slug]` | `app/en/(public)/retreats/[slug]/page.tsx` |
| `/en/destinations` | `app/en/(public)/destinations/page.tsx` |
| `/en/for-organizers` | `app/en/(public)/for-organizers/page.tsx` |
| `/en/shop` | `app/en/(public)/shop/page.tsx` |

---

## Slug = ciudad

- **eventos-retiru/[slug]**: slug = ciudad/destino (murcia, barcelona, ibiza, granada, etc.)
- **centros-retiru/[slug]**: slug = ciudad (murcia, madrid, barcelona, valencia, etc.)
- **centro/[slug]**: slug = identificador del centro (yoga-sala-madrid, espacio-zen-barcelona, etc.)

---

## Landings planificadas (pendientes)

| Ruta | Descripción |
|------|-------------|
| `/es/centros-yoga/[slug]` | Centros de yoga en [ciudad] |
| `/es/centros-spa/[slug]` | Centros de spa en [ciudad] |
| `/es/eventos-yoga/[slug]` | Eventos de yoga en [ciudad] |
| `/es/eventos-culinarios/[slug]` | Eventos culinarios en [ciudad] |
| ... | Más tipos según categorías de la BD |

Localidades y categorías vendrán de la base de datos.

---

## Componentes de búsqueda

| Componente | Uso | Campos |
|------------|-----|--------|
| `HeroSearch` | Home | Toggle Eventos/Centros + campos según modo |
| `EventosSearch` | eventos-retiru, eventos-retiru/[slug] | Texto, destino, fechas |
| `CentrosSearch` | centros-retiru, centros-retiru/[slug] | Texto, tipo, ciudad |

---

## Carpetas en `src/app/es/(public)`

### Implementadas

| Carpeta | Contenido |
|---------|-----------|
| `eventos-retiru/` | page.tsx, EventosClient.tsx, [slug]/page.tsx |
| `centros-retiru/` | page.tsx, CentrosClient.tsx, [slug]/page.tsx |
| `centro/[slug]/` | Ficha de centro |
| `retiros/[slug]/` | Ficha de evento |
| `buscar/` | Buscador general |
| `destinos/` | Destinos + [slug] |
| `para-organizadores/` | Para centros y organizadores |
| `tienda/` | Tienda + [slug] |
| `blog/` | Blog + [slug] |
| `legal/` | Términos, privacidad, cookies |
| `sobre-nosotros/`, `contacto/`, `ayuda/`, `condiciones/` | Páginas estáticas |
| `organizador/[slug]/` | Perfil organizador |

### Pendientes (landings por tipo + ciudad)

| Carpeta | Ejemplo URL |
|---------|-------------|
| `centros-yoga/[slug]/` | /centros-yoga/murcia |
| `centros-spa/[slug]/` | /centros-spa/madrid |
| `eventos-yoga/[slug]/` | /eventos-yoga/ibiza |
| `eventos-culinarios/[slug]/` | /eventos-culinarios/madrid |
| ... | Más según categorías BD |

---

## Panel de administrador (protegido)

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/administrator` | `app/administrator/page.tsx` | Dashboard admin |
| `/administrator/organizadores` | `app/administrator/organizadores/page.tsx` | Gestión organizadores |
| `/administrator/eventos` | `app/administrator/eventos/page.tsx` | Gestión eventos |
| `/administrator/centros` | `app/administrator/centros/page.tsx` | Gestión centros |
| `/administrator/tienda` | `app/administrator/tienda/page.tsx` | Gestión tienda |
| `/administrator/reembolsos` | `app/administrator/reembolsos/page.tsx` | Reembolsos |
| `/administrator/reporting` | `app/administrator/reporting/page.tsx` | Reporting y métricas |

Protegido por middleware. No indexado en buscadores.

Carpeta: `src/app/administrator/` (layout, page, organizadores, eventos, centros, tienda, reembolsos, reporting).
