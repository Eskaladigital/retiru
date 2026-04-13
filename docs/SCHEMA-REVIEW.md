# RETIRU — Revisión del Schema de BD vs Funcionalidades

Auditoría completa de todas las páginas (usuario, organizador, admin, públicas) contra los tipos definidos en `src/types/index.ts`.

**Orden de migraciones en Supabase:** el esquema “oficial” es la carpeta `supabase/migrations/` aplicada en orden numérico. Varios cambios van en **dos archivos seguidos** (enums + uso en la siguiente migración); no ejecutar solo la segunda. Detalle y tabla de pares: `README.md` → sección *Base de datos (Supabase)*.

---

## Resumen ejecutivo

El schema actual cubre bien el **80%** de las funcionalidades. Se han detectado **12 gaps** que necesitan nuevas tablas o campos para que la app funcione completamente.

| Prioridad | Gaps |
|-----------|------|
| **Crítica** | 3 (Invoice, Blog, ProductReview) |
| **Alta** | 5 (Refund, OrganizerProfile campos, notification preferences, verification steps, attendee tags) |
| **Media** | 4 (Product features/badge, analytics, naming inconsistencies) |

---

## 1. Tablas/tipos que FALTAN completamente

### 1.1 Invoice (Factura) — CRÍTICA

**Página afectada:** `/es/facturas`

La página de facturas del usuario muestra: id, fecha, concepto, importe, estado, PDF. No existe tipo ni tabla.

```
Tabla propuesta: invoices
─────────────────────────────────────
id              uuid        PK
invoice_number  text        UNIQUE (ej: INV-2026-001)
user_id         uuid        FK → profiles.id
booking_id      uuid        FK → bookings.id (nullable)
order_id        uuid        FK → orders.id (nullable)
concept         text        (ej: "Cuota gestión — Retiro Yoga Ibiza")
amount          numeric
currency        text        DEFAULT 'EUR'
status          text        (draft | issued | paid | voided)
pdf_url         text        nullable
issued_at       timestamptz
paid_at         timestamptz nullable
created_at      timestamptz DEFAULT now()
```

**Tipo TypeScript:**
```typescript
export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'voided';

export interface Invoice {
  id: string;
  invoice_number: string;
  user_id: string;
  booking_id: string | null;
  order_id: string | null;
  concept: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  pdf_url: string | null;
  issued_at: string;
  paid_at: string | null;
  created_at: string;
  // Relations
  user?: Profile;
  booking?: Booking;
  order?: Order;
}
```

---

### 1.2 Blog (Article + BlogCategory) — ✅ IMPLEMENTADO

**Páginas afectadas:** `/es/blog`, `/es/blog/[slug]`

Las tablas `blog_categories` y `blog_articles` existen en la migración inicial. Seed en `003_sample_blog.sql`. Conectado a Supabase.

```
Tabla propuesta: blog_categories
─────────────────────────────────────
id              uuid        PK
name_es         text
name_en         text
slug            text        UNIQUE
sort_order      int         DEFAULT 0

Tabla propuesta: blog_articles
─────────────────────────────────────
id              uuid        PK
title_es        text
title_en        text        nullable
slug            text        UNIQUE
excerpt_es      text
excerpt_en      text        nullable
content_es      text        (markdown o HTML)
content_en      text        nullable
category_id     uuid        FK → blog_categories.id
author_id       uuid        FK → profiles.id
cover_image_url text        nullable
read_time_min   int
is_published    boolean     DEFAULT false
published_at    timestamptz nullable
meta_title_es   text        nullable
meta_title_en   text        nullable
meta_desc_es    text        nullable
meta_desc_en    text        nullable
view_count      int         DEFAULT 0
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

**Tipos TypeScript:**
```typescript
export interface BlogCategory {
  id: string;
  name_es: string;
  name_en: string;
  slug: string;
  sort_order: number;
}

