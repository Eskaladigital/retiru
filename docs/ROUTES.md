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
| `/es/retiro/[slug]` | `app/es/(public)/retiro/[slug]/page.tsx` | Ficha de retiro (portada + galería con todas las `retreat_images` extra; móvil y escritorio) |
| `/es/centros-retiru` | `app/es/(public)/centros-retiru/page.tsx` | Directorio centros (hero + CentrosClient) |
| `/es/centros-retiru/[slug]` | `app/es/(public)/centros-retiru/[slug]/page.tsx` | Centros por ciudad |
| `/es/centro/[slug]` | `app/es/(public)/centro/[slug]/page.tsx` | Ficha de centro |
| `/es/destinos` | `app/es/(public)/destinos/page.tsx` | Destinos |
| `/es/destinos/[slug]` | `app/es/(public)/destinos/[slug]/page.tsx` | Destino por slug |
| `/es/organizador/[slug]` | `app/es/(public)/organizador/[slug]/page.tsx` | Perfil organizador |
| `/es/para-organizadores` | `app/es/(public)/para-organizadores/page.tsx` | Para centros y organizadores |
| `/es/tienda` | `src/app/(public)/es/tienda/page.tsx` | Tienda (`shop_products`); si no hay productos, encuesta `ProductInterestSurvey` → `shop_product_interests` |
| `/es/tienda/[slug]` | `src/app/(public)/es/tienda/[slug]/page.tsx` | Ficha de producto |
| `/es/blog` | `app/es/(public)/blog/page.tsx` | Blog |
| `/es/blog/[slug]` | `app/es/(public)/blog/[slug]/page.tsx` | Artículo de blog |
| `/es/sobre-nosotros` | `app/es/(public)/sobre-nosotros/page.tsx` | Sobre nosotros |
| `/es/ayuda` | `app/es/(public)/ayuda/page.tsx` | Centro de ayuda (FAQs) |
| `/es/contacto` | `app/es/(public)/contacto/page.tsx` | Contacto |
| `/es/condiciones` | `app/es/(public)/condiciones/page.tsx` | Condiciones de uso y precios |

---

## Rutas públicas (EN)

| Ruta | Archivo |
|------|---------|
| `/en` | `app/en/page.tsx` |
| `/en/search` | `app/en/(public)/search/page.tsx` |
| `/en/retreats-retiru` | `app/en/(public)/retreats-retiru/page.tsx` |
| `/en/retreats-retiru/[slug]` | `app/en/(public)/retreats-retiru/[slug]/page.tsx` |
| `/en/retreat/[slug]` | `app/en/(public)/retreat/[slug]/page.tsx` — ficha retiro (portada + galería, equivalente a ES) |
| `/en/centers-retiru` | `app/en/(public)/centers-retiru/page.tsx` |
| `/en/centers-retiru/[slug]` | `app/en/(public)/centers-retiru/[slug]/page.tsx` |
| `/en/center/[slug]` | `app/en/(public)/center/[slug]/page.tsx` |
| `/en/destinations` | `app/en/(public)/destinations/page.tsx` |
| `/en/destinations/[slug]` | `app/en/(public)/destinations/[slug]/page.tsx` |
| `/en/organizer/[slug]` | `app/en/(public)/organizer/[slug]/page.tsx` |
| `/en/for-organizers` | `app/en/(public)/for-organizers/page.tsx` |
| `/en/shop` | `src/app/(public)/en/shop/page.tsx` — misma lógica que `/es/tienda` (encuesta si no hay productos) |
| `/en/shop/[slug]` | `src/app/(public)/en/shop/[slug]/page.tsx` |
| `/en/blog` | `app/en/(public)/blog/page.tsx` |
| `/en/blog/[slug]` | `app/en/(public)/blog/[slug]/page.tsx` |
| `/en/about` | `app/en/(public)/about/page.tsx` |
| `/en/help` | `app/en/(public)/help/page.tsx` |
| `/en/contact` | `app/en/(public)/contact/page.tsx` |
| `/en/condiciones` | `app/en/(public)/condiciones/page.tsx` |

---

## Selector de idioma (header / footer)

El enlace **English / Español** no apunta solo a la home: calcula la ruta equivalente (`src/lib/locale-path.ts`), p. ej. `/es/blog` → `/en/blog`, `/es/centro/foo` → `/en/center/foo`.

