# RETIRU — Rutas y estructura de URLs

Documentación de la arquitectura de rutas y landings.

---

## Rutas públicas (ES)

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/es` | `app/es/page.tsx` | Home |
| `/es/buscar` | `app/es/(public)/buscar/page.tsx` | Buscador general (retiros + centros) |
| `/es/retiros-retiru` | `app/es/(public)/retiros-retiru/page.tsx` | Lista retiros (hero + EventosSearch + EventosClient) |
| `/es/retiros-retiru/[slug]` | `app/es/(public)/retiros-retiru/[slug]/page.tsx` | Retiros por ciudad |
| `/es/retiro/[slug]` | `app/es/(public)/retiro/[slug]/page.tsx` | Ficha de retiro |
| `/es/centros-retiru` | `app/es/(public)/centros-retiru/page.tsx` | Directorio centros (hero + CentrosClient) |
| `/es/centros-retiru/[slug]` | `app/es/(public)/centros-retiru/[slug]/page.tsx` | Centros por ciudad |
| `/es/centro/[slug]` | `app/es/(public)/centro/[slug]/page.tsx` | Ficha de centro |
| `/es/destinos` | `app/es/(public)/destinos/page.tsx` | Destinos |
| `/es/destinos/[slug]` | `app/es/(public)/destinos/[slug]/page.tsx` | Destino por slug |
| `/es/organizador/[slug]` | `app/es/(public)/organizador/[slug]/page.tsx` | Perfil organizador |
| `/es/para-organizadores` | `app/es/(public)/para-organizadores/page.tsx` | Para centros y organizadores |
| `/es/tienda` | `app/es/(public)/tienda/page.tsx` | Tienda |
| `/es/tienda/[slug]` | `app/es/(public)/tienda/[slug]/page.tsx` | Ficha de producto |
| `/es/blog` | `app/es/(public)/blog/page.tsx` | Blog |
| `/es/blog/[slug]` | `app/es/(public)/blog/[slug]/page.tsx` | Artículo de blog |

---

## Rutas públicas (EN)

| Ruta | Archivo |
|------|---------|
| `/en` | `app/en/page.tsx` |
| `/en/search` | `app/en/(public)/search/page.tsx` |
| `/en/retreats-retiru` | `app/en/(public)/retreats-retiru/page.tsx` |
| `/en/retreats-retiru/[slug]` | `app/en/(public)/retreats-retiru/[slug]/page.tsx` |
| `/en/retreat/[slug]` | `app/en/(public)/retreat/[slug]/page.tsx` |
| `/en/centers-retiru` | `app/en/(public)/centers-retiru/page.tsx` |
| `/en/centers-retiru/[slug]` | `app/en/(public)/centers-retiru/[slug]/page.tsx` |
| `/en/center/[slug]` | `app/en/(public)/center/[slug]/page.tsx` |
| `/en/destinations` | `app/en/(public)/destinations/page.tsx` |
| `/en/destinations/[slug]` | `app/en/(public)/destinations/[slug]/page.tsx` |
| `/en/organizer/[slug]` | `app/en/(public)/organizer/[slug]/page.tsx` |
| `/en/for-organizers` | `app/en/(public)/for-organizers/page.tsx` |
| `/en/shop` | `app/en/(public)/shop/page.tsx` |
| `/en/shop/[slug]` | `app/en/(public)/shop/[slug]/page.tsx` |
| `/en/blog` | `app/en/(public)/blog/page.tsx` |
| `/en/blog/[slug]` | `app/en/(public)/blog/[slug]/page.tsx` |

---

## Slug = ciudad o identificador

- **retiros-retiru/[slug]** / **retreats-retiru/[slug]**: slug = ciudad/destino (murcia, barcelona, ibiza, etc.)
- **centros-retiru/[slug]** / **centers-retiru/[slug]**: slug = ciudad (murcia, madrid, barcelona, etc.)
- **centro/[slug]** / **center/[slug]**: slug = identificador del centro (yoga-sala-madrid, spa-termal-murcia, etc.)
- **retiro/[slug]** / **retreat/[slug]**: slug = identificador del retiro
- **organizador/[slug]** / **organizer/[slug]**: slug = identificador del organizador

---

## Landings planificadas (pendientes)

| Ruta | Descripción |
|------|-------------|
| `/es/centros-yoga/[slug]` | Centros de yoga en [ciudad] |
| `/es/centros-spa/[slug]` | Centros de spa en [ciudad] |
| `/es/retiros-yoga/[slug]` | Retiros de yoga en [ciudad] |
| `/es/retiros-gastronomia/[slug]` | Retiros gastronómicos en [ciudad] |
| ... | Más tipos según categorías de la BD |

Localidades y categorías vienen de la base de datos.

---

## Componentes de búsqueda

| Componente | Uso | Campos |
|------------|-----|--------|
| `HeroSearch` | Home | Toggle Retiros/Centros + campos según modo |
| `EventosSearch` | retiros-retiru, retiros-retiru/[slug] | Texto, destino, fechas |
| `CentrosSearch` | centros-retiru, centros-retiru/[slug] | Texto, tipo, ciudad |

---

## Carpetas en `src/app/es/(public)`

### Implementadas

| Carpeta | Contenido |
|---------|-----------|
| `retiros-retiru/` | page.tsx, EventosClient.tsx, [slug]/page.tsx |
| `centros-retiru/` | page.tsx, CentrosClient.tsx, [slug]/page.tsx |
| `retiro/[slug]/` | Ficha de retiro |
| `centro/[slug]/` | Ficha de centro |
| `buscar/` | Buscador general (retiros + centros) |
| `destinos/` | Destinos + [slug] |
| `organizador/[slug]/` | Perfil organizador |
| `para-organizadores/` | Para centros y organizadores |
| `tienda/` | Tienda + [slug] |
| `blog/` | Blog + [slug] |
| `legal/` | Términos, privacidad, cookies |
| `sobre-nosotros/`, `contacto/`, `ayuda/`, `condiciones/` | Páginas estáticas |

### Pendientes (landings por tipo + ciudad)

| Carpeta | Ejemplo URL |
|---------|-------------|
| `centros-yoga/[slug]/` | /centros-yoga/murcia |
| `centros-spa/[slug]/` | /centros-spa/madrid |
| `retiros-yoga/[slug]/` | /retiros-yoga/ibiza |
| `retiros-gastronomia/[slug]/` | /retiros-gastronomia/madrid |
| ... | Más según categorías BD |

---

## Panel de administrador (protegido)

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/administrator` | `app/administrator/page.tsx` | Dashboard admin |
| `/administrator/organizadores` | `app/administrator/organizadores/page.tsx` | Gestión organizadores |
| `/administrator/eventos` | `app/administrator/eventos/page.tsx` | Gestión retiros |
| `/administrator/centros` | `app/administrator/centros/page.tsx` | Gestión centros |
| `/administrator/tienda` | `app/administrator/tienda/page.tsx` | Gestión tienda |
| `/administrator/reembolsos` | `app/administrator/reembolsos/page.tsx` | Reembolsos |
| `/administrator/reporting` | `app/administrator/reporting/page.tsx` | Reporting y métricas |

Protegido por middleware. No indexado en buscadores.