export interface BlogArticle {
  id: string;
  title_es: string;
  title_en: string | null;
  slug: string;
  excerpt_es: string;
  excerpt_en: string | null;
  content_es: string;
  content_en: string | null;
  category_id: string;
  author_id: string;
  cover_image_url: string | null;
  read_time_min: number;
  is_published: boolean;
  published_at: string | null;
  meta_title_es: string | null;
  meta_title_en: string | null;
  meta_description_es: string | null;
  meta_description_en: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
  // Relations
  category?: BlogCategory;
  author?: Profile;
}
```

---

### 1.3 ProductReview — CRÍTICA

**Páginas afectadas:** `/es/tienda/[slug]`

`Review` está ligada a `booking_id` + `event_id`. No sirve para productos.

```
Tabla propuesta: product_reviews
─────────────────────────────────────
id              uuid        PK
product_id      uuid        FK → products.id
user_id         uuid        FK → profiles.id
order_id        uuid        FK → orders.id (nullable)
rating          int         CHECK (1-5)
title           text        nullable
content         text
is_visible      boolean     DEFAULT true
created_at      timestamptz DEFAULT now()
```

**Tipo TypeScript:**
```typescript
export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  order_id: string | null;
  rating: number;
  title: string | null;
  content: string;
  is_visible: boolean;
  created_at: string;
  user?: Profile;
  product?: Product;
}
```

---

### 1.4 Refund — ALTA

**Página afectada:** `/administrator/reembolsos`

Booking tiene `refund_amount`, `refunded_at`, `cancellation_reason`, pero la página admin necesita una entidad con su propio estado y flujo.

```
Tabla propuesta: refunds
─────────────────────────────────────
id                  uuid        PK
booking_id          uuid        FK → bookings.id
attendee_id         uuid        FK → profiles.id
event_id            uuid        FK → events.id
amount              numeric
reason              text
status              text        (pending | approved | processed | rejected)
stripe_refund_id    text        nullable
admin_notes         text        nullable
requested_at        timestamptz DEFAULT now()
processed_at        timestamptz nullable
processed_by        uuid        FK → profiles.id nullable (admin)
created_at          timestamptz DEFAULT now()
```

**Tipo TypeScript:**
```typescript
export type RefundStatus = 'pending' | 'approved' | 'processed' | 'rejected';

