# RETIRU — Rutas y estructura de URLs

Documentación de la arquitectura de rutas y landings.

---

## Rutas públicas (ES)

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/es` | `src/app/(public)/es/page.tsx` | Home |
| `/es/buscar` | `src/app/(public)/es/buscar/page.tsx` | Buscador general (retiros + centros) |
| `/es/retiros-retiru` | `src/app/(public)/es/retiros-retiru/page.tsx` | Lista retiros (hero + EventosSearch + EventosClient) |
| `/es/retiros-retiru/[slug]` | `src/app/(public)/es/retiros-retiru/[slug]/page.tsx` | Retiros por ciudad/destino |
| `/es/retiro/[slug]` | `src/app/(public)/es/retiro/[slug]/page.tsx` | Ficha de retiro (portada + galería `retreat_images`) |
| `/es/centros-retiru` | `src/app/(public)/es/centros-retiru/page.tsx` | Directorio centros |
| `/es/centros-retiru/[slug]` | `src/app/(public)/es/centros-retiru/[slug]/page.tsx` | Centros por provincia |
| `/es/centro/[slug]` | `src/app/(public)/es/centro/[slug]/page.tsx` | Ficha de centro |
| `/es/destinos` | `src/app/(public)/es/destinos/page.tsx` | Destinos |
| `/es/destinos/[slug]` | `src/app/(public)/es/destinos/[slug]/page.tsx` | Destino por slug |
| `/es/organizador/[slug]` | `src/app/(public)/es/organizador/[slug]/page.tsx` | Perfil organizador |
| `/es/para-asistentes` | `src/app/(public)/es/para-asistentes/page.tsx` | Para asistentes: garantías, pago seguro, verificación |
| `/es/para-organizadores` | `src/app/(public)/es/para-organizadores/page.tsx` | Para centros y organizadores |
| `/es/tienda` | `src/app/(public)/es/tienda/page.tsx` | Tienda (`shop_products`); si no hay productos, encuesta `ProductInterestSurvey` → `shop_product_interests` |
| `/es/tienda/[slug]` | `src/app/(public)/es/tienda/[slug]/page.tsx` | Ficha de producto |
| `/es/blog` | `src/app/(public)/es/blog/page.tsx` | Blog |
| `/es/blog/[slug]` | `src/app/(public)/es/blog/[slug]/page.tsx` | Artículo de blog |
| `/es/sobre-nosotros` | `src/app/(public)/es/sobre-nosotros/page.tsx` | Sobre nosotros |
| `/es/ayuda` | `src/app/(public)/es/ayuda/page.tsx` | Centro de ayuda (FAQs) |
| `/es/contacto` | `src/app/(public)/es/contacto/page.tsx` | Contacto |
| `/es/condiciones` | `src/app/(public)/es/condiciones/page.tsx` | Condiciones de uso y precios |
| `/es/retiros-[category]` | `src/app/(public)/es/retiros-[category]/page.tsx` | Landing SEO por categoría de retiro (ej. `/es/retiros-yoga`) |
| `/es/retiros-[category]/[destination]` | `src/app/(public)/es/retiros-[category]/[destination]/page.tsx` | Categoría + destino |
| `/es/centros/[tipo]` | `src/app/(public)/es/centros/[tipo]/page.tsx` | Centros por tipo (`yoga` / `meditacion` / `ayurveda` en URL ES) |
| `/es/centros/[tipo]/[provincia]` | `src/app/(public)/es/centros/[tipo]/[provincia]/page.tsx` | Tipo + provincia |

---

## Rutas públicas (EN)

| Ruta | Archivo |
|------|---------|
| `/en` | `src/app/(public)/en/page.tsx` |
| `/en/search` | `src/app/(public)/en/search/page.tsx` |
| `/en/retreats-retiru` | `src/app/(public)/en/retreats-retiru/page.tsx` |
| `/en/retreats-retiru/[slug]` | `src/app/(public)/en/retreats-retiru/[slug]/page.tsx` |
| `/en/retreat/[slug]` | `src/app/(public)/en/retreat/[slug]/page.tsx` |
| `/en/centers-retiru` | `src/app/(public)/en/centers-retiru/page.tsx` |
| `/en/centers-retiru/[slug]` | `src/app/(public)/en/centers-retiru/[slug]/page.tsx` |
| `/en/center/[slug]` | `src/app/(public)/en/center/[slug]/page.tsx` |
| `/en/destinations` | `src/app/(public)/en/destinations/page.tsx` |
| `/en/destinations/[slug]` | `src/app/(public)/en/destinations/[slug]/page.tsx` |
| `/en/organizer/[slug]` | `src/app/(public)/en/organizer/[slug]/page.tsx` |
| `/en/for-attendees` | `src/app/(public)/en/for-attendees/page.tsx` |
| `/en/for-organizers` | `src/app/(public)/en/for-organizers/page.tsx` |
| `/en/retreats-[category]` | `src/app/(public)/en/retreats-[category]/page.tsx` |
| `/en/retreats-[category]/[destination]` | `src/app/(public)/en/retreats-[category]/[destination]/page.tsx` |
| `/en/centers/[type]` | `src/app/(public)/en/centers/[type]/page.tsx` |
| `/en/centers/[type]/[province]` | `src/app/(public)/en/centers/[type]/[province]/page.tsx` |
| `/en/shop` | `src/app/(public)/en/shop/page.tsx` — misma lógica que `/es/tienda` (encuesta si no hay productos) |
| `/en/shop/[slug]` | `src/app/(public)/en/shop/[slug]/page.tsx` |
| `/en/blog` | `src/app/(public)/en/blog/page.tsx` |
| `/en/blog/[slug]` | `src/app/(public)/en/blog/[slug]/page.tsx` |
| `/en/about` | `src/app/(public)/en/about/page.tsx` |
| `/en/help` | `src/app/(public)/en/help/page.tsx` |
| `/en/contact` | `src/app/(public)/en/contact/page.tsx` |
| `/en/condiciones` | `src/app/(public)/en/condiciones/page.tsx` |

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
| `/es/mis-reservas` | `src/app/(public)/es/(dashboard)/mis-reservas/page.tsx` | Reservas como asistente |
| `/es/mensajes` | `src/app/(public)/es/(dashboard)/mensajes/page.tsx` | Bandeja de mensajes (+ botón soporte) |
| `/es/mensajes/[id]` | `src/app/(public)/es/(dashboard)/mensajes/[id]/page.tsx` | Conversación individual (chat / soporte) |
| `/es/perfil` | `src/app/(public)/es/(dashboard)/perfil/page.tsx` | Datos personales desde `profiles` (Supabase); guardar vía `PATCH /api/profile` |
| `/es/mis-centros` | `src/app/(public)/es/(dashboard)/mis-centros/page.tsx` | Centros reclamados, propuestas pendientes, reclamar / proponer nuevo |
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
| `/es/centros/[tipo]` | `/en/centers/[type]` | Índice de centros por tipo (yoga, meditacion, ayurveda) |
| `/es/centros/[tipo]/[provincia]` | `/en/centers/[type]/[province]` | Centros de tipo en provincia específica |

Tipos ES: yoga, meditacion, ayurveda. Tipos EN (= BD): yoga, meditation, ayurveda.

### Generación de contenido

Contenido único por categoría y destino generado con IA y almacenado en BD (tablas `categories` y `destinations`): `intro_es`, `intro_en`, `meta_title_*`, `meta_description_*`, `faq` (JSONB).

**Contenido en BD:** intros, meta y FAQ por categoría y destino (`scripts/generate-seo-content.mjs`; flags `--categories`, `--destinations`, `--force`). Migraciones `028_categories_seo_fields.sql`, `029_destinations_meta_seo.sql`.

Las URLs concretas salen de slugs en BD (categorías con retiros, destinos, provincias con centros por tipo).

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

## Carpetas en `src/app/(public)/es`

### Público principal

| Carpeta | Contenido |
|---------|-----------|
| `retiros-retiru/` | Lista, `EventosClient`, `[slug]/` por destino |
| `retiros-[category]/` | Landing por categoría + `[destination]/` |
| `centros-retiru/` | Directorio, `[slug]/` por provincia |
| `centros/[tipo]/` | Por tipo BD (URL ES `meditacion` ↔ BD `meditation`) + `[provincia]/` |
| `retiro/[slug]/` | Ficha retiro (portada + galería) |
| `centro/[slug]/` | Ficha centro |
| `buscar/` | Buscador unificado |
| `destinos/` | Destinos + `[slug]` |
| `organizador/[slug]/` | Perfil organizador |
| `para-asistentes/` | Garantías para asistentes |
| `para-organizadores/` | Centros y organizadores |
| `tienda/` | Listado + `[slug]` ficha producto (`shop_products`) |
| `blog/` | Blog + `[slug]` |
| `legal/` | Términos, privacidad, cookies |
| `sobre-nosotros/`, `contacto/`, `ayuda/`, `condiciones/` | Estáticas |

### Landings dinámicas (implementadas)

- **Retiros:** `/es/retiros-yoga`, `/es/retiros-meditacion/ibiza`, etc. → carpeta **`retiros-[category]`** (segmento dinámico; no colisiona con `/es/retiro/[slug]`).
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
| POST | `/api/centers/propose` | Proponer centro nuevo desde Google Maps (queda `pending_review`; usuario autenticado) |
| GET | `/api/admin/center-claims` | Listar claims (admin) |
| POST | `/api/admin/center-claims` | Aprobar/rechazar claim (admin) |
| POST | `/api/admin/retreats` | Aprobar, rechazar, cancelar, archivar o eliminar retiro (admin) |
| POST | `/api/admin/retreats/moderate` | Moderación IA de texto/precios (admin; opcional sin `ANTHROPIC_API_KEY`) |
| PATCH | `/api/admin/retreats/[id]` | Editar retiro (admin) |
| GET | `/api/admin/organizers/[id]` | Detalle organizador para admin (verificación) |
| POST | `/api/admin/organizers/[id]` | Aprobar/rechazar pasos de verificación u operaciones de revisión (admin) |
| GET | `/api/admin/organizers/[id]/doc-url` | URL firmada temporal para documento en `organizer-docs` |
| POST | `/api/retreats/create` | Crear retiro (auto-crea organizer_profile) |
| POST | `/api/retreats/generate-cover-image` | Portada IA: cuerpo con **briefing completo** del evento (textos, destino, fechas, categorías, programa, incluidos…); **GPT-4o** genera un único párrafo-prompt en español; **GPT Image 1.5** genera la imagen (`1536x1024`, `high`); usuario autenticado; `OPENAI_API_KEY`; bucket `retreat-images` |
| PATCH | `/api/retreats/[id]` | Actualizar retiro (solo propietario) |
| POST | `/api/retreats/[id]` | Cancelar retiro (propietario, action=cancel) |
| DELETE | `/api/retreats/[id]` | Eliminar retiro (propietario, solo sin reservas confirmadas) |
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
| POST | `/api/checkout` | Reserva/pago: con `{ retreatId }` crea Stripe Checkout **o** reserva sin pago (`reserved_no_payment`) si el retiro tiene `min_attendees > 1` y aún no se alcanzó el mínimo; respuesta puede incluir `{ reserved: true, bookingId }`. Con `{ bookingId }` (reserva existente) crea sesión Stripe para pagar antes del deadline |
| POST | `/api/webhooks/stripe` | Webhook Stripe (checkout.session.completed, charge.refunded) |
| PATCH | `/api/bookings/[id]` | Organizador confirma/rechaza reserva |
| GET | `/api/bookings/[id]/form` | Obtener formulario post-reserva del asistente |
| POST | `/api/bookings/[id]/form` | Guardar respuestas del formulario post-reserva |
| GET | `/api/organizer/commission-tier` | Nivel de comisión escalonada del organizador autenticado (para formulario PVP) |
| POST | `/api/organizer/contract` | Aceptar contrato (crea `organizer_profile`, `contract_accepted_at`, rol `organizer` vía `assignRole`) |
| GET | `/api/organizer/verification` | Estado global de verificación KYC |
| POST | `/api/organizer/verification/[step]` | Marcar paso enviado / subir metadatos de documento |
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