- **Artículos del blog** con `slug` distinto de `slug_en`: se consulta `GET /api/blog/alternate-path?path=…` para enlazar a la URL canónica del otro idioma.
- **Área de cuenta** (`/es/perfil`, `/es/mis-*`, `/es/mensajes`, `/es/panel`…): al pasar a inglés se redirige a **`/en`** (esas rutas solo existen en español).
- El enlace usa **`<a href>`** (navegación completa) para que el documento se regenere con el `<html lang>` correcto y sin estado cliente obsoleto. Además, `PublicShell` sincroniza `document.documentElement.lang` en cambios de ruta por `next/link`.

---

## Autenticación

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/es/login` | `app/es/(public)/(auth)/login/page.tsx` | Inicio de sesión (solo email/contraseña) |
| `/es/registro` | `app/es/(public)/(auth)/registro/page.tsx` | Registro (solo email, sin Google OAuth) |
| `/en/login` | `app/en/(public)/(auth)/login/page.tsx` | Login (EN) |
| `/en/register` | `app/en/(public)/(auth)/register/page.tsx` | Register (EN) |

Parámetros opcionales en registro: `?redirect=/ruta&claim=true` (redirige tras registro y contextualiza para reclamar centro).

---

## Dashboard de usuario (requiere login)

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/es/mis-reservas` | `app/es/(dashboard)/mis-reservas/page.tsx` | Reservas como asistente |
| `/es/mensajes` | `app/es/(dashboard)/mensajes/page.tsx` | Bandeja de mensajes (+ botón soporte) |
| `/es/mensajes/[id]` | `app/es/(dashboard)/mensajes/[id]/page.tsx` | Conversación individual (chat / soporte) |
| `/es/perfil` | `app/es/(dashboard)/perfil/page.tsx` | Datos personales desde `profiles` (Supabase); guardar vía `PATCH /api/profile` |
| `/es/mis-centros` | `app/es/(dashboard)/mis-centros/page.tsx` | Centros reclamados, propuestas pendientes, reclamar / proponer nuevo |
| `/es/mis-eventos` | `app/es/(dashboard)/mis-eventos/page.tsx` | Eventos/retiros creados |
| `/es/mis-eventos/nuevo` | `app/es/(dashboard)/mis-eventos/nuevo/page.tsx` | Wizard para crear evento (portada + hasta 8 fotos: subida directa al bucket `retreat-images` desde el navegador con RLS; IA opcional `POST /api/retreats/generate-cover-image`) |
| `/es/mis-eventos/[id]` | `app/es/(dashboard)/mis-eventos/[id]/page.tsx` | Editar evento (misma gestión de portada y galería) |
| `/es/panel/mensajes` | `app/es/(organizer)/panel/mensajes/page.tsx` | Bandeja de mensajes del organizador (+ botón soporte) |

Cualquier usuario logueado (incluido admin) accede a estas secciones desde el menú de usuario.

---

