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
- Cuenta en [Supabase](https://supabase.com) (opcional para desarrollo local con datos mock)
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

# 4. Arrancar en modo desarrollo
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

> **Nota:** la app funciona en local con datos mock incluso sin credenciales de Supabase configuradas.

---

## Scripts disponibles

```bash
npm run dev          # Servidor de desarrollo (puerto 3000)
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Linter (ESLint)
npm run db:types     # Generar tipos TypeScript desde el esquema de Supabase
npm run stripe:listen # Escuchar webhooks de Stripe en local
```

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
| `/es/destinos` | Destinos populares |
| `/es/destinos/[slug]` | Destino por slug |
| `/es/para-organizadores` | Para centros y organizadores |
| `/es/tienda` | Tienda wellness |
| `/es/blog` | Blog |

### Panel de administrador (protegido)

| Ruta | Descripción |
|------|-------------|
| `/administrator` | Dashboard admin |
| `/administrator/organizadores` | Gestión organizadores |
| `/administrator/eventos` | Gestión retiros |
| `/administrator/centros` | Gestión centros |
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
│   │   ├── (public)/           # Páginas públicas
│   │   │   ├── retiros-retiru/ # Retiros y escapadas (hero + buscador + lista)
│   │   │   │   ├── page.tsx
│   │   │   │   ├── EventosClient.tsx
│   │   │   │   └── [slug]/     # Por ciudad (murcia, barcelona...)
│   │   │   ├── retiro/[slug]/  # Ficha individual de retiro
│   │   │   ├── centros-retiru/ # Centros (hero + buscador + lista)
│   │   │   │   ├── page.tsx
│   │   │   │   ├── CentrosClient.tsx
│   │   │   │   └── [slug]/     # Por ciudad
│   │   │   ├── centro/[slug]/  # Ficha individual de centro
│   │   │   ├── buscar/         # Buscador general
│   │   │   ├── destinos/
│   │   │   ├── para-organizadores/
│   │   │   ├── tienda/
│   │   │   ├── blog/
│   │   │   └── ...
│   │   ├── (auth)/             # Login, registro
│   │   ├── (dashboard)/        # Mis reservas, perfil
│   │   ├── (organizer)/        # Panel organizador
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
└── types/
```

---

## Navegación y menú

- **Header**: enlaces a retiros-retiru, centros-retiru, tienda, para-organizadores, blog, condiciones.
- **Menú móvil (off-canvas)**: panel lateral deslizable desde la derecha, backdrop con blur, bloqueo de scroll, cierre al hacer clic fuera o en enlace.

> **Documentación**: [`docs/ROUTES.md`](docs/ROUTES.md) · [`docs/SEO-LANDINGS.md`](docs/SEO-LANDINGS.md) (estructura de contenido y SEO).


---

## Modelo de negocio

- El **organizador publica gratis**. Sin suscripción ni comisión.
- Al reservar, el **asistente paga el 20 %** del precio total a Retiru como cuota de intermediación.
- El **80 % restante** lo cobra el organizador directamente al asistente antes del retiro.
- Ejemplo: retiro de 500 € → 100 € a Retiru + 400 € al organizador.

---

## Roles

| Rol | Capacidades |
|---|---|
| **Visitante** | Navega, busca, ve retiros |
| **Asistente** | Reserva, paga, chat con organizadores, reseñas |
| **Organizador** | Publica retiros, gestiona reservas y asistentes, check-in, analíticas |
| **Admin** | Modera todo, verifica organizadores, gestiona reembolsos |

---

## Funcionalidades principales

### Front público
- **Homepage** con H1 "Encuentra o busca tu retiru", HeroSearch (toggle Retiros/Centros), categorías y retiros populares
- **Retiros** (`/retiros-retiru`): hero tipo home + buscador (texto, destino, fechas) + lista con filtros
- **Retiros por ciudad** (`/retiros-retiru/murcia`): retiros filtrados por destino/ciudad
- **Ficha de retiro** (`/retiro/[slug]`): galería, desglose de pagos, reseñas, CTA sticky
- **Centros** (`/centros-retiru`): hero tipo home + CentrosSearch (texto, tipo, ciudad) + directorio con filtros
- **Centros por ciudad** (`/centros-retiru/murcia`): centros filtrados por ciudad
- **Ficha de centro** (`/centro/yoga-sala-madrid`): galería, servicios, horarios, contacto
- **Buscador** (`/buscar`) con filtros: ubicación, fechas, duración, precio, categoría, valoración
- **Para centros y organizadores** (`/para-organizadores`): secciones centros + organizadores
- **Condiciones** (`/condiciones`): modelo de precios transparente

### Panel del organizador
- Dashboard con visión general
- Wizard de creación de retiros paso a paso
- Gestión de reservas (confirmar, rechazar, estados, filtros)
- CRM de asistentes con cuestionarios post-reserva
- Mensajería 1:1 y masiva con plantillas
- Check-in con lista y QR
- Analíticas básicas

### Zona del asistente
- Mis reservas con estados visuales
- Chat con organizador (activado tras pago)
- Facturas del 20 %
- Perfil y preferencias

### Panel de administrador
- Dashboard con métricas generales
- Gestión de organizadores, retiros y centros
- Gestión de tienda (productos, categorías, pedidos)
- Reembolsos y reporting
- Acceso en `/administrator` (protegido por middleware)

---

## Diseño

- **Mobile-first**, limpio, premium pero accesible
- **Paleta cálida**: terracotta, verde salvia, blanco roto, arena
- **Tipografía**: DM Serif Display (títulos) + DM Sans (cuerpo)
- Desglose de pagos siempre transparente

---

## Licencia

Proyecto privado. Todos los derechos reservados.
