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
| `/en/about` | `app/en/(public)/about/page.tsx` |
| `/en/help` | `app/en/(public)/help/page.tsx` |
| `/en/contact` | `app/en/(public)/contact/page.tsx` |
| `/en/condiciones` | `app/en/(public)/condiciones/page.tsx` |

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
| `/es/perfil` | `app/es/(dashboard)/perfil/page.tsx` | Datos personales, avatar |
| `/es/mis-centros` | `app/es/(dashboard)/mis-centros/page.tsx` | Centros reclamados |
| `/es/mis-eventos` | `app/es/(dashboard)/mis-eventos/page.tsx` | Eventos/retiros creados |
| `/es/mis-eventos/nuevo` | `app/es/(dashboard)/mis-eventos/nuevo/page.tsx` | Wizard para crear evento |
| `/es/mis-eventos/[id]` | `app/es/(dashboard)/mis-eventos/[id]/page.tsx` | Editar evento existente |
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

## Panel de administrador (protegido, solo role=admin)

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/administrator` | `app/administrator/page.tsx` | Dashboard admin |
| `/administrator/usuarios` | `app/administrator/usuarios/page.tsx` | Gestión usuarios |
| `/administrator/organizadores` | `app/administrator/organizadores/page.tsx` | Gestión organizadores |
| `/administrator/retiros` | `app/administrator/retiros/page.tsx` | Gestión retiros (aprobar/rechazar) |
| `/administrator/centros` | `app/administrator/centros/page.tsx` | Gestión centros |
| `/administrator/claims` | `app/administrator/claims/page.tsx` | Gestión claims de centros |
| `/administrator/mensajes` | `app/administrator/mensajes/page.tsx` | Moderación de conversaciones + respuesta en soporte |
| `/administrator/blog` | `app/administrator/blog/page.tsx` | Gestión blog |
| `/administrator/tienda` | `app/administrator/tienda/page.tsx` | Gestión tienda |
| `/administrator/reembolsos` | `app/administrator/reembolsos/page.tsx` | Reembolsos |
| `/administrator/reporting` | `app/administrator/reporting/page.tsx` | Reporting y métricas |

Protegido por middleware (role=admin). No indexado en buscadores.

---

## API endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/centers/claim` | Reclamar un centro (auto-aprueba si email coincide) |
| GET | `/api/admin/center-claims` | Listar claims (admin) |
| POST | `/api/admin/center-claims` | Aprobar/rechazar claim (admin) |
| POST | `/api/retreats/create` | Crear retiro (auto-crea organizer_profile) |
| PATCH | `/api/retreats/[id]` | Actualizar retiro (solo propietario) |
| GET | `/api/messages/conversations` | Listar conversaciones del usuario |
| POST | `/api/messages/conversations` | Crear/recuperar conversación sobre un retiro |
| GET | `/api/messages/conversations/[id]` | Obtener mensajes de una conversación |
| POST | `/api/messages/conversations/[id]` | Enviar mensaje en una conversación |
| POST | `/api/messages/support` | Crear/recuperar conversación de soporte con admin |
| GET | `/api/admin/messages` | Listar todas las conversaciones (admin, incluye soporte) |
| POST | `/api/checkout` | Crear sesión de Stripe Checkout para reservar retiro |
| POST | `/api/webhooks/stripe` | Webhook Stripe (checkout.session.completed, charge.refunded) |
| PATCH | `/api/bookings/[id]` | Organizador confirma/rechaza reserva |
| GET | `/api/bookings/[id]/form` | Obtener formulario post-reserva del asistente |
| POST | `/api/bookings/[id]/form` | Guardar respuestas del formulario post-reserva |
| GET | `/api/organizer/dashboard` | KPIs reales del organizador |
| GET | `/api/organizer/attendees` | Listar todos los asistentes cross-evento |
| GET | `/api/organizer/events/[id]/bookings` | Listar bookings de un evento |
| GET | `/api/organizer/events/[id]/bookings/export` | Exportar asistentes a CSV |
| PATCH | `/api/organizer/bookings/[id]/payment` | Marcar pago 80% como recibido |
| POST | `/api/organizer/events/[id]/broadcast` | Enviar mensaje a todos los asistentes |
| GET | `/api/organizer/events/[id]/communications` | Timeline de comunicaciones del evento |
| POST | `/api/cron/payment-reminders` | Cron: recordatorios de pago del 80% |
| POST | `/api/cron/event-reminders` | Cron: recordatorios pre-evento (7d y 2d) |
| POST | `/api/cron/review-requests` | Cron: solicitar reseñas post-evento |
