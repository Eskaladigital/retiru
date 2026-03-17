# RETIRU — Marketplace de Retiros y Escapadas

Plataforma web bilingüe (ES/EN) donde las personas descubren y reservan retiros y escapadas (yoga, detox, gastronomía, naturaleza, meditación, wellness, aventura) y los organizadores publican y gestionan sus retiros de forma gratuita.

> "Airbnb de los retiros" — pensado para España y el mercado hispanohablante.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Estilos | Tailwind CSS, Radix UI, Lucide Icons |
| Backend | Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions) |
| Pagos | Stripe (cobro del 20 %, facturación, reembolsos vía webhooks) |
| Emails | Resend |
| i18n | next-intl (ES base + EN completo) |
| Formularios | React Hook Form + Zod |
| Deploy | Vercel |

---

## Requisitos previos

- **Node.js** 18+ y **npm** (o pnpm/yarn)
- Cuenta en [Supabase](https://supabase.com) — necesaria para datos (retiros, centros, blog, tienda)
- Cuenta en [Stripe](https://stripe.com) (opcional — necesario solo para el flujo de pagos)
- Cuenta en [Resend](https://resend.com) (opcional — necesario solo para el envío de emails)

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd retiru-app

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales (ver sección siguiente)

# 4. Ejecutar migraciones y seeds en Supabase
# En el SQL Editor de Supabase, ejecutar en orden:
# - supabase/migrations/001_initial.sql
# - supabase/seed/001_categories_destinations.sql
# - supabase/seed/002_sample_retreats.sql
# - supabase/seed/003_sample_blog.sql

# 5. Arrancar en modo desarrollo
npm run dev
```

La aplicación estará disponible en **http://localhost:3000**.

---

## Variables de entorno

Copia `.env.example` a `.env.local` y rellena los valores:

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima pública de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (solo backend) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clave pública de Stripe |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secreto del webhook de Stripe |
| `RESEND_API_KEY` | API key de Resend |
| `RESEND_FROM_EMAIL` | Email remitente (ej: `contacto@retiru.com`) |
| `NEXT_PUBLIC_APP_URL` | URL base de la app |
| `NEXT_PUBLIC_APP_NAME` | Nombre de la app (`Retiru`) |
| `OPENAI_API_KEY` | (opcional) Para generación de descripciones IA |
| `GOOGLE_PLACES_API_KEY` | (opcional) Para obtener reseñas de Google Places |

> **Nota:** Supabase es necesario para que la app muestre retiros, centros, blog y tienda. Sin él, las páginas mostrarán listas vacías.

---

## Scripts disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo (puerto 3000)
npm run build            # Build de producción
npm run start            # Servidor de producción
npm run lint             # Linter (ESLint)
npm run db:types         # Generar tipos TypeScript desde el esquema de Supabase
npm run stripe:listen    # Escuchar webhooks de Stripe en local

# Centros — descripciones IA (scraping web + Google Places + OpenAI, temp 0.2)
node scripts/generate-all-descriptions.mjs            # Generar descripciones faltantes
node scripts/generate-all-descriptions.mjs --force    # Regenerar TODAS las descripciones
node scripts/generate-all-descriptions.mjs --limit 10 # Solo N centros
node scripts/generate-all-descriptions.mjs --dry-run  # Simular sin guardar
npm run centers:vaciar-genericas                       # Vaciar descripciones genéricas

# Centros — emails
npm run centers:emails        # Sincronizar emails desde CSV
npm run centers:emails-csv    # Solo desde directorio.csv

# Centros — claims
npm run centers:claim-tokens                              # Generar tokens de reclamación

# Centros — tipos y agrupación (Yoga, Pilates, Meditación, Ayurveda, Wellness, Spa)
npm run centers:group-types                               # Analizar y generar reporte CSV (centros-agrupacion-propuesta.csv)
npm run centers:group-types:update                        # Aplicar cambios a la BD (requiere migración 009)

# Centros — inferir tipo con IA (afinar clasificación usando descripciones)
npm run centers:infer-types-ai                           # Analizar con OpenAI, generar centros-tipos-ia-propuesta.csv
npm run centers:infer-types-ai -- --limit 20              # Probar con 20 centros
npm run centers:infer-types-ai:update                     # Aplicar cambios a la BD (tras revisar el CSV)

# Centros — estadísticas
node scripts/quick-stats.mjs              # Resumen rápido (descripciones + emails)
node scripts/count-center-stats.mjs       # Total, con/sin email
node scripts/count-generic-descriptions.mjs # Contar descripciones genéricas

# Retiros
node scripts/seed-retreats.mjs           # Poblar retiros de ejemplo en Supabase
node scripts/count-retreats.mjs          # Contar retiros en BD
node scripts/assign-retreats-to-admin.mjs # Asignar retiros de ejemplo al admin
```

---

## Base de datos (Supabase)

### Migraciones y seeds

Ejecutar en el **SQL Editor** de Supabase (con service_role) en este orden:

1. `supabase/migrations/001_initial.sql` — esquema completo (tablas, RLS, triggers)
2. `supabase/migrations/002_fix_handle_new_profile.sql` — fix trigger perfil
3. `supabase/migrations/003_centers_description_ai_generated.sql` — campo IA en centros
4. `supabase/migrations/004_storage_policies.sql` — políticas de storage
5. `supabase/migrations/005_blog_slug_en.sql` — slug EN en blog
6. `supabase/migrations/006_center_claims.sql` — claims de centros
7. `supabase/migrations/007_centers_directorio_columns.sql` — columnas directorio
8. `supabase/migrations/008_conversations_messaging.sql` — mensajería interna
9. `supabase/migrations/009_center_types_ayurveda_pilates.sql` — tipos de centro
10. `supabase/migrations/010_support_conversations.sql` — soporte (chat con admin)
11. `supabase/migrations/011_booking_rpc_functions.sql` — funciones RPC para gestión de bookings
12. `supabase/seed/001_categories_destinations.sql` — categorías y destinos
12. `supabase/seed/002_sample_retreats.sql` — usuario demo + 10 retiros de ejemplo
13. `supabase/seed/003_sample_blog.sql` — 3 categorías de blog + 5 artículos

### Capa de datos

Las páginas consumen datos a través de `src/lib/data/index.ts`:

- `getCategories(locale)`, `getDestinations(locale)`, `getDestinationBySlug(slug)`
- `getPublishedRetreats(filters)`, `getRetreatBySlug(slug)`
- `getOrganizerBySlug(slug)`, `getActiveCenters(filters)`, `getCenterBySlug(slug)`
- `getCenterProvinces()` — provincias únicas con centros activos (para `generateStaticParams` y sitemap)
- `getCentersByProvince(slug)` — centros filtrados por provincia normalizada
- `getDestinationsWithRetreats()` — solo destinos con al menos 1 retiro publicado (para `generateStaticParams` y sitemap)
- `getBookingsForUser(userId)` — reservas del usuario con retiro e imagen de portada
- `getBookingById(bookingId)` — detalle de una reserva con retiro, organizador y destino
- Slugs para build: `getCenterSlugs()`, `getRetreatSlugs()`, `getBlogPostSlugs()`, `getOrganizerSlugs()`, `getProductSlugs()`, `getDestinationSlugs()`

Las APIs `/api/retreats`, `/api/centers` y `/api/catalog` exponen datos para búsqueda y filtros.

---

## Estructura de URLs y landings

### Resumen de rutas públicas (ES)

| Ruta | Descripción |
|------|-------------|
| `/es` | Home genérica |
| `/es/buscar` | Buscador general |
| `/es/retiros-retiru` | Retiros y escapadas (hero + buscador + lista) |
| `/es/retiros-retiru/[slug]` | Retiros filtrados por ciudad (ej. `/retiros-retiru/murcia`) |
| `/es/retiro/[slug]` | Ficha individual de retiro |
| `/es/centros-retiru` | Directorio de centros (hero + CentrosSearch) |
| `/es/centros-retiru/[slug]` | Centros filtrados por ciudad (ej. `/centros-retiru/murcia`) |
| `/es/centro/[slug]` | Ficha individual de centro (ej. `/centro/yoga-sala-madrid`) |
| `/es/reclamar/[token]` | Link mágico para reclamar un centro |
| `/es/destinos` | Destinos populares |
| `/es/destinos/[slug]` | Destino por slug |
| `/es/para-organizadores` | Para centros y organizadores |
| `/es/tienda` | Tienda wellness |
| `/es/blog` | Blog |

### Dashboard de usuario (requiere login)

| Ruta | Descripción |
|------|-------------|
| `/es/mis-reservas` | Reservas como asistente |
| `/es/mensajes` | Bandeja de mensajes (conversaciones con organizadores + soporte) |
| `/es/mensajes/[id]` | Conversación individual (burbujas de chat) |
| `/es/perfil` | Datos personales, avatar, contraseña |
| `/es/mis-centros` | Centros reclamados (o CTA para buscar y reclamar) |
| `/es/mis-eventos` | Lista de eventos/retiros creados |
| `/es/mis-eventos/nuevo` | Formulario wizard para crear evento |
| `/es/mis-eventos/[id]` | Editar evento existente |

Cualquier usuario logueado (incluido el admin) accede a estas secciones desde el menú de usuario.

### Panel de administrador (protegido)

| Ruta | Descripción |
|------|-------------|
| `/administrator` | Dashboard admin |
| `/administrator/usuarios` | Gestión de usuarios |
| `/administrator/organizadores` | Gestión organizadores |
| `/administrator/retiros` | Gestión retiros (aprobar/rechazar) |
| `/administrator/centros` | Gestión centros |
| `/administrator/claims` | Gestión claims de centros |
| `/administrator/mensajes` | Moderación de conversaciones + respuesta en chats de soporte |
| `/administrator/blog` | Gestión blog |
| `/administrator/tienda` | Gestión tienda |
| `/administrator/reembolsos` | Reembolsos |
| `/administrator/reporting` | Reporting y métricas |

### Estrategia de landings (SEO)

- **1 landing genérica**: Home (`/es`) — no compite por términos específicos.
- **4 tipos × N localidades** (localidades desde base de datos):
  1. `centros-retiru/[slug]` — Centros en [ciudad] ✅ Conectado a Supabase
  2. `retiros-retiru/[slug]` — Retiros en [ciudad] ✅ Conectado a Supabase
  3. `centros-[tipo]/[slug]` — Centros de [tipo] en [ciudad] *(planificado)*
  4. `retiros-[tipo]/[slug]` — Retiros de [tipo] en [ciudad] *(planificado)*

Ejemplos: centros-yoga/murcia, retiros-yoga/madrid.

**Generación estática condicional:** Las páginas por provincia/destino solo se generan en el deploy si hay al menos 1 centro/retiro en esa provincia/destino. Evita "thin content" vacío.

### Sitemap dinámico (`/sitemap.xml`)

El sitemap se genera automáticamente en cada deploy con ISR (revalidate 1h). Incluye **~1.956 URLs bilingües** (ES + EN):

| Tipo | Slugs | URLs (ES+EN) |
|------|-------|-------------|
| Páginas estáticas | 26 | 26 |
| Centros individuales | ~858 | ~1.716 |
| Centros por provincia | ~64 | ~128 |
| Retiros individuales | ~10 | ~20 |
| Retiros por destino | ~10 | ~20 |
| Blog | ~10 | ~20 |
| Destinos | ~12 | ~24 |
| Organizadores | ~1 | ~2 |
| Productos | 0 | 0 |

Cada entrada incluye `alternates` hreflang ES/EN. Solo se generan entradas para provincias con centros y destinos con retiros.

### Rutas EN (equivalente)

| ES | EN |
|----|-----|
| `/es/retiros-retiru` | `/en/retreats-retiru` |
| `/es/retiro/[slug]` | `/en/retreat/[slug]` |
| `/es/centros-retiru` | `/en/centers-retiru` |
| `/es/centro/[slug]` | `/en/center/[slug]` |
| `/es/reclamar/[token]` | `/en/claim/[token]` |
| `/es/buscar` | `/en/search` |
| `/es/destinos` | `/en/destinations` |
| `/es/para-organizadores` | `/en/for-organizers` |
| `/es/tienda` | `/en/shop` |

---

## Mensajería interna

Sistema de comunicación dentro de la plataforma entre usuarios y organizadores, vinculado a retiros publicados. Incluye también un canal de soporte directo con el equipo de Retiru.

**Reglas de negocio:**
- Cualquier usuario logueado puede iniciar conversación sobre un retiro publicado (botón "Preguntar al organizador")
- Una conversación por par (usuario, retiro) — si ya existe, se reutiliza
- Los datos de contacto del organizador NO se revelan hasta que hay reserva pagada
- Mensaje de sistema automático al organizador advirtiendo de penalización por contacto externo
- El admin puede ver, moderar y borrar mensajes desde `/administrator/mensajes`

**Soporte (chat con admin):**
- Cualquier usuario u organizador puede iniciar un chat de soporte desde su página de mensajes (botón "Contactar soporte") o desde el **widget flotante** (burbuja abajo a la derecha, visible en todas las páginas públicas)
- Un solo chat de soporte por usuario (si ya existe, se reutiliza)
- El admin puede ver y responder chats de soporte desde `/administrator/mensajes` (como "Andrea, responsable de atención al cliente")
- El admin puede iniciar conversaciones con cualquier usuario desde `/administrator/usuarios` o `/administrator/organizadores` (botón "Mensaje")
- Las conversaciones de soporte se distinguen con `is_support = true` en la tabla `conversations`
- Las conversaciones normales (usuario ↔ organizador) siguen en modo solo lectura para el admin

**Arquitectura:**
- Migraciones: `008_conversations_messaging.sql` (mensajería base) + `010_support_conversations.sql` (soporte)
- API: `POST/GET /api/messages/conversations`, `GET/POST /api/messages/conversations/[id]`, `POST /api/messages/support`, `GET /api/admin/messages`, `POST /api/admin/messages/support`, `DELETE /api/admin/messages/[messageId]`
- UI usuario: `/es/mensajes` (lista + botón soporte) y `/es/mensajes/[id]` (chat con burbujas)
- UI usuario: widget de chat flotante en todas las páginas públicas (`SupportChatWidget`)
- UI organizador: `/es/panel/mensajes` (lista + botón soporte)
- UI admin: `/administrator/mensajes` (tabla + chat overlay flotante para soporte)
- Componentes: `src/components/messaging/AskOrganizerButton.tsx`, `src/components/chat/SupportChatWidget.tsx`

---

## Estructura del proyecto

```
src/
├── app/
│   ├── es/
│   │   ├── (public)/           # Páginas públicas (datos desde Supabase)
│   │   │   ├── retiros-retiru/ # Retiros (hero + EventosSearch + EventosClient)
│   │   │   │   ├── page.tsx
│   │   │   │   ├── EventosClient.tsx
│   │   │   │   └── [slug]/     # Por ciudad (murcia, barcelona...)
│   │   │   ├── retiro/[slug]/  # Ficha individual de retiro
│   │   │   ├── centros-retiru/ # Centros (hero + CentrosClient)
│   │   │   │   ├── page.tsx
│   │   │   │   ├── CentrosClient.tsx
│   │   │   │   └── [slug]/     # Por ciudad
│   │   │   ├── centro/[slug]/   # Ficha individual de centro
│   │   │   ├── buscar/         # Buscador unificado retiros + centros
│   │   │   ├── destinos/
│   │   │   ├── organizador/[slug]/
│   │   │   ├── para-organizadores/
│   │   │   ├── tienda/
│   │   │   ├── blog/
│   │   │   └── ...
│   │   ├── (auth)/             # Login, registro
│   │   ├── (dashboard)/        # Dashboard unificado del usuario
│   │   │   ├── mis-reservas/   # Reservas como asistente (datos desde BD)
│   │   │   ├── mensajes/       # Bandeja de mensajes + chat + soporte
│   │   │   ├── perfil/         # Datos personales
│   │   │   ├── mis-centros/    # Centros reclamados
│   │   │   └── mis-eventos/    # Eventos creados + wizard nuevo + edición
│   │   ├── (organizer)/        # Panel del organizador
│   │   │   └── panel/mensajes/ # Bandeja de mensajes del organizador + soporte
│   │   └── page.tsx            # Home ES
│   ├── api/
│   │   ├── messages/           # API mensajería (conversations, support)
│   │   └── admin/              # API admin (messages, center-claims)
│   ├── administrator/         # Panel admin (protegido, /administrator)
│   └── en/                     # Misma estructura en inglés
├── components/
│   ├── home/
│   │   ├── HeroSearch.tsx      # Buscador home (toggle Retiros/Centros)
│   │   ├── EventosSearch.tsx    # Buscador solo retiros
│   │   └── CentrosSearch.tsx    # Buscador solo centros
│   ├── layout/
│   │   ├── Header.tsx          # Nav + off-canvas móvil
│   │   └── Footer.tsx
│   └── ui/
├── i18n/
├── lib/
│   ├── data/           # Capa de datos (getPublishedRetreats, getRetreatBySlug, etc.)
│   ├── supabase/       # Cliente Supabase (server, client)
│   └── seo/            # Metadata y JSON-LD
└── types/
```

---

## Navegación y menú

- **Header**: enlaces a retiros-retiru, centros-retiru, tienda, para-organizadores, blog. (Condiciones solo en footer.)
- **Menú de usuario** (logueado): Mis reservas, Mi perfil, Mis centros, Mis eventos. Admin adicional para role=admin.
- **Menú móvil (off-canvas)**: panel lateral deslizable desde la derecha, backdrop con blur, bloqueo de scroll, cierre al hacer clic fuera o en enlace.

> **Documentación**: [`docs/ROUTES.md`](docs/ROUTES.md) · [`docs/SEO-LANDINGS.md`](docs/SEO-LANDINGS.md) (estructura de contenido y SEO).


---

## Modelo de negocio

### Retiros (marketplace)

- El **organizador publica gratis**. Sin suscripción ni comisión.
- Al reservar, el **asistente paga el 20 %** del precio total a Retiru como cuota de intermediación.
- El **80 % restante** lo cobra el organizador directamente al asistente antes del retiro.
- Ejemplo: retiro de 500 € → 100 € a Retiru + 400 € al organizador.

### Directorio de centros (suscripción)

- El directorio será de **pago** (cuota mensual) para los centros.
- Fase de lanzamiento: los centros se importan desde un directorio CSV y se les ofrece **6 meses de membresía gratuita** para que valoren el impacto.
- Tras los 6 meses, los centros que quieran continuar pasan a la cuota de pago.
- Los centros que no respondan o no quieran pagar se eliminan (o se conservan los ~100 mejor valorados como base).

---

## Estrategia de crecimiento — Directorio de centros

### Contexto

Se han importado **~592 centros** de yoga, pilates, meditación, wellness y spa de toda España, seleccionados por su buen perfil en Google Maps (valoración, reseñas, actividad). Estos centros no se han registrado ellos mismos — los hemos incluido proactivamente.

### Fases

#### Fase 0 — Preparación de datos (actual)

| Tarea | Estado | Detalle |
|-------|--------|---------|
| Importar centros desde `directorio.csv` | ✅ Completado | 592 centros |
| Enriquecer descripciones con IA (scraping web + Google Places + OpenAI) | 🔄 En curso | ~857 centros total |
| Buscar emails faltantes (CSV + SerpAPI) | 🔄 En curso | 416 con email, 176 sin email |
| Generar descripciones en inglés | ⏳ Pendiente | Traducción automática tras completar ES |

**Scripts disponibles:**

```bash
node scripts/generate-all-descriptions.mjs            # Generar descripciones faltantes
node scripts/generate-all-descriptions.mjs --force    # Regenerar TODAS (scraping web + Google Places + OpenAI)
node scripts/generate-all-descriptions.mjs --limit 5  # Solo N centros
node scripts/count-generic-descriptions.mjs            # Contar descripciones genéricas
node scripts/quick-stats.mjs                           # Estadísticas rápidas
```

#### Fase 1 — Notificación (email de bienvenida + claim)

- Enviar `mailing/retiru-bienvenida-centro.html` a todos los centros con email.
- Mensaje: "Enhorabuena, tu centro ha sido seleccionado para Retiru. Te regalamos 6 meses de membresía gratuita."
- Cada email incluye un **link mágico** (`/es/reclamar/{{TOKEN}}`) que permite al dueño reclamar su centro con un clic.
- Objetivo: que visiten su perfil, lo reclamen, validen la información y se registren.
- **Pendiente:** configurar Resend para envío masivo personalizado.

##### Flujo "Reclama tu centro"

El dueño de un centro puede vincularse como propietario verificado mediante:

1. **Link mágico (email):** el email de bienvenida contiene un token único que auto-aprueba el claim.
2. **Email match:** si el email del usuario registrado coincide con el del centro, se auto-aprueba.
3. **Solicitud manual:** el botón "Reclamar este centro" en la ficha pública crea un claim pendiente que un admin revisa.

**Tablas:** `center_claims` (claim con estado pending/approved/rejected) + `claim_tokens` (tokens para links mágicos).

**API (claims):**
- `POST /api/centers/claim` — crear claim (auto-aprueba si email coincide)
- `GET/POST /api/admin/center-claims` — listar/aprobar/rechazar claims (solo admin)

**API (eventos/retiros del usuario):**
- `POST /api/retreats/create` — crear retiro (auto-crea organizer_profile si no existe)
- `PATCH /api/retreats/[id]` — actualizar retiro existente (solo propietario)

**Rutas:**
- `/es/reclamar/[token]` y `/en/claim/[token]` — páginas de link mágico
- `/administrator/claims` — panel de gestión de claims

**Script:** `npm run centers:claim-tokens` — genera tokens para centros con email (se incluyen en el email de bienvenida).

#### Fase 2 — Activación (email de eventos)

- Enviar `mailing/retiru-crea-tu-evento.html` unos días/semanas después.
- Mensaje: "Crea tu primer evento en Retiru. Retiros, talleres, masterclasses..."
- Objetivo: generar contenido y actividad en la plataforma.

#### Fase 3 — Monetización (mes 6)

- Contactar a los centros para evaluar su experiencia.
- Los que vean valor → pasan a cuota de pago mensual.
- Los que no respondan / no quieran pagar → se eliminan del directorio.
- Posible alternativa: conservar los ~100 centros con mejor valoración como base gratuita.

### Métricas clave a seguir

| Métrica | Cómo se mide |
|---------|-------------|
| Tasa de apertura del email | Plataforma de envío (Resend) |
| Centros que visitan su perfil | Analítica web (GA4) |
| Centros que se registran | Tabla `center_claims` con status=approved |
| Centros que crean eventos | Tabla `retreats` con organizer vinculado a centro |
| Conversión a pago (mes 6) | Manual / CRM |

---

## Roles y tipos de usuario

### Roles en base de datos

La tabla `profiles` tiene un campo `role` con 3 valores posibles: `attendee`, `organizer`, `admin`.

```
user_role: 'attendee' | 'organizer' | 'admin'
```

### Tipos funcionales de usuario

| Tipo funcional | Rol en BD | Cómo se llega | Capacidades |
|---|---|---|---|
| **Visitante** | Sin cuenta | Navega sin registrarse | Buscar, ver retiros, centros, blog, tienda |
| **Asistente** | `attendee` | Se registra con email | Reservar retiros, gestionar perfil, reclamar centros |
| **Propietario de centro** | `attendee` | Reclama un centro (claim aprobado en `center_claims`) | Todo lo de asistente + editar su centro, publicar eventos |
| **Organizador** | `organizer` | Crea su primer evento y el admin lo aprueba | Todo lo de asistente + crear/gestionar retiros (ya sin aprobación previa) |
| **Admin** | `admin` | Asignado manualmente | Todo + panel `/administrator`, modera claims, retiros, centros |

### Flujo de promoción de rol

1. **Registro**: todo usuario nuevo se crea como `attendee`.
2. **Reclamar centro**: un `attendee` puede reclamar un centro. El admin aprueba/rechaza el claim. Si se aprueba, el usuario puede editar su centro pero sigue siendo `attendee` (se identifica como propietario por la relación en `center_claims`).
3. **Crear primer evento**: cualquier `attendee` puede crear un retiro/evento desde "Mis eventos". Al crear el primero:
   - Se auto-crea un `organizer_profile` vinculado al usuario.
   - El retiro se guarda como `draft` y pasa a `pending_review`.
   - **El admin debe verificar y aprobar** el primer retiro desde `/administrator/retiros`.
   - Al aprobarlo, el retiro se publica y el rol del usuario se actualiza a `organizer`.
4. **Eventos posteriores**: una vez que el usuario es `organizer` (su primer retiro fue aprobado), los siguientes retiros siguen el mismo flujo de revisión pero el admin ya tiene confianza en el organizador.

### Verificación del primer evento (admin)

Es fundamental que **ningún retiro se publique sin revisión del admin**. El flujo:

1. Usuario crea evento → estado `draft`
2. Usuario envía a revisión → estado `pending_review`
3. Admin revisa en `/administrator/retiros` → aprueba (`published`) o rechaza (`rejected` con motivo)
4. Si aprobado: el retiro se publica y es visible en el frontend
5. El rol del usuario se promueve a `organizer` si era su primer retiro aprobado

Esto protege la calidad de la plataforma y evita contenido fraudulento o de baja calidad.

### Dashboard del usuario (4 secciones)

Cualquier usuario logueado (incluido el admin) tiene acceso a:

1. **Mis reservas** — reservas como asistente
2. **Mi perfil** — datos personales, avatar, contraseña
3. **Mis centros** — centros reclamados; si no tiene, CTA para buscar y reclamar
4. **Mis eventos** — retiros/eventos creados; formulario wizard para crear nuevos

El admin tiene además acceso a `/administrator` desde el menú.

### Flujo de autenticación

- **Solo email/contraseña** (Google OAuth desactivado por ahora).
- Registro → email de verificación → clic en enlace → cuenta activa → login.
- Si el usuario intenta reclamar un centro sin estar logueado, se le redirige a **registro** (no a login) con `redirect` al centro. Si ya tiene cuenta, puede ir a login desde el registro.

---

## Funcionalidades principales

### Front público
- **Homepage** con H1 "Encuentra tu retiro", HeroSearch (toggle Retiros/Centros), categorías, retiros populares y destinos desde Supabase
- **Retiros** (`/retiros-retiru`): hero + buscador (texto, destino, fechas) + lista con filtros — datos desde Supabase
- **Retiros por ciudad** (`/retiros-retiru/[slug]`): retiros filtrados por destino/ciudad
- **Ficha de retiro** (`/retiro/[slug]`): galería, desglose de pagos, reseñas, CTA sticky — datos desde Supabase
- **Centros** (`/centros-retiru`): hero + CentrosSearch (texto, tipo, ciudad) + directorio con filtros — datos desde Supabase
- **Centros por ciudad** (`/centros-retiru/[slug]`): centros filtrados por ciudad
- **Ficha de centro** (`/centro/[slug]`): galería, servicios, horarios, contacto — datos desde Supabase
- **Organizador** (`/organizador/[slug]`): perfil público con retiros publicados
- **Buscador** (`/buscar`): búsqueda unificada retiros + centros con filtros
- **Blog** (`/blog`, `/blog/[slug]`): artículos desde Supabase
- **Tienda** (`/tienda`, `/tienda/[slug]`): productos desde Supabase
- **Para centros y organizadores** (`/para-organizadores`): secciones centros + organizadores
- **Condiciones** (`/condiciones`): modelo de precios transparente (en footer)

### Dashboard de usuario (cualquier usuario logueado)
- **Mis reservas**: reservas como asistente con estados visuales (datos desde BD)
- **Mensajes**: bandeja de conversaciones con organizadores + botón "Contactar soporte" para chat con admin
- **Mi perfil**: datos personales, avatar, contraseña
- **Mis centros**: centros reclamados; si no tiene, CTA para buscar y reclamar desde el directorio
- **Mis eventos**: lista de retiros/eventos creados con imagen, estado, ocupación
  - Wizard de creación en 4 pasos (Información, Detalles, Incluye, Precio)
  - Edición de eventos existentes con publicación desde borrador
  - Auto-creación de `organizer_profile` al crear el primer evento
- **"Reclama tu centro"**: botón en cada ficha pública de centro + link mágico en email de bienvenida

### Panel de administrador (solo role=admin)
- Dashboard con métricas generales
- **Usuarios** — tabla con todos los perfiles (buscador, filtro por rol)
- **Organizadores** — gestión de organizadores verificados (datos desde `organizer_profiles`)
- **Retiros** — gestión de retiros (aprobar/rechazar los `pending_review`, ver todos)
- **Centros** — gestión de centros (buscador, filtros, exportar CSV/Excel, generar descripciones IA, editar, ver ficha pública, despublicar/publicar, eliminar)
- **Claims** — gestión de reclamaciones de centros (aprobar/rechazar)
- **Mensajes** — moderación de conversaciones usuario-organizador + lectura y respuesta en chats de soporte (como "Andrea")
- Gestión de tienda (productos, categorías, pedidos)
- Reembolsos y reporting
- Acceso en `/administrator` (protegido por middleware + rol)

---

## Diseño

- **Mobile-first**, limpio, premium pero accesible
- **Paleta cálida**: terracotta, verde salvia, blanco roto, arena
- **Tipografía**: DM Serif Display (títulos) + DM Sans (cuerpo)
- Desglose de pagos siempre transparente

---

## Licencia

Proyecto privado. Todos los derechos reservados.
