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
| `RESEND_FROM_EMAIL` | Email remitente (ej: `hola@retiru.com`) |
| `NEXT_PUBLIC_APP_URL` | URL base de la app |
| `NEXT_PUBLIC_APP_NAME` | Nombre de la app (`Retiru`) |
| `OPENAI_API_KEY` | (opcional) Para funcionalidades IA |
| `SERPAPI_API_KEY` | (opcional) Para búsquedas externas |

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

# Centros — descripciones IA
node scripts/generate-all-descriptions.mjs            # Generar todas las descripciones
node scripts/generate-all-descriptions.mjs --limit 10 # Solo N centros
node scripts/generate-all-descriptions.mjs --dry-run  # Simular sin guardar
npm run centers:vaciar-genericas                       # Vaciar descripciones genéricas

# Centros — emails
npm run centers:emails        # Sincronizar emails (CSV + SerpAPI)
npm run centers:emails-csv    # Solo desde directorio.csv
npm run centers:emails-serp   # Solo búsqueda SerpAPI

# Centros — claims
npm run centers:claim-tokens                              # Generar tokens de reclamación

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
2. `supabase/seed/001_categories_destinations.sql` — categorías y destinos
3. `supabase/seed/002_sample_retreats.sql` — usuario demo + 10 retiros de ejemplo
4. `supabase/seed/003_sample_blog.sql` — 3 categorías de blog + 5 artículos

### Capa de datos

Las páginas consumen datos a través de `src/lib/data/index.ts`:

- `getCategories(locale)`, `getDestinations(locale)`
- `getPublishedRetreats(filters)`, `getRetreatBySlug(slug)`
- `getOrganizerBySlug(slug)`, `getActiveCenters(filters)`, `getCenterBySlug(slug)`

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
| `/es/perfil` | Datos personales, avatar, contraseña |
| `/es/mis-centros` | Centros reclamados (o CTA para buscar y reclamar) |
| `/es/mis-eventos` | Lista de eventos/retiros creados |
| `/es/mis-eventos/nuevo` | Formulario wizard para crear evento |
| `/es/mis-eventos/[id]` | Editar evento existente |

Cualquier usuario logueado (incluido el admin) accede a estas 4 secciones desde el menú de usuario.

### Panel de administrador (protegido)

| Ruta | Descripción |
|------|-------------|
| `/administrator` | Dashboard admin |
| `/administrator/organizadores` | Gestión organizadores |
| `/administrator/eventos` | Gestión retiros |
| `/administrator/centros` | Gestión centros |
| `/administrator/claims` | Gestión claims de centros |
| `/administrator/tienda` | Gestión tienda |
| `/administrator/reembolsos` | Reembolsos |
| `/administrator/reporting` | Reporting y métricas |

### Estrategia de landings (SEO)

- **1 landing genérica**: Home (`/es`) — no compite por términos específicos.
- **4 tipos × N localidades** (localidades desde base de datos):
  1. `centros-retiru/[slug]` — Centros en [ciudad]
  2. `retiros-retiru/[slug]` — Retiros en [ciudad]
  3. `centros-[tipo]/[slug]` — Centros de [tipo] en [ciudad] *(planificado)*
  4. `retiros-[tipo]/[slug]` — Retiros de [tipo] en [ciudad] *(planificado)*

Ejemplos: centros-yoga/murcia, retiros-yoga/madrid.

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
│   │   │   ├── mis-reservas/   # Reservas como asistente
│   │   │   ├── perfil/         # Datos personales
│   │   │   ├── mis-centros/    # Centros reclamados
│   │   │   └── mis-eventos/    # Eventos creados + wizard nuevo + edición
│   │   └── page.tsx            # Home ES
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
| Enriquecer descripciones con IA (SerpAPI + OpenAI) | 🔄 En curso | ~77 completados, ~515 pendientes |
| Buscar emails faltantes (CSV + SerpAPI) | 🔄 En curso | 416 con email, 176 sin email |
| Generar descripciones en inglés | ⏳ Pendiente | Traducción automática tras completar ES |

**Scripts disponibles:**

```bash
node scripts/generate-all-descriptions.mjs          # Generar descripciones IA (todos)
node scripts/generate-all-descriptions.mjs --limit 5 # Solo N centros
node scripts/sync-and-fetch-emails.mjs               # Buscar emails (CSV + SerpAPI)
node scripts/count-generic-descriptions.mjs           # Contar descripciones genéricas
node scripts/quick-stats.mjs                          # Estadísticas rápidas
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
| Centros que se registran | Tabla `profiles` con role=organizer |
| Centros que crean eventos | Tabla `retreats` con organizer vinculado a centro |
| Conversión a pago (mes 6) | Manual / CRM |

---

## Roles

| Rol | Capacidades |
|---|---|
| **Visitante** (sin login) | Navega, busca, ve retiros y centros |
| **Usuario** (logueado) | Reserva retiros, gestiona perfil, reclama centros, crea eventos |
| **Admin** | Todo lo del usuario + panel `/administrator` (modera centros, claims, retiros, reembolsos, reporting) |

### Dashboard del usuario (4 secciones)

Cualquier usuario logueado (incluido el admin) tiene acceso a:

1. **Mis reservas** — reservas como asistente
2. **Mi perfil** — datos personales, avatar, contraseña
3. **Mis centros** — centros reclamados; si no tiene, CTA para buscar y reclamar
4. **Mis eventos** — retiros/eventos creados; formulario wizard para crear nuevos

El admin tiene además acceso a `/administrator` desde el menú.

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
- **Mis reservas**: reservas como asistente con estados visuales
- **Mi perfil**: datos personales, avatar, contraseña
- **Mis centros**: centros reclamados; si no tiene, CTA para buscar y reclamar desde el directorio
- **Mis eventos**: lista de retiros/eventos creados con imagen, estado, ocupación
  - Wizard de creación en 4 pasos (Información, Detalles, Incluye, Precio)
  - Edición de eventos existentes con publicación desde borrador
  - Auto-creación de `organizer_profile` al crear el primer evento
- **"Reclama tu centro"**: botón en cada ficha pública de centro + link mágico en email de bienvenida

### Panel de administrador (solo role=admin)
- Dashboard con métricas generales
- Gestión de organizadores, retiros, centros y claims
- Gestión de tienda (productos, categorías, pedidos)
- Reembolsos y reporting
- Acceso en `/administrator` (protegido por rol)

---

## Diseño

- **Mobile-first**, limpio, premium pero accesible
- **Paleta cálida**: terracotta, verde salvia, blanco roto, arena
- **Tipografía**: DM Serif Display (títulos) + DM Sans (cuerpo)
- Desglose de pagos siempre transparente

---

## Licencia

Proyecto privado. Todos los derechos reservados.