## Rutas de claim (reclamar centro)

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/es/reclamar/[token]` | `app/es/(public)/reclamar/[token]/page.tsx` | Link mágico de email |
| `/en/claim/[token]` | `app/en/(public)/claim/[token]/page.tsx` | Magic link (EN) |

---

## Slug = ciudad o identificador

- **retiros-retiru/[slug]** / **retreats-retiru/[slug]**: slug = ciudad/destino (murcia, barcelona, ibiza, etc.)
- **centros-retiru/[slug]** / **centers-retiru/[slug]**: slug = ciudad (murcia, madrid, barcelona, etc.)
- **centro/[slug]** / **center/[slug]**: slug = identificador del centro (yoga-sala-madrid, spa-termal-murcia, etc.)
- **retiro/[slug]** / **retreat/[slug]**: slug = identificador del retiro
- **organizador/[slug]** / **organizer/[slug]**: slug = identificador del organizador

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

| Ruta ES | Ruta EN | Descripción |
|---------|---------|-------------|
| `/es/centros-[type]` | `/en/centers-[type]` | Índice de centros por tipo (yoga, meditacion, ayurveda) |
| `/es/centros-[type]/[province]` | `/en/centers-[type]/[province]` | Centros de tipo en provincia específica |

Tipos ES: yoga, meditacion, ayurveda. Tipos EN (= BD): yoga, meditation, ayurveda.

### Generación de contenido

Contenido único por categoría y destino generado con IA y almacenado en BD (tablas `categories` y `destinations`): `intro_es`, `intro_en`, `meta_title_*`, `meta_description_*`, `faq` (JSONB).

Script: `node scripts/generate-seo-content.mjs [--categories] [--destinations] [--force]`
| ... | Más tipos de retiro según categorías de la BD |

Localidades y categorías vienen de la base de datos.

---

## Componentes de búsqueda

| Componente | Uso | Campos |
|------------|-----|--------|
| `HeroSearch` | Home | Toggle Retiros/Centros + campos según modo |
| `EventosSearch` | retiros-retiru, retiros-retiru/[slug] | Texto, destino, fechas |
| `CentrosSearch` | centros-retiru, centros-retiru/[slug] | Texto, tipo, ciudad |

---

## Valoraciones en listados de retiros

En **cards** de retiros (home “populares”, `/es/retiros-retiru`, `/es/retiros-retiru/[slug]`, `/es/buscar` cuando el ítem es retiro, equivalentes EN, y componentes `EventCard` / `event-card` si se usan en listados):

- Lo que se muestra como estrellas + contador es la **media y el número de reseñas del organizador** (`organizer_profiles`, derivado de `reviews` por `organizer_id`), no el agregado del retiro concreto.
- Si el organizador **no tiene** reseñas visibles, **no** se renderiza el bloque de valoración (evita mostrar `0.0 (0)`).

En la **ficha** `/es/retiro/[slug]` (y EN): el bloque principal de opiniones corresponde a reseñas del **retiro**; la valoración del organizador se muestra **por separado** (p. ej. en la zona del organizador).

Código de referencia: `getOrganizerReviewStats`, `organizerHasRatingToShow` en `src/lib/utils/index.ts`; listados consumen `organizer` incluido en el `select` de `getPublishedRetreats` (`src/lib/data/index.ts`).

---

## Carpetas en `src/app/es/(public)`

### Implementadas

| Carpeta | Contenido |
|---------|-----------|
| `retiros-retiru/` | page.tsx, EventosClient.tsx, [slug]/page.tsx |
| `centros-retiru/` | page.tsx, CentrosClient.tsx, [slug]/page.tsx |
| `retiro/[slug]/` | Ficha de retiro (portada + sección galería con el resto de imágenes) |
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
| `centros-meditacion/[slug]/` | /centros-meditacion/madrid |
| `centros-ayurveda/[slug]/` | /centros-ayurveda/valencia |
| `retiros-yoga/[slug]/` | /retiros-yoga/ibiza |
| `retiros-gastronomia/[slug]/` | /retiros-gastronomia/madrid |
| ... | Más según categorías de retiros en BD |

---

## Panel de administrador (protegido, solo role=admin)

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/administrator` | `app/administrator/page.tsx` | Dashboard admin |
| `/administrator/usuarios` | `app/administrator/usuarios/page.tsx` | Gestión usuarios (+ botón Mensaje para abrir chat de soporte) |
| `/administrator/organizadores` | `app/administrator/organizadores/page.tsx` | Gestión organizadores (+ botón Mensaje para abrir chat de soporte) |
| `/administrator/retiros` | `app/administrator/retiros/page.tsx` | Gestión retiros (ver, editar, aprobar, rechazar, cancelar, eliminar). Query `?filter=pending_review` abre el listado filtrado (p. ej. desde el dashboard admin) |
| `/administrator/retiros/[id]/editar` | `app/administrator/retiros/[id]/editar/page.tsx` | Editar retiro (admin) |
| `/administrator/centros` | `app/administrator/centros/page.tsx` | Gestión centros |
| `/administrator/claims` | `app/administrator/claims/page.tsx` | Gestión claims de centros |
| `/administrator/mensajes` | `app/administrator/mensajes/page.tsx` | Moderación de conversaciones + respuesta en soporte. Parámetro `?open=convId` abre una conversación al cargar |
| `/administrator/blog` | `app/administrator/blog/page.tsx` | Gestión blog |
| `/administrator/tienda` | `src/app/administrator/tienda/page.tsx` | Gestión tienda + bloque «Encuesta de productos» (`get_shop_interest_stats`, comentarios) |
| `/administrator/reembolsos` | `app/administrator/reembolsos/page.tsx` | Reembolsos |
| `/administrator/reporting` | `app/administrator/reporting/page.tsx` | Reporting y métricas |

Protegido por middleware (role=admin). No indexado en buscadores.

---