export interface Refund {
  id: string;
  booking_id: string;
  attendee_id: string;
  event_id: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  stripe_refund_id: string | null;
  admin_notes: string | null;
  requested_at: string;
  processed_at: string | null;
  processed_by: string | null;
  created_at: string;
  // Relations
  booking?: Booking;
  attendee?: Profile;
  event?: Event;
}
```

---

## 2. Campos que FALTAN en tablas existentes

### 2.1 OrganizerProfile — ALTA

| Campo faltante | Páginas que lo necesitan | Propuesta |
|----------------|--------------------------|-----------|
| `location` | configuracion, organizador/[slug] | `location text` (ej: "Ibiza, Baleares") |
| `languages` | configuracion, organizador/[slug] | `languages text[]` (ej: ['es', 'en']) |
| `iban` | configuracion, verificacion | `iban text` (encriptado en BD) |
| `instagram` | — (público) | `instagram text` nullable |
| `phone` | — (contacto) | `phone text` nullable |

```sql
ALTER TABLE organizer_profiles ADD COLUMN location text;
ALTER TABLE organizer_profiles ADD COLUMN languages text[] DEFAULT '{"es"}';
ALTER TABLE organizer_profiles ADD COLUMN iban text;
ALTER TABLE organizer_profiles ADD COLUMN instagram text;
ALTER TABLE organizer_profiles ADD COLUMN phone text;
```

---

### 2.2 Centers — propuestas de usuario (✅ migraciones `012_centers_user_proposals.sql` + `013_centers_user_proposals_rls.sql`; 012 solo añade el enum, 013 el resto — requisito de PostgreSQL)

| Campo / tipo | Uso |
|--------------|-----|
| `center_status` incluye `pending_review` | Centro propuesto por usuario, no visible en directorio público |
| `submitted_by uuid` → `profiles(id)` | Quien envió la propuesta; al aprobar, admin asigna `claimed_by` y `status = active` |
| RLS `ctr_submitted` | El proponente puede hacer `SELECT` de su fila en `pending_review` |

**`center_type` (enum en `centers.type`):** tras la migración `014_center_type_three_disciplines.sql` solo existen `yoga`, `meditation`, `ayurveda`. Reclasificación masiva: `npm run centers:reclassify-three:update` (antes de aplicar 014 en producción, con el enum antiguo aún presente).

**`facebook` (text, nullable):** migración `026_centers_facebook.sql` — URL de la página pública del centro en Facebook (complementa `instagram`). Auditoría local de columnas vacías: `npm run centers:socials-report` (opciones `--list`, `--list-all`). Rellenado desde el HTML de `website` (sin Google): `npm run centers:scrape-socials` / `npm run centers:scrape-socials:update`.

---

### 2.3 Product — MEDIA

| Campo faltante | Página | Propuesta |
|----------------|--------|-----------|
| `features_es` | tienda/[slug] | `features_es text[]` (características del producto) |
| `features_en` | tienda/[slug] | `features_en text[]` |
| `badge` | tienda, tienda/[slug] | `badge text` nullable (ej: "Nuevo", "Más vendido") |

---

## 3. Tablas auxiliares que FALTAN

### 3.1 Notification Preferences — ALTA

**Página:** configuracion del organizador (6 tipos de notificación)

```
Tabla propuesta: notification_preferences
─────────────────────────────────────
user_id             uuid        PK, FK → profiles.id
new_booking_email   boolean     DEFAULT true
new_booking_push    boolean     DEFAULT true
new_message_email   boolean     DEFAULT true
new_message_push    boolean     DEFAULT true
new_review_email    boolean     DEFAULT true
new_review_push     boolean     DEFAULT false
booking_reminder    boolean     DEFAULT true
marketing_email     boolean     DEFAULT false
updated_at          timestamptz DEFAULT now()
```

---

### 3.2 Verification Steps — ALTA

**Página:** verificacion del organizador (4 pasos con estado individual)

```
Tabla propuesta: organizer_verification_steps
─────────────────────────────────────
id                  uuid        PK
organizer_id        uuid        FK → organizer_profiles.id
step                text        (personal_data | identity_doc | tax_info | bank_info)
status              text        (pending | submitted | in_review | approved | rejected)
submitted_at        timestamptz nullable
reviewed_at         timestamptz nullable
reviewed_by         uuid        nullable (admin)
notes               text        nullable
created_at          timestamptz DEFAULT now()
```

---

### 3.3 Attendee Tags — ALTA

**Página:** asistentes del organizador (CRM)

```
Tabla propuesta: organizer_attendee_tags
─────────────────────────────────────
id                  uuid        PK
organizer_id        uuid        FK → organizer_profiles.id
attendee_id         uuid        FK → profiles.id
tag                 text        (ej: "VIP", "Repetidor", "Internacional")
created_at          timestamptz DEFAULT now()

UNIQUE(organizer_id, attendee_id, tag)
```

---

### 3.4 Analytics / Page Views — MEDIA

**Página:** analiticas del organizador (origen de tráfico)

```
Tabla propuesta: page_views
─────────────────────────────────────
id                  uuid        PK
event_id            uuid        FK → events.id nullable
center_id           uuid        FK → centers.id nullable
product_id          uuid        FK → products.id nullable
source              text        (google | direct | instagram | facebook | retiru | other)
referrer            text        nullable
user_agent          text        nullable
ip_hash             text
created_at          timestamptz DEFAULT now()
```

---

## 4. Inconsistencias de naming (UI vs Types)

| UI (mock data) | Tipo en BD | Acción |
|----------------|------------|--------|
| `days` / `percent` (CancellationTier) | `days_before` / `refund_percent` | Usar nombres del tipo en UI |
| `day`, `title`, `items` (Schedule) | `day`, `title_es`, `items` (ScheduleDay) | Usar `title_es` / `title_en` |
| `name` (Product en UI) | `name_es` / `name_en` | Resolver con locale |
| `services` (Center en UI) | `services_es` / `services_en` | Resolver con locale |
| `schedule` (Center en UI) | `schedule_summary_es` / `schedule_summary_en` | Resolver con locale |
| `organizer.image` (retiro UI) | `OrganizerProfile.logo_url` | Usar `logo_url` |

---

## 5. Validaciones Zod pendientes

| Validación faltante | Uso |
|---------------------|-----|
| `invoiceSchema` | No existe |
| `blogArticleSchema` | No existe |
| `productReviewSchema` | No existe |
| `refundRequestSchema` | No existe |
| `profileUpdateSchema` | No existe (perfil solo usa mock) |
| `centerSchema` | No existe (admin crea centros) |
| `orderSchema` | No existe |
| `notificationPreferencesSchema` | No existe |

---

## 6. Resumen de tablas en Supabase

**Retiro — categorías públicas:** el seed inicial no incluía fila `ayurveda` en `categories`. La migración `015_categories_retreat_ayurveda.sql` la inserta (`slug = ayurveda`) para la home “Explora por enfoque” y el filtro `?tipo=ayurveda`. Hasta aplicarla, el front usa un fallback sintético en `filterPublicRetreatCategories`.

### Tablas que DEBEN existir (según types actuales)

| Tabla | Tipo TS | Estado |
|-------|---------|--------|
| `profiles` | Profile | ✅ Definido |
| `organizer_profiles` | OrganizerProfile | ✅ Definido (faltan campos) |
| `categories` | Category | ✅ Definido |
| `destinations` | Destination | ✅ Definido |
| `events` | Event | ✅ Definido |
| `event_images` | EventImage | ✅ Definido |
| `event_categories` | M2M | ✅ Implícito (Event.categories) |
| `bookings` | Booking | ✅ Definido |
| `conversations` | Conversation | ✅ Definido |
| `messages` | Message | ✅ Definido |
| `reviews` | Review | ✅ Definido |
| `notifications` | Notification | ✅ Definido |
| `centers` | Center | ✅ Definido |
| `center_reviews` | CenterReview | ✅ Definido |
| `products` | Product | ✅ Definido (faltan campos) |
| `product_categories` | ProductCategory | ✅ Definido |
| `orders` | Order | ✅ Definido |
| `center_claims` | CenterClaim | ✅ Definido (migración 006) |
| `claim_tokens` | ClaimToken | ✅ Definido (migración 006) |

**Ampliaciones recientes en `bookings` (migraciones 022–023):**

| Campo / valor | Uso |
|---------------|-----|
| `status = 'reserved_no_payment'` | Reserva de plaza sin cobro (retiros con `min_attendees > 1` hasta alcanzar el mínimo) |
| `payment_deadline` | Fecha límite para pagar tras alcanzar el mínimo (o `null` si no aplica) |
| `payment_reminder_sent` | Si ya se envió el email de gracia (+24 h) vía cron `payment-deadlines` |
| Índice parcial `idx_bk_reserved` | Bookings en `reserved_no_payment` con deadline (eficiencia del cron) |

### Tablas NUEVAS necesarias

| Tabla | Prioridad | Páginas | Estado |
|-------|-----------|---------|--------|
| `center_claims` | Crítica | centro/[slug], administrator/claims, mis-centros | ✅ Implementado (migración 006) |
| `claim_tokens` | Crítica | reclamar/[token], email bienvenida | ✅ Implementado (migración 006) |
| `invoices` | Crítica | facturas | Pendiente |
| `blog_categories` | Crítica | blog | ✅ Implementado |
| `blog_articles` | Crítica | blog | ✅ Implementado |
| `product_reviews` | Crítica | tienda/[slug] | Pendiente |
| `refunds` | Alta | administrator/reembolsos | Pendiente |
| `notification_preferences` | Alta | configuracion | Pendiente |
| `organizer_verification_steps` | Alta | verificacion | Pendiente |
| `organizer_attendee_tags` | Alta | asistentes | Pendiente |
| `page_views` | Media | analiticas | Pendiente |

---

## 7. Relaciones M2M que verificar en Supabase

| Relación | Tabla intermedia |
|----------|-----------------|
| Event ↔ Category | `event_categories` (event_id, category_id) |
| Order ↔ Product | `order_items` o JSON en `orders.items` |

Nota: `Order.items` está definido como `OrderItem[]` en el tipo, lo que sugiere que se almacena como JSON (no tabla intermedia). Esto es válido pero impide queries directas sobre items.

---

## 8. Campos calculados vs almacenados

| Campo | Tabla | ¿Almacenado o calculado? | Recomendación |
|-------|-------|--------------------------|---------------|
| `confirmed_bookings` | events | Almacenado (counter cache) | ✅ Correcto, actualizar con trigger |
| `available_spots` | events | Almacenado | ✅ `max_attendees - confirmed_bookings` con trigger |
| `avg_rating` | events, organizer_profiles, centers, products | Almacenado | ✅ Actualizar con trigger tras review |
| `review_count` | events, organizer_profiles, centers, products | Almacenado | ✅ Trigger |
| `view_count` | events, centers, products | Almacenado | ✅ Incrementar con RPC o Edge Function |
| `total_events` | organizer_profiles | Almacenado | ✅ Trigger |
| `total_bookings` | organizer_profiles | Almacenado | ✅ Trigger |
| `sold_count` | products | Almacenado | ✅ Trigger tras order completada |
| `penalty_score` | organizer_profiles | Almacenado | ✅ Trigger tras rejection/cancellation |

---

## 9. Plan de acción recomendado

### Fase 1 — Críticos (antes de producción)
1. Crear tabla `invoices` + tipo `Invoice`
2. ~~Crear tablas `blog_categories` + `blog_articles`~~ ✅ Hecho
3. Crear tabla `product_reviews` + tipo `ProductReview`
4. Añadir campos a `organizer_profiles`: `location`, `languages`, `iban`, `instagram`, `phone` (parcialmente en schema)

### Fase 2 — Altos (antes de beta)
5. Crear tabla `refunds` + tipo `Refund`
6. Crear tabla `notification_preferences`
7. Crear tabla `organizer_verification_steps`
8. Crear tabla `organizer_attendee_tags`
9. Añadir campos a `products`: `features_es`, `features_en`, `badge`

### Fase 3 — Medios (post-lanzamiento)
10. Crear tabla `page_views` para analíticas
11. Resolver inconsistencias de naming UI ↔ Types
12. Añadir validaciones Zod faltantes

---

## Actualización producto (abril 2026)

- **`retreat_images`:** el organizador puede subir hasta **8** URLs por retiro (bucket `retreat-images` + filas con `is_cover`, `sort_order`). La **ficha pública** (`/es/retiro/[slug]`, `/en/retreat/[slug]`) muestra la portada destacada y un bloque de **galería** con el resto de fotos. Creación/edición: `mis-eventos/nuevo`, `mis-eventos/[id]` y APIs `POST /api/retreats/create`, `PATCH /api/retreats/[id]`.
- **`shop_product_interests`:** votos por categoría de producto (1–5) y comentario opcional para la tienda «próximamente»; migraciones `030_shop_product_interest_survey.sql` + **`032_shop_product_interests_unique_fix.sql`** (unicidad anónima por `session_id`). Verificación: `npm run verify-shop-survey-db`. Documentación: `docs/SHOP-SURVEY.md`.

---

*Generado automáticamente. Última revisión: Marzo 2026 (texto de producto arriba: abril 2026).*