## API endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/centers/claim` | Reclamar un centro (auto-aprueba si email coincide) |
| POST | `/api/centers/propose` | Proponer centro nuevo desde Google Maps (queda `pending_review`; usuario autenticado) |
| GET | `/api/admin/center-claims` | Listar claims (admin) |
| POST | `/api/admin/center-claims` | Aprobar/rechazar claim (admin) |
| POST | `/api/admin/retreats` | Aprobar, rechazar, cancelar, archivar o eliminar retiro (admin) |
| PATCH | `/api/admin/retreats/[id]` | Editar retiro (admin) |
| POST | `/api/retreats/create` | Crear retiro (auto-crea organizer_profile) |
| POST | `/api/retreats/generate-cover-image` | Portada IA: cuerpo con **briefing completo** del evento (textos, destino, fechas, categorías, programa, incluidos…); **GPT-4o** genera un único párrafo-prompt en español; **GPT Image 1.5** genera la imagen (`1536x1024`, `high`); usuario autenticado; `OPENAI_API_KEY`; bucket `retreat-images` |
| PATCH | `/api/retreats/[id]` | Actualizar retiro (solo propietario) |
| POST | `/api/retreats/[id]` | Cancelar retiro (propietario, action=cancel) |
| DELETE | `/api/retreats/[id]` | Eliminar retiro (propietario, solo sin reservas confirmadas) |
| POST | `/api/storage/retreat-images` | Subir imagen al bucket `retreat-images` con service role (legacy/integraciones; el wizard del organizador usa subida directa desde el cliente para evitar límite de tamaño del body en serverless) |
| PATCH | `/api/profile` | Actualizar perfil propio (`full_name`, `phone` obligatorio con ≥9 dígitos, `bio`) |
| GET | `/api/messages/conversations` | Listar conversaciones del usuario |
| POST | `/api/messages/conversations` | Crear/recuperar conversación sobre un retiro |
| GET | `/api/messages/conversations/[id]` | Obtener mensajes de una conversación |
| POST | `/api/messages/conversations/[id]` | Enviar mensaje en una conversación |
| POST | `/api/messages/support` | Crear/recuperar conversación de soporte con admin |
| GET | `/api/admin/messages` | Listar todas las conversaciones (admin, incluye soporte) |
| POST | `/api/admin/messages/support` | Admin crea/obtiene conversación de soporte con un usuario (targetUserId) |
| DELETE | `/api/admin/messages/[messageId]` | Borrar mensaje (solo admin) |
| POST | `/api/checkout` | Reserva/pago: con `{ retreatId }` crea Stripe Checkout **o** reserva sin pago (`reserved_no_payment`) si el retiro tiene `min_attendees > 1` y aún no se alcanzó el mínimo; respuesta puede incluir `{ reserved: true, bookingId }`. Con `{ bookingId }` (reserva existente) crea sesión Stripe para pagar antes del deadline |
| POST | `/api/webhooks/stripe` | Webhook Stripe (checkout.session.completed, charge.refunded) |
| PATCH | `/api/bookings/[id]` | Organizador confirma/rechaza reserva |
| GET | `/api/bookings/[id]/form` | Obtener formulario post-reserva del asistente |
| POST | `/api/bookings/[id]/form` | Guardar respuestas del formulario post-reserva |
| GET | `/api/organizer/dashboard` | KPIs reales del organizador |
| GET | `/api/organizer/attendees` | Listar todos los asistentes cross-evento |
| GET | `/api/organizer/events/[id]/bookings` | Listar bookings de un evento |
| GET | `/api/organizer/events/[id]/bookings/export` | Exportar asistentes a CSV |
| PATCH | `/api/organizer/bookings/[id]/payment` | Legacy: marcar liquidación/pago complementario (modelo histórico 80 % fuera de plataforma; con pago 100 % suele no aplicar) |
| POST | `/api/organizer/events/[id]/broadcast` | Enviar mensaje a todos los asistentes |
| GET | `/api/organizer/events/[id]/communications` | Timeline de comunicaciones del evento |
| POST | `/api/cron/payment-reminders` | Cron: no-op con pago 100 % (antes recordatorio del 80 %) |
| POST | `/api/cron/payment-deadlines` | Cron: procesa plazos de pago de reservas sin pago — gracia +24h y cancelación automática |
| POST | `/api/cron/event-reminders` | Cron: recordatorios pre-evento (7d y 2d) |
| POST | `/api/cron/review-requests` | Cron: solicitar reseñas post-evento |
