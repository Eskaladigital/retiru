# RETIRU — Marketplace de Retiros y Escapadas

Plataforma web bilingüe (ES/EN) donde las personas descubren y reservan retiros y eventos centrados en **yoga, meditación y ayurveda**, y los organizadores publican y gestionan sus eventos sin cuota de suscripción (comisión escalonada por retiro).

> "Airbnb de los retiros" — pensado para España y el mercado hispanohablante. Los **retiros se organizan desde España** pero pueden **celebrarse también en Marruecos y Portugal** (destinos internacionales habilitados en la tabla `destinations`).

**Amplitud de la oferta (desde 2026-07-24):** además de retiros de varios días, la plataforma soporta **eventos de un día** con duración en horas (clases de yoga, sesiones de terapia, talleres, experiencias de bienestar…) y **eventos periódicos** (una clase semanal se publica una vez y Retiru mantiene vivas las próximas fechas automáticamente). Sin precio mínimo (PVP > 0 €). Ver secciones «Eventos periódicos» y «Precio público».

---

## Idiomas del producto

Retiru publica contenido únicamente en **español** (`/es`, campos `*_es`) e **inglés** (`/en`, campos `*_en`). No hay más idiomas en la web, la base de datos ni los emails transaccionales.

**Regla para colaboradores y agentes de IA:** el idioma en que alguien coordina el trabajo (hebreo, chino, francés, etc.) **no cambia** el idioma del contenido que se crea o edita. Da igual cómo se hable en el chat: páginas, retiros, blog, SEO, metadatos, scripts de contenido y copys de UI van siempre en **es/en** según la convención de cada ruta o campo.

- Puedes **responder en el chat** en el idioma de quien escribe; lo entregable para el producto sigue siendo es/en.
- **No** traducir el producto al idioma del chat salvo petición explícita de añadir un idioma nuevo al sitio.
- Partes solo en español (p. ej. área de cuenta `/es/perfil`, `/es/mis-*`) vs bilingües (fichas públicas, panel organizador, landings SEO): ver `docs/ROUTES.md` → *Selector de idioma*.
- Regla persistente del agente: `.cursor/rules/contenido-idiomas-producto.mdc`.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Estilos | Tailwind CSS, Radix UI, Lucide Icons |
| Backend | Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions) |
| Pagos | Stripe (PVP = precio público por persona; el asistente paga ese importe íntegro; **comisión escalonada**: 0 % 1.er retiro, 10 % 2.º, 20 % a partir del 3.º — cada retiro mantiene su nivel; cobro 100 % al reservar salvo flujo «mínimo viable»; payout manual; reembolsos vía webhooks) |
| Emails | SMTP OVH (nodemailer): transaccionales + CRM campañas (`src/lib/mailing/transport.ts`) |
| i18n | next-intl (ES base + EN completo) |
| Formularios | React Hook Form + Zod |
| Deploy | Vercel |

---

## Requisitos previos

- **Node.js** 18+ y **npm** (o pnpm/yarn)
- Cuenta en [Supabase](https://supabase.com) — necesaria para datos (retiros, centros, blog, tienda)
- Cuenta en [Stripe](https://stripe.com) (opcional — necesario solo para el flujo de pagos)
- Buzón SMTP (OVH/Zimbra u otro) — **obligatorio para enviar** reservas, claims, retiros, crons de recordatorio, etc. Variables `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` (mismo bloque que `/administrator/mails` y `mailing-tick`)

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
| `ONLINE_PAYMENTS_ENABLED` | (opcional) `0`/`false` = modo lanzamiento: inscripción sin cobro; `1`/`true` = forzar cobro. Si se omite, se deduce de si `STRIPE_SECRET_KEY` parece una clave real (`sk_test_` / `sk_live_`) |
| `NEXT_PUBLIC_ONLINE_PAYMENTS` | (opcional) Misma semántica para la UI de fichas; si se omite, se deduce de la publishable key |
| `SMTP_HOST` | Servidor SMTP (p. ej. `ssl0.ovh.net`) · transaccionales + campañas |
| `SMTP_PORT` | `465` (SSL) típico OVH |
| `SMTP_USER` | Usuario del buzón (p. ej. `contacto@retiru.com`) |
| `SMTP_PASSWORD` | Contraseña del buzón |
| `SMTP_FROM_EMAIL` | (opcional) Remitente; por defecto = `SMTP_USER` |
| `SMTP_FROM_NAME` | (opcional) Nombre remitente; por defecto `Retiru` |
| `SMTP_STRICT_TLS` | (opcional) `true` para no relajar TLS (útil solo si la red no inyecta CA) |
| `SMTP_INTERNAL_COPY_EMAIL` | (opcional) BCC archivo en cada transaccional; vacío = desactiva. Sin variable → `contacto@retiru.com`. Alias legado: `RESEND_INTERNAL_COPY_EMAIL` |
| `NEXT_PUBLIC_APP_URL` | URL base de la app |
| `NEXT_PUBLIC_APP_NAME` | Nombre de la app (`Retiru`) |
| `OPENAI_API_KEY` | (opcional) Descripciones IA, blog, centros y **portadas con IA** (eventos, artículos de blog y centros): agente **GPT-4o** sintetiza un dossier en un prompt en español; **GPT Image 1.5** genera la imagen panorámica (`POST /api/retreats/generate-cover-image`, `POST /api/admin/blog/generate-cover-image`, `POST /api/centers/generate-cover-image`; definir también en Vercel). Objetivo visual: **fotografía editorial hiperrealista**, evitando look ilustrado o “IA” |
| `ANTHROPIC_API_KEY` | (opcional) Moderación de contenido de retiros antes de publicar (`POST /api/admin/retreats/moderate`, Claude vía SDK `ai`). Si no está definida, el flujo de aprobación en admin **omite** la revisión automática |
| `NEXT_PUBLIC_TINYMCE_API_KEY` | (opcional) Clave [Tiny Cloud](https://www.tiny.cloud/) para el editor visual de la **descripción** en crear/editar evento (`/es/mis-eventos/...`) y del **cuerpo del artículo** en `/administrator/blog/...`. Si está vacía se usa `no-api-key` (solo adecuado en desarrollo; en producción conviene clave y dominio aprobados) |
| `GOOGLE_PLACES_API_KEY` | (opcional) Reseñas/horario/rating Places — **no** fotos (Place Photo) |
| `CRON_SECRET` | (recomendado en producción) Secreto `Bearer` para `POST /api/cron/*` (`sla-deadlines`, `payment-deadlines`, `event-reminders`, `review-requests`, `mailing-tick`). Si está vacío, los cron no exigen autorización (solo aceptable en local) |

> **Nota:** Supabase es necesario para que la app muestre retiros, centros, blog y tienda. Sin él, las páginas mostrarán listas vacías.

> **`SUPABASE_SERVICE_ROLE_KEY`:** operaciones de servidor habituales; opcionalmente `POST /api/storage/retreat-images` (legacy). El wizard de **Mis eventos** sube fotos al bucket `retreat-images` **desde el navegador** con RLS (carpeta `retreats/`), sin pasar el archivo por la función serverless.

---

## Scripts disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo (puerto 3000)
npm run build            # Build de producción
npm run start            # Servidor de producción
npm run lint             # Linter (ESLint)
npm run supertester      # Playwright: URLs del sitemap + login/registro (SEO, tiempo de carga, trazas). Servidor en marcha; primera vez: `npx playwright install chromium`
npm run db:types         # Generar tipos TypeScript desde el esquema de Supabase
npm run db:verify-schema       # Comprueba esquema vía .env.local (031a/031b, user_roles, bucket organizer-docs, pasos por org)
npm run db:verify-migrations   # Contrasta TODAS las migraciones (tablas+columnas, vistas, buckets, enums y RPCs clave) contra la BD real vía PostgREST; funciones trigger/RLS/índices no son verificables por esta vía
npm run verify-shop-survey-db  # Tabla + RPC encuesta tienda y unicidad anónima (migraciones 030 + 032)
node scripts/generate-seo-content.mjs   # Rellenar intros/FAQ/meta en categories y destinations (opciones: --categories, --destinations, --force)
npm run seo:type-province                # Genera intro + meta + FAQ bilingüe por par tipo×provincia (tabla center_type_province_seo, migración 042)
npm run seo:type-province:dry            # Igual en modo dry-run (sin escribir). Flags comunes: --type=yoga --province=madrid --limit=N --concurrency=3 --city --city-min=N --all --force
npm run seo:sections                     # Contenido rico por capas (045): capas 2–5 → sections_es/en + serp_data. Flags: --layer=3|4|5|all --type= --province= --style= --dry-run --no-serp
npm run seo:sections:dry
npm run seo:audit-provinces              # Auditoría provincias duplicadas (§8.9 SEO-LANDINGS). --json · --with-centers
npm run seo:consolidate-provinces:dry    # Consolidar alias → slug canónico en centers + purgar SEO obsoleto
npm run seo:consolidate-provinces        # --execute (requiere revisar salida del audit)
npm run seo:prune-style-province:dry     # Purga filas de style_province_seo sin URL publicable (≥5 centros estilo×prov)
npm run seo:prune-style-province         # --execute + verificación HTTP 200 en producción
node scripts/check-seo-urls-status.mjs   # Comprueba status HTTP de landings del directorio (464 URLs típicas)
node scripts/_peek-seo.mjs ayurveda alava # Inspecciona intro/sections/FAQ de una fila center_type_province_seo
node scripts/moderate-retreat.mjs       # Probar moderación IA de un retiro por slug (requiere ANTHROPIC_API_KEY en .env.local)
npm run stripe:listen    # Escuchar webhooks de Stripe en local

# Centros — descripciones IA (scraping web + Google Places + OpenAI, temp 0.2)
# Tras generar ES, si hay OPENAI_API_KEY se traduce automáticamente a EN (description_en, services_en, horarios/precios).
node scripts/generate-all-descriptions.mjs            # Generar descripciones faltantes
node scripts/generate-all-descriptions.mjs --force    # Regenerar TODAS las descripciones
node scripts/generate-all-descriptions.mjs --limit 10 # Solo N centros
node scripts/generate-all-descriptions.mjs --dry-run  # Simular sin guardar
npm run centers:translate-en                          # Solo traducir centros con ES y sin EN (o --force)
npm run centers:places-sync                           # Reseñas + horario + rating Google Places → ficha SEO (sin fotos: Place Photo es caro)
npm run centers:places-sync:dry                       # Simulación Places sync
npm run centers:vaciar-genericas                       # Vaciar descripciones genéricas
npm run blog:backfill-slugs-en                        # Rellenar slug_en del blog desde title_en (opcional --dry-run)
npm run blog:translate-en                             # Traducir posts publicados ES→EN (OpenAI); --force retraduce todo
npm run blog:import-csv                               # Genera SQL desde CSV (validar títulos vs docs/BLOG-EDITORIAL.md)
npm run blog:import-csv:push                          # Igual + inserta/actualiza en Supabase (.env.local)
node scripts/generate-blog-articles.mjs               # Genera artículos con IA (temas: docs/BLOG-TITULOS-PROPUESTOS.md)
npm run blog:publish-queue                            # Cola completa: texto + portadas + fechas (ver --limit, --resume)
npm run blog:publish-queue:dry                        # Vista previa del calendario sin escribir
npm run blog:backfill-covers-ai                       # Portadas blog con el mismo agente que retiros (GPT-4o×2 + gpt-image-1.5); por defecto solo si portada vacía o URL de stock. Flags: `--dry-run`, `--force`, `--regenerate-blog-ai` (vuelve a generar portadas ya en `blog/ai-cover-*`), `--inline`, `--limit=N`, `--concurrency=2`, `--id=uuid`
npm run organizers:generate-dashboard-mockups        # 12 mockups IA (6 panel organizador + 6 beneficios centro) para las landings de organizadores; guarda en `public/images/` (GPT-4o×2 + gpt-image-1.5, `OPENAI_API_KEY` en `.env.local`)

### Blog — línea editorial

El blog **no promociona retiros por destino**. Publica contenido informativo que la gente busca (recetas, nutrición, tipos de yoga/meditación, aceites y tratamientos ayurvédicos) — la misma lógica que el contenido en redes. Documentación:

- **`docs/BLOG-EDITORIAL.md`** — qué sí / qué no, tono, categorías, scripts
- **`docs/BLOG-TITULOS-PROPUESTOS.md`** — cola de 100 títulos en orden de publicación

Generación con IA: `node scripts/generate-blog-articles.mjs --limit=10` (lee la cola del markdown).

# Centros — emails
npm run centers:emails        # Sincronizar emails desde CSV
npm run centers:emails-csv    # Solo desde directorio.csv

# Centros — redes (solo HTML de `website`, sin Google)
npm run centers:socials-report              # Resumen de columnas instagram/facebook vacías
npm run centers:scrape-socials              # Dry-run: detecta enlaces IG/FB en la web del centro
npm run centers:scrape-socials:update       # Igual y escribe en BD solo donde faltaban (ver flags --limit, --slug, --delay, --force)

# Centros — claims
npm run centers:claim-tokens                              # Generar tokens de reclamación

# Centros — tipos (solo yoga, meditación, ayurveda en directorio)
npm run centers:group-types                               # Reporte CSV (reglas + directorio)
npm run centers:group-types:update                        # Aplicar a BD (enum de 3 valores, migración 014)

# Centros — reclasificar con IA en los 3 tipos (OpenAI; antes de migración 014 en prod)
npm run centers:reclassify-three                          # CSV centros-tres-tipos-ia.csv
npm run centers:reclassify-three -- --limit 20
npm run centers:reclassify-three:update

# Centros — estilos (taxonomía SEO Fase 3 #10; tabla `styles` + `center_styles`, migración 044)
npm run centers:infer-styles:dry                          # Dry-run: clasifica descripciones con GPT-4o-mini y muestra cambios
npm run centers:infer-styles                              # Real: asigna estilos en BD. Flags: --min-confidence=0.7 --concurrency=3 --limit=N --id=uuid --force
node scripts/report-center-styles.mjs                     # Informe: distribución por estilo, cobertura, pares estilo×provincia, estilos huérfanos

# Centros — portadas / imágenes a WebP (Core Web Vitals Fase 3 #13)
npm run centers:covers-to-webp:dry                        # Dry-run: lista qué portadas y fotos de galería pasarían a WebP
npm run centers:covers-to-webp                            # Real: convierte `centers.cover_url` y `centers.images[]` a WebP. Flags: --keep-original --limit=N --id=uuid --quality=82 --cover-only

# Legacy (9 tipos; no usar tras migración 014)
npm run centers:infer-types-ai
npm run centers:infer-types-ai:update

# Centros — estadísticas
node scripts/quick-stats.mjs              # Resumen rápido (descripciones + emails)
node scripts/count-center-stats.mjs       # Total, con/sin email
node scripts/count-generic-descriptions.mjs # Contar descripciones genéricas

# Retiros
node scripts/seed-retreats.mjs           # Poblar retiros de ejemplo en Supabase
node scripts/count-retreats.mjs          # Contar retiros en BD
node scripts/assign-retreats-to-admin.mjs # Asignar retiros de ejemplo al admin
npm run retreats:push-alma-nomada        # Contenido ficha Alma Nómada (PDF) → Supabase vía .env.local
npm run retreats:fix-vinyasa-daily       # Vinyasa Rodalquilar → serie diaria (1,5 h) hasta 2027-12-31
npm run retreats:backfill-covers-ai    # Portadas IA (GPT Image 1.5) para retiros sin retreat_images; --dry-run, --limit=N, --replace-ai-covers
```

---

## Base de datos (Supabase)

### Contenido operativo (retiros, textos, filas de negocio)

Las carpetas `supabase/migrations/` y `supabase/seed/` sirven para **esquema**, **RLS**, **índices** y **datos iniciales reproducibles** en cualquier entorno.

Las actualizaciones puntuales de una ficha de retiro (descripciones, programa, incluidos, destino, etc.) **no** deben ir como nuevas migraciones SQL en el repo: se aplican con **scripts Node** que usan `.env.local` (`NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`), igual que `npm run blog:import-csv:push`. Así el agente o quien tenga el entorno puede escribir en la tabla sin que tú copies SQL en el dashboard.

En esos textos **no** deben figurar **teléfonos móviles ni emails de contacto** del organizador: el canal es siempre la ficha en Retiru (reserva o mensaje).

| Comando | Uso |
|--------|-----|
| `npm run retreats:push-alma-nomada` | Actualiza por slug el retiro Alma Nómada según el contenido acordado (PDF 1ª edición): destino Marruecos, textos ES/EN, incluidos, excluidos, `schedule`, meta. |
| `npm run retreats:fix-vinyasa-daily` | Convierte la clase Vinyasa Rodalquilar en serie diaria (1,5 h, interval 1, fin 2027-12-31, horizonte 7 fechas). |
| `npm run retreats:fix-alma-en-parity` | Solo alinea `description_en`, `summary_en` y meta ES/EN con el español limpio y el precio oficial (900 €), sin tocar `description_es` ni el programa. Útil si el EN quedó desfasado tras moderar el ES. |
| `npm run retreats:backfill-covers-ai` | Igual que la API: dossier completo desde Supabase → **GPT-4o** → **GPT Image 1.5** (`1536x1024`, `high`). Migrado desde DALL·E 3 por deprecación; prioridad absoluta al look de **fotografía real**. Opciones: `--dry-run`, `--limit=N`, `--replace-ai-covers`. |

Para otro retiro, añadir un script análogo en `scripts/` o generalizar con un JSON + slug (mismo patrón).

### Destinos internacionales (Marruecos y Portugal)

Aunque los retiros se organizan desde España, se permite celebrar el retiro en **Marruecos** o **Portugal** (vínculo cultural y logística cercana). Ambos países viven como filas en `destinations` con `kind='destination'` y código ISO en `country` (`MA` / `PT`):

```sql
slug='marruecos', country='MA', kind='destination'   -- en uso por el retiro de Alma Nómada
slug='portugal',  country='PT', kind='destination'   -- añadido para futuros retiros
```

Cuando un organizador crea/edita su evento en `/es/panel/eventos/...`, ambos aparecen automáticamente en el desplegable de "Destino" porque el wizard lee todos los destinos activos sin filtro de país. La ficha pública y los listados (`/es/retiros-retiru/...`) los tratan exactamente igual que los destinos españoles.

Para promover estos destinos a `kind='country'` con landing propia y colgar destinos hoja específicos (Marrakech, Sahara, Algarve, Lisboa, Porto…), ejecutar `node scripts/seed-geo-hierarchy.mjs` (idempotente: crea `marruecos-pais` y `portugal-pais` como alias country si ya existen como `destination` para no romper retiros con `destination_id` existente).

### Migraciones y seeds

Ejecutar en el **SQL Editor** de Supabase (con service_role) en este orden:

**Pares que no se pueden saltar (ni fusionar en un solo “Run”):** PostgreSQL exige que ciertos valores de enum existan y estén confirmados antes de usarlos en la misma transacción (p. ej. índices parciales, políticas RLS, `DEFAULT`). Por eso el repo parte el cambio en dos archivos seguidos:

| Primero | Después | Motivo |
|--------|---------|--------|
| `012_centers_user_proposals.sql` | `013_centers_user_proposals_rls.sql` | `pending_review` en `center_status` → luego `submitted_by`, índice y política |
| `018_full_payment_model.sql` | `019_full_payment_model_columns.sql` | Valores nuevos en `remaining_payment_status` → columnas payout y `DEFAULT` |
| `022_reserved_no_payment_status.sql` | `023_reserved_no_payment_index.sql` | `reserved_no_payment` en `booking_status` → índice parcial |
| `030_shop_product_interest_survey.sql` | `032_shop_product_interests_unique_fix.sql` | La 030 crea un `UNIQUE` sobre `(user_id, product_category)` que bloquea **más de un** voto anónimo por categoría; la 032 lo sustituye por índices únicos parciales |

Con **Supabase CLI** (`supabase link` + `supabase db push`) se aplican solas en orden. Con **SQL Editor**, ejecuta **un archivo por ejecución**, en orden numérico. Si pegas solo `013` sin `012`, verás `22P02` / `pending_review`.

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
11. `supabase/migrations/011_booking_rpc_functions.sql` — funciones RPC para gestión de bookings (`increment/decrement_confirmed_bookings`). **Nota histórica (2026-07-24):** el archivo original redefinía `generate_booking_number()` como `RETURNS TEXT`, chocando con la función de trigger homónima de 001; en el SQL Editor la transacción se revertía entera y las dos RPC quedaron sin crear en producción durante meses (las llamadas `rpc()` del código fallaban en silencio y el contador de plazas no se actualizaba). Archivo corregido y RPCs aplicadas en prod ese día; verificable con `npm run db:verify-migrations`.
12. `supabase/migrations/012_centers_user_proposals.sql` — añade valor enum `pending_review` (solo esta sentencia; evita error 55P04)
13. `supabase/migrations/013_centers_user_proposals_rls.sql` — columna `submitted_by`, índices y política RLS `ctr_submitted`
14. `supabase/migrations/014_center_type_three_disciplines.sql` — enum `center_type`: solo `yoga`, `meditation`, `ayurveda`
15. `supabase/migrations/015_categories_retreat_ayurveda.sql` — categoría de retiro `ayurveda` (home y filtro `tipo`)
16. `supabase/migrations/016_retreat_images_bucket.sql` — bucket para imágenes de retiros
17. `supabase/migrations/017_avatars_bucket.sql` — bucket para avatares
18. `supabase/migrations/018_full_payment_model.sql` — modelo pago 100%, parte 1: añade valores al enum `remaining_payment_status`
19. `supabase/migrations/019_full_payment_model_columns.sql` — modelo pago 100%, parte 2: columnas payout + defaults (ejecutar DESPUÉS de 018)
20. `supabase/migrations/020_handle_new_user_phone.sql` — teléfono obligatorio en profiles
21. `supabase/migrations/021_storage_blog_folder_policy.sql` — política RLS para subir imágenes a carpeta `blog/` (y `avatars/`) en bucket `retreat-images`
22. `supabase/migrations/022_reserved_no_payment_status.sql` — enum `reserved_no_payment`, columnas `payment_deadline` y `payment_reminder_sent` en `bookings` (índice en 023)
23. `supabase/migrations/023_reserved_no_payment_index.sql` — índice parcial `idx_bk_reserved` (ejecutar después de 022)
24. `supabase/migrations/024_backfill_min_attendees_equals_max.sql` — backfill `retreats.min_attendees = max_attendees` en datos legacy
25. `supabase/migrations/025_storage_retreat_images_bucket_ensure.sql` — idempotente: crea bucket público `retreat-images` + políticas (si en producción falta el bucket y fallan las subidas de fotos de eventos, ejecutar este SQL en el panel)
26. `supabase/migrations/026_centers_facebook.sql` — columna `facebook` en centros
27. `supabase/migrations/027_user_roles_table.sql` — tabla `user_roles` (multi-rol por usuario), migración de datos, funciones helper `has_role()` / `user_roles_array()`, actualización de `is_admin()` y políticas RLS de mensajería, trigger `tr_new_profile_role` para asignar `attendee` a nuevos usuarios
28. `supabase/migrations/028_categories_seo_fields.sql` — campos SEO en categorías
29. `supabase/migrations/028_tiered_commissions.sql` — comisiones escalonadas
30. `supabase/migrations/029_destinations_meta_seo.sql` — campos meta SEO en destinos
31. `supabase/migrations/030_shop_product_interest_survey.sql` — encuesta de interés de la tienda: tabla `shop_product_interests`, RLS, función `get_shop_interest_stats()`
32. `supabase/migrations/031a_verification_enum_extend.sql` — amplía enum `verification_step` con `economic_activity` e `insurance` (debe ejecutarse y commitearse antes de 031b)
33. `supabase/migrations/031b_organizer_verification_v2.sql` — sistema de verificación de organizadores: añade `contract_accepted_at` a `organizer_profiles`, `file_url` a `organizer_verification_steps`, actualiza trigger `handle_new_organizer` (5 pasos sin `personal_data`), crea bucket privado `organizer-docs` con políticas RLS, migra organizadores existentes verificados
34. `supabase/migrations/032_shop_product_interests_unique_fix.sql` — **tras 030**: corrige unicidad para que **varios visitantes anónimos** puedan votar la misma categoría (índices únicos parciales por `user_id` o `session_id`). Comprueba con `npm run verify-shop-survey-db`.
35. `supabase/migrations/033_fix_signup_trigger_chain.sql` — endurece la cadena de triggers del alta de usuario (`handle_new_profile` + rol `attendee` automático) para que no falle si un paso intermedio da error.
36. `supabase/migrations/034_masqi_alicante_cover_local_image.sql` — fix puntual: portada local para el retiro "Masqi Alicante".
37. `supabase/migrations/035_masqi_alicante_description_disambiguation.sql` — desambigua descripciones duplicadas del mismo retiro.
38. `supabase/migrations/036_centers_email_traceability.sql` — trazabilidad del origen del email en `centers` (útil para la campaña de claim).
39. `supabase/migrations/037_destinations_hierarchy.sql` — jerarquía en `destinations` (country / region / province / city) para el hub provincial y `getGeoNodeBySlug`.
40. `supabase/migrations/038_mailing_system.sql` — CRM de mailing: `mailing_campaigns`, `mailing_recipients`, vista `mailing_campaigns_stats`.
41. `supabase/migrations/039_mailing_campaigns_extended.sql` — amplía el CRM: campos para `batch_size_per_tick`, `max_per_hour`, flags de auto-pausa, templates, etc.
42. `supabase/migrations/040_support_chat_clear.sql` — `conversations.user_cleared_at` para soft-clear del chat de soporte del usuario.
43. `supabase/migrations/041_email_suppressions.sql` — tabla `email_suppressions` (opt-out RGPD) + columnas `marketing_opt_out_*` en `centers`.
44. `supabase/migrations/042_center_type_province_seo.sql` — **SEO Fase 1 #1/2/3**: tabla `center_type_province_seo` (intro, meta, FAQ bilingüe por par tipo×provincia) + RLS public read. Generada con `npm run seo:type-province`.
45. `supabase/migrations/043_center_type_province_city_seo.sql` — **SEO Fase 2 #6**: extiende `center_type_province_seo` con `city_slug` + `city_name`; sustituye el UNIQUE por dos índices parciales (provincial vs ciudad). 58 ciudades generadas en la primera pasada.
46. `supabase/migrations/044_center_styles.sql` — **SEO Fase 3 #10**: catálogo `styles` (24 estilos seed: kundalini, vinyasa, hatha, yin, ashtanga, aereo, prenatal, mindfulness, vipassana, zen, panchakarma, marma, abhyanga, shirodhara, etc.) + tabla puente `center_styles (center_id, style_id, source, confidence)` + trigger `check_center_style_type_match` + RLS public read. 441 centros clasificados con `npm run centers:infer-styles` (89 % cobertura).
47. `supabase/migrations/045_seo_sections.sql` — **SEO Fase 4**: columnas `sections_es/en`, `serp_data`, `suppress_reason` en `categories`, `destinations`, `center_type_province_seo`, `styles`; tabla `style_province_seo` (Cap. 4 estilo×provincia). Contenido rico con `npm run seo:sections` (capas 2–5; Cap. 1 nacional sigue en `src/lib/center-type-editorial.ts`).
48. `supabase/migrations/048_centers_google_places_data.sql` — **SEO fichas centro**: `google_reviews`, `google_opening_hours`, `google_data_synced_at` (aplicada en prod). Rellenar con `npm run centers:places-sync` (`GOOGLE_PLACES_API_KEY`) — solo reseñas/horario/rating; **nunca** descarga Place Photo (caro). Imágenes: las sube el centro o se buscan fuera de la API de Google. Si faltan columnas, fallback en Storage (`centers/{id}/places-meta.json`).
49. `supabase/migrations/049_relax_retreats_total_price_check.sql` — PVP sin mínimo (solo `> 0`), abre la plataforma a clases y eventos de ticket bajo.
50. `supabase/migrations/050_retreats_duration_hours.sql` — `duration_hours` para eventos de un día.
51. `supabase/migrations/051_retreat_series.sql` — eventos periódicos: tabla `retreat_series` + `series_id`/`is_series_next` en `retreats`.
52. `supabase/migrations/052_flexible_cancellation_default.sql` — default de política de cancelación al preset flexible de lanzamiento (100 % >7 d / 50 % >3 d). Aplicada y verificada en prod (2026-07-24).
53. `supabase/migrations/053_manual_confirmation_no_prepay.sql` — `bookings.organizer_approved_at`: confirmación manual sin pago por adelantado (solicitud → aprobación → enlace de pago). Aplicada en prod (2026-07-24).

**Verificar el estado de la BD frente a las migraciones:** `npm run db:verify-migrations` (parsea todos los `.sql` y contrasta tablas+columnas, vistas, buckets, enums clave y RPCs contra el proyecto de `.env.local`; funciones de trigger, triggers, RLS e índices no son verificables vía PostgREST). Para aplicar una migración concreta sin dashboard: `npm run db:apply-booking-rpcs` (011) / `npm run db:apply-manual-confirmation` (053) — requieren `DATABASE_URL` en `.env.local`; sin ella, pegar el archivo en el SQL Editor.

**Seeds** (después de las migraciones):

1. `supabase/seed/001_categories_destinations.sql` — categorías y destinos
2. `supabase/seed/002_sample_retreats.sql` — usuario demo + 10 retiros de ejemplo
3. `supabase/seed/003_sample_blog.sql` — 3 categorías de blog + 5 artículos  
   Opcional: tras generar con `npm run blog:import-csv`, ejecutar `supabase/seed/016_blog_from_csv.sql` en el SQL Editor para importar ~50 artículos del CSV (orden no alfabético).

### Capa de datos

Las páginas consumen datos a través de `src/lib/data/index.ts`:

- `getCategories(locale)`, `getDestinations(locale)`, `getDestinationBySlug(slug)`
- `getHomeShopProducts(limit)` — productos `shop_products` para la home (misma tabla que `/es/tienda`). La encuesta pública escribe en `shop_product_interests` (ver `docs/SHOP-SURVEY.md`); el admin agrega resultados con `get_shop_interest_stats()` en `/administrator/tienda`
- `getPublishedRetreats(filters)`, `getRetreatBySlug(slug)` — los listados y API usan **`start_date > hoy`** (fecha del servidor ISO) además de `published` + `end_date ≥ hoy`, para no mostrar retiros ya iniciados. La **ficha** `/es/retiro/[slug]` sigue resolviendo el retiro publicado aunque haya empezado.
- `getOrganizerBySlug(slug)`, `getActiveCenters(filters)`, `getCenterBySlug(slug)`
- `getCenterProvinces()` — provincias únicas con centros activos (para `generateStaticParams` y sitemap)
- `getCentersByProvince(slug)` — centros filtrados por provincia normalizada
- `getDestinationsWithRetreats()` — solo destinos con al menos 1 retiro publicado (para `generateStaticParams` y sitemap)
- `getBookingsForUser(userId)` — reservas del usuario con retiro e imagen de portada
- `getBookingById(bookingId)` — detalle de una reserva con retiro, organizador y destino
- Slugs para build: `getCenterSlugs()`, `getRetreatSlugs()`, `getBlogPostSlugs()`, `getOrganizerSlugs()`, `getProductSlugs()`, `getDestinationSlugs()`
- **SEO landings por tipo/provincia/ciudad**: `getCenterTypeProvincePairs()`, `getCenterTypeProvinceCityTriples(min)`, `getCenterTypeProvinceSeo(type, province)`, `getCenterTypeProvinceCitySeo(type, province, city)`, `getCitiesForCenterTypeProvince(type, province)`.
- **SEO landings por estilo** (Fase 3 #10): `getStylesForType(type)`, `getStyleBySlug(slug)`, `getCentersByStyle(slug, { province, limit })`, `getProvincesForStyle(slug, min)`, `getStyleProvincePairs(min)`, `getStyleProvinceSeo(type, style, province)`, `getStylesForCenter(centerId)`. Interface `Style` exportada. Usan `createStaticSupabase()` (no acceden a cookies). Umbral provincial: **≥5 centros** con el estilo en la provincia (`notFound()` si no).
- **Hub geográfico** (Fase 3 #7): `getGeoNodeBySlug(slug, kind)`, `getUpcomingRetreatsForDestinations(ids, limit)`, `getBlogArticlesMentioning(terms, limit)`.

Las APIs `/api/retreats`, `/api/centers` y `/api/catalog` exponen datos para búsqueda y filtros.

**Valoraciones en cards de retiros (listados públicos):** la estrella y el número entre paréntesis reflejan la media y el total de reseñas **del organizador** (`organizer_profiles`, agregadas desde `reviews` por `organizer_id`), no las del retiro concreto — así tiene sentido en ediciones futuras sin reseñas propias. Si el organizador no tiene reseñas visibles, **no se muestra** ese bloque (no se enseña `0.0 (0)`). En la **ficha del retiro** (`/es/retiro/[slug]`, `/en/retreat/[slug]`) el bloque principal de opiniones sigue siendo el **de ese retiro** (`retreat_id`); la valoración del organizador aparece **aparte** (p. ej. junto al nombre). Utilidades en código: `getOrganizerReviewStats` y `organizerHasRatingToShow` en `src/lib/utils/index.ts`.

---

## Estructura de URLs y landings

### Resumen de rutas públicas (ES)

| Ruta | Descripción |
|------|-------------|
| `/es` | Home genérica |
| `/es/buscar` | Buscador general |
| `/es/retiros-retiru` | Retiros y escapadas (hero + buscador + lista) |
| `/es/retiros-retiru/[slug]` | Retiros filtrados por ciudad (ej. `/es/retiros-retiru/murcia`) |
| `/es/retiro/[slug]` | Ficha de retiro: galería → breadcrumb → contenido + reserva (mismo orden visual que ficha centro) |
| `/es/centros-retiru` | Directorio de centros (hero + CentrosSearch) |
| `/es/centros-retiru/[slug]` | Centros filtrados por ciudad (ej. `/es/centros-retiru/murcia`) |
| `/es/centro/[slug]` | Ficha de centro: galería → breadcrumb → contenido + contacto (ej. `/es/centro/yoga-sala-madrid`) |
| `/es/reclamar/[token]` | Link mágico para reclamar un centro |
| `/es/destinos` | Destinos populares |
| `/es/destinos/[slug]` | Destino por slug |
| `/es/para-asistentes` | Para asistentes: garantías, pago seguro, verificación |
| `/es/para-organizadores` | Para centros y organizadores |
| `/es/tienda` | Tienda wellness (`shop_products`); si no hay productos, encuesta de interés (`ProductInterestSurvey`) |
| `/es/blog` | Blog |

### Dashboard de usuario (requiere login)

| Ruta | Descripción |
|------|-------------|
| `/es/mis-reservas` | Reservas como asistente |
| `/es/mensajes` | Bandeja de mensajes (conversaciones con organizadores + soporte) |
| `/es/mensajes/[id]` | Conversación individual (burbujas de chat) |
| `/es/perfil` | Datos personales, avatar, contraseña |
| `/es/mis-centros` | Centros reclamados, propuestas pendientes, reclamar o proponer centro nuevo |
| `/es/mis-eventos` | Lista de eventos/retiros creados |
| `/es/mis-eventos/nuevo` | Wizard crear evento (portada + hasta 8 fotos / galería, IA opcional) |
| `/es/mis-eventos/[id]` | Editar evento (misma gestión de imágenes) |
| `/es/mis-eventos/verificacion` | Verificación KYC del organizador (documentos; bucket `organizer-docs`) |

Cualquier usuario logueado (incluido el admin) accede a estas secciones desde el menú de usuario.

La ruta `/es/mis-eventos/verificacion` **redirige** a `/es/panel/verificacion` (misma verificación KYC). Equivalente en inglés: `/en/panel/verificacion`.

### Panel de administrador (protegido; acceso vía rol **admin** en `user_roles` / `is_admin()`)

| Ruta | Descripción |
|------|-------------|
| `/administrator` | Dashboard admin (KPIs y listas de pendientes desde Supabase) |
| `/administrator/usuarios` | Gestión de usuarios |
| `/administrator/organizadores` | Gestión organizadores |
| `/administrator/organizadores/[id]/verificar` | Revisión de documentos de verificación del organizador |
| `/administrator/retiros` | Gestión retiros (aprobar/rechazar) |
| `/administrator/centros` | Gestión centros |
| `/administrator/claims` | Gestión claims de centros |
| `/administrator/mensajes` | Moderación de conversaciones + respuesta en chats de soporte |
| `/administrator/blog` | Gestión blog |
| `/administrator/tienda` | Gestión tienda + resultados agregados de la encuesta de interés |
| `/administrator/reembolsos` | Reembolsos |
| `/administrator/reporting` | Reporting y métricas |

### Estrategia de landings (SEO)

- **1 landing genérica**: Home (`/es`) — no compite por términos específicos.
- **Listas por ciudad/destino** (slugs desde BD):
  1. `centros-retiru/[slug]` — Centros en [provincia/ciudad] ✅ Supabase
  2. `retiros-retiru/[slug]` — Retiros en [destino] ✅ Supabase
- **Retiros por categoría** (URL pública `/es/retiros-yoga`, `/es/retiros-yoga/ibiza`, …): la carpeta App Router se llama **`cat-retiros/[category](/[destination])`** y se sirve via rewrite invisible del middleware. Razón histórica: en Next 14 las literales hermanas `retiros-retiru/`, `retiros-en/` rompían el match del segmento dinámico `retiros-[category]/`. Mismo patrón en EN (`cat-retreats/...`). Detalle en [`docs/ROUTES.md`](docs/ROUTES.md#%EF%B8%8F-patr%C3%B3n-de-rewrites-del-middleware-url-p%C3%BAblica--carpeta-app-router). Solo se generan combinaciones con al menos un retiro publicado.
- **Centros por tipo** (tres valores BD `yoga` / `meditation` / `ayurveda`; en URL ES `meditation` → `meditacion`): ej. `/es/centros/yoga`, `/es/centros/yoga/madrid`. Índice de tipos siempre; **tipo + provincia** solo si hay centros activos en esa pareja. Las rutas antiguas `/es/centros-*` redirigen **308** a `/es/centros/...`.
- **Centros por tipo + provincia + ciudad** (Fase 2 SEO #6): ej. `/es/centros/yoga/madrid/getafe`. Umbral ≥ 2 centros; intro y meta únicas por ciudad en `center_type_province_seo` (migración 043).
- **Centros por tipo + estilo** (Fase 3 SEO #10): ej. `/es/centros/yoga/estilo/vinyasa`, `/es/centros/yoga/estilo/vinyasa/barcelona`. Tabla puente `center_styles` (migración 044). Umbrales: ≥ 3 centros nacional, ≥ 5 provincial (menos → **404**). Renderizan con `dynamic = 'force-dynamic'` (no ISR) para evitar conflictos con `cookies()` en el layout padre. Contenido SEO Cap. 4 opcional en `style_province_seo` (migración 045); mantener alineada con URLs publicables vía `npm run seo:prune-style-province`.
- **Contenido SEO rico por capas** (Fase 4): bloques `sections_es/en` + FAQ ampliada en BD (migración 045). **Cap. 3 tipo×provincia (91 URLs):** generación completa (`npm run seo:sections -- --layer=3`). Renderer `src/components/seo/SeoSections.tsx` integrado en tipo×provincia, ciudad y estilo×provincia. Cap. 5 (ciudades), Cap. 2 (estilo nacional) y Cap. 4 pendientes de tanda masiva.
- **Hub provincial multi-disciplina** (Fase 3 SEO #7/#14): `/es/provincias/[slug]` (+ EN `/en/provinces/[slug]`). Canonical geográfico; 301 permanente desde `/es/centros-retiru/[slug]` cuando el slug resuelve a una provincia.

Detalle de slugs EN de categorías y del sitemap: [`docs/ROUTES.md`](docs/ROUTES.md), [`docs/SEO-LANDINGS.md`](docs/SEO-LANDINGS.md), [`PLAN_SEO.md`](PLAN_SEO.md) (roadmap completo y changelog).

**Generación estática condicional:** Provincias, destinos y pares categoría+destino / tipo+provincia solo entran en `generateStaticParams` (y en el sitemap) cuando hay datos; evita páginas vacías.

### Sitemap dinámico (`/sitemap.xml`)

El sitemap se genera automáticamente en cada deploy con ISR (revalidate 1h). Incluye **URLs bilingües** (ES + EN) para estáticas, fichas, listas por provincia/destino, landings por categoría y por tipo de centro, blog, etc. (el total depende de los datos en Supabase):

| Tipo | Slugs | URLs (ES+EN) |
|------|-------|-------------|
| Páginas estáticas (aprox.) | ~18 ES + ~18 EN | ~36 |
| Centros individuales | ~858 | ~1.716 |
| Centros por provincia | ~64 | ~128 |
| Retiros individuales | ~10 | ~20 |
| Retiros por destino | ~10 | ~20 |
| Retiros por categoría | variable | variable ×2 |
| Retiros categoría + destino | variable | variable ×2 |
| Centros por tipo (3) | 3 | 6 |
| Centros tipo + provincia | variable | variable ×2 |
| Centros tipo + provincia + ciudad | ~58 (umbral ≥ 2) | ~116 |
| Centros tipo + estilo (nacional) | ~18 (umbral ≥ 3) | ~36 |
| Centros tipo + estilo + provincia | ~44 publicables (umbral ≥ 5; **404** si menos) | ~88 |
| Provincias (hub multi-disciplina) | ~50 | ~100 |
| Blog | ~10 | ~20 |
| Destinos | ~12 | ~24 |
| Organizadores | ~1 | ~2 |
| Productos (tabla `products` en sitemap) | según BD | según BD ×2 |

Cada entrada incluye `alternates` hreflang ES/EN. Las páginas de tienda (`/es/tienda`, fichas) leen **`shop_products`** (`is_available`); el sitemap de productos consulta hoy **`products`** (`status=active`) — conviene mantener ambas tablas alineadas o unificar criterio en código.

Los totales (~1.956 u otras cifras) son **orientativos** según datos en Supabase en cada deploy.

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
| `/es/para-asistentes` | `/en/for-attendees` |
| `/es/para-organizadores` | `/en/for-organizers` |
| `/es/tienda` | `/en/shop` |
| `/es/retiros-[categoría]` (ej. `/es/retiros-yoga`) | `/en/retreats-[category]` (ej. `/en/retreats-yoga`) |
| `/es/retiros-[categoría]/[destino]` | `/en/retreats-[category]/[destination]` |
| `/es/centros/[tipo]` (ej. `/es/centros/meditacion`) | `/en/centers/[type]` (ej. `/en/centers/meditation`) |
| `/es/centros/[tipo]/[provincia]` | `/en/centers/[type]/[province]` |
| `/es/centros/[tipo]/[provincia]/[ciudad]` | `/en/centers/[type]/[province]/[city]` |
| `/es/centros/[tipo]/estilo/[estilo]` | `/en/centers/[type]/style/[style]` |
| `/es/centros/[tipo]/estilo/[estilo]/[provincia]` | `/en/centers/[type]/style/[style]/[province]` |
| `/es/provincias/[slug]` | `/en/provinces/[slug]` |

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
- El widget **no se muestra a administradores** (tienen su propia bandeja en `/administrator/mensajes`, no tiene sentido que se escriban a sí mismos)
- Al abrirlo por primera vez, el usuario ve el saludo de **Andrea** y **3 respuestas rápidas** (reserva · retiro · pago/reembolso) bilingües; los chips desaparecen en cuanto envía el primer mensaje
- Un solo chat de soporte por usuario (si ya existe, se reutiliza)
- **Cerrar conversación (soft-clear):** el usuario puede pulsar el icono de reinicio del header del widget para vaciar su vista. No se borran mensajes: se guarda `user_cleared_at = NOW()` en la conversación y el backend filtra `messages.created_at > user_cleared_at` solo para el propio usuario. Admin y organizadores siguen viendo todo el historial
- El admin puede ver y responder chats de soporte desde `/administrator/mensajes` (como "Andrea, responsable de atención al cliente")
- El admin puede iniciar conversaciones con cualquier usuario desde `/administrator/usuarios` o `/administrator/organizadores` (botón "Mensaje")
- Las conversaciones de soporte se distinguen con `is_support = true` en la tabla `conversations`
- Las conversaciones normales (usuario ↔ organizador) siguen en modo solo lectura para el admin

**Arquitectura:**
- Migraciones: `008_conversations_messaging.sql` (mensajería base) + `010_support_conversations.sql` (soporte) + `040_support_chat_clear.sql` (columna `user_cleared_at` para soft-clear del usuario)
- API: `POST/GET /api/messages/conversations`, `GET/POST /api/messages/conversations/[id]`, `POST/PATCH /api/messages/support` (`PATCH { action: 'clear' }` hace el soft-clear), `GET /api/admin/messages`, `POST /api/admin/messages/support`, `DELETE /api/admin/messages/[messageId]`
- UI usuario: `/es/mensajes` (lista + botón soporte) y `/es/mensajes/[id]` (chat con burbujas)
- UI usuario: widget de chat flotante en todas las páginas públicas (`SupportChatWidget`), oculto para administradores desde `PublicShell` (`!user.roles.includes('admin')`). Las páginas `/es/contacto` y `/en/contact` pueden abrir el mismo panel con «Iniciar chat» / «Start chat» mediante el evento `retiru:open-support-chat` (`src/lib/support-chat-events.ts`).
- UI organizador: `/es/panel/mensajes` y `/en/panel/mensajes` (lista + botón soporte; la vista EN reexporta la misma página que ES)
- UI admin: `/administrator/mensajes` (tabla + chat overlay flotante para soporte)
- Componentes: `src/components/messaging/AskOrganizerButton.tsx`, `src/components/chat/SupportChatWidget.tsx`

---

## Emails transaccionales (SMTP OVH)

Sistema de emails automáticos enviados por la plataforma en eventos clave. **Salida única:** nodemailer + las mismas variables `SMTP_*` que el cron de mailing. Todos bilingües (ES/EN) según `preferred_locale` del usuario. Por defecto se añade **BCC** a `contacto@retiru.com` (archivo interno), salvo que el destinatario principal ya sea ese buzón o que `SMTP_INTERNAL_COPY_EMAIL=` esté vacío.

**Vercel (producción):** las rutas servidor que envían estos correos (p. ej. `POST /api/admin/retreats` al aprobar un retiro) necesitan **`SMTP_HOST`**, **`SMTP_USER`**, **`SMTP_PASSWORD`** en el proyecto de producción. Si falta alguna o el SMTP rechaza la conexión, la aprobación **publica el retiro igual** pero la API devuelve **`emailNotification.sent: false`** y el admin muestra un aviso para corregir el entorno o reenviar con `npm run mail:retreat-approved`.

**Archivo central:** `src/lib/email/index.ts`

| Email | Destinatario | Cuándo se envía | Disparado por |
|-------|-------------|----------------|---------------|
| `sendBookingConfirmedEmail` | Asistente | Tras pagar el 100% (reserva confirmada) | Webhook Stripe / Organizador confirma |
| `sendReservationConfirmedEmail` | Asistente | Plaza reservada sin pago (`reserved_no_payment`, mínimo viable no alcanzado) | `POST /api/checkout` (flujo reserva sin Stripe) |
| `sendBookingRequestReceivedEmail` | Asistente | Solicitud enviada en retiro de **confirmación manual** (sin pago; el organizador tiene el SLA para responder) | `POST /api/checkout` |
| `sendBookingRequestApprovedEmail` | Asistente | El organizador acepta su solicitud: enlace de pago con deadline (o aviso de que falta el mínimo) | `PATCH /api/bookings/[id]` (`confirm` sobre solicitud) |
| `sendNewBookingToOrganizerEmail` | Organizador | Cuando recibe una nueva reserva pagada o una solicitud sin pago (confirmación manual) | Webhook Stripe · `POST /api/checkout` |
| `sendMinViableReachedEmail` | Asistente | Mínimo de plazas alcanzado: enlace para pagar antes del deadline | Lógica tras nueva reserva en `POST /api/checkout` |
| `sendMinViableReachedToOrganizerEmail` | Organizador | Mínimo alcanzado: el evento se confirma en cuanto paguen los inscritos | Misma ruta |
| `sendPaymentDeadlineReminderEmail` | Asistente | Recordatorio tras vencer el primer deadline (+24 h de gracia) | `POST /api/cron/payment-deadlines` |
| `sendPaymentReminderEmail` | ~~Desactivado~~ | ~~Modelo anterior (pago 80% al organizador)~~ | ~~Cron diario~~ |
| `sendClaimApprovedEmail` | Usuario (propietario) | Admin aprueba claim de centro | `/api/admin/center-claims` |
| `sendClaimRejectedEmail` | Usuario (propietario) | Admin rechaza claim de centro | `/api/admin/center-claims` |
| `sendRetreatApprovedEmail` | Organizador | Admin aprueba retiro (se publica) | `POST /api/admin/retreats` · `PATCH /api/admin/retreats/[id]` (solo `pending_review` → `published`) |
| `sendRetreatRejectedEmail` | Organizador | Admin rechaza retiro (necesita cambios) | `POST /api/admin/retreats` |
| `sendOrganizerVerifiedEmail` | Organizador | Admin verifica el perfil/KYC del organizador | `POST /api/admin/organizers/[id]` (`verify` o último paso aprobado) |
| `sendOrganizerRejectedEmail` | Organizador | Admin rechaza el perfil de organizador | `POST /api/admin/organizers/[id]` (`reject`) |
| `sendNewMessageEmail` | Usuario / Organizador | Nuevo mensaje en conversación o soporte | `/api/messages/conversations/[id]` |
| `sendBookingRejectedEmail` | Asistente | Organizador rechaza su reserva | `/api/bookings/[id]` |
| `sendBookingCancelledEmail` | Asistente + Organizador | Reserva cancelada / reembolso | `POST /api/bookings/[id]` (cancelación por el asistente) + Webhook Stripe (charge.refunded, si el reembolso no lo inició un flujo de cancelación propio) |
| Recordatorio pre-evento | Asistente | 7 y 2 días antes del retiro | Cron diario (10:00) |
| Solicitud de reseña | Asistente | 2 días después del retiro | Cron diario (11:00) |
| Broadcast del organizador | Asistentes del evento | Organizador envía mensaje masivo (opcional email) | `/api/organizer/events/[id]/broadcast` |
| `sendWelcomeEmail` | Usuario | Primera vez que verifica email (signup) | `/api/auth/callback` |
| `sendRetreatPendingReviewEmail` | Admin | Organizador envía retiro a revisión | `/api/retreats/[id]` (PATCH → `pending_review`) |
| `sendBookingExpiredEmail` | Asistente | Reserva o solicitud expirada porque el organizador no respondió dentro del SLA (`pending_confirmation` pagada — reembolso automático — o `reserved_no_payment` sin aprobar — sin nada que reembolsar). | `POST /api/cron/sla-deadlines` (horario) |
| `sendRetreatCancelledToAttendeeEmail` | Asistentes del evento | Organizador cancela un retiro | `/api/retreats/[id]` (POST → cancel) |
| `sendNewClaimPendingEmail` | Admin | Usuario solicita reclamar un centro (manual) | `/api/centers/claim` |
| `sendNewCenterProposalEmail` | Admin | Usuario propone un centro nuevo (pendiente revisión) | `/api/centers/propose` |
| `sendPaymentOverdueToOrganizerEmail` | ~~Desactivado~~ | ~~Modelo anterior (pago 80% al organizador)~~ | ~~Cron diario~~ |

**Bienvenidas por fase (valorar)**  
Hay **una** bienvenida genérica al verificar el email (`sendWelcomeEmail`). Complementos posibles:

| Fase | Objetivo | Cobertura hoy |
|------|----------|----------------|
| Usuario habitual | Explorar, reservar, favoritos | `sendWelcomeEmail` |
| Centro (propietario) | Tras reclamo exitoso del directorio | `sendClaimApprovedEmail` cuando admin aprueba el claim |
| Organizador | Homologación KYC y retiros | Aún no hay correo específico solo al **aceptar contrato** (`POST /api/organizer/contract`); sí al verificar perfil (`sendOrganizerVerifiedEmail`), al enviar a revisión (`sendRetreatPendingReviewEmail`) y al publicar (`sendRetreatApprovedEmail`). |

Plantillas HTML de referencia: carpeta `mailing/` (`mailing/README.md`). Envío efectivo (`sendTransactionalMail`): `src/lib/email/index.ts` + `src/lib/mailing/transport.ts`.

**Total: 24 emails activos** (2 desactivados del modelo histórico 80 % fuera de plataforma).

**Cron jobs (Vercel):** configurados en `vercel.json` (proteger con `Authorization: Bearer CRON_SECRET` si `CRON_SECRET` está definido):
- `0 * * * *` — `sla-deadlines` (cancela `pending_confirmation` con `sla_deadline` vencido —con reembolso Stripe— y solicitudes `reserved_no_payment` sin aprobar con SLA vencido —sin reembolso—; notifica al asistente con `sendBookingExpiredEmail`)
- `0 * * * *` — `payment-deadlines` (gracia +24 h y cancelación de reservas `reserved_no_payment` vencidas)
- `0 10 * * *` — `event-reminders` (recordatorio pre-evento 7 d / 2 d)
- `0 11 * * *` — `review-requests` (solicitud de reseña +2 d)
- `* * * * *` — `mailing-tick` (cron del módulo de campañas SMTP del panel)
- `0 5 * * *` — `series-occurrences` (eventos periódicos: genera las próximas fechas de cada serie activa y recoloca `is_series_next`)

> Las rutas legacy `/api/cron/payment-reminders` (modelo 80 % del organizador) se mantienen como no-op para retrocompatibilidad: ya no están programadas en `vercel.json`.

---

## Estructura del proyecto

```
src/
├── app/
│   ├── es/
│   │   ├── (public)/           # Páginas públicas (datos desde Supabase)
│   │   │   ├── destino-retiros/    # ⚠ Sirve /es/retiros-retiru(/[slug]) vía rewrite del middleware
│   │   │   │   ├── page.tsx
│   │   │   │   ├── EventosClient.tsx
│   │   │   │   └── [slug]/     # Por ciudad (murcia, barcelona...) o jerarquía
│   │   │   ├── cat-retiros/[category]/(+[destination])/
│   │   │   │                   # ⚠ Sirve /es/retiros-yoga, /es/retiros-yoga/ibiza vía rewrite
│   │   │   ├── geo-retiros/[slug]/
│   │   │   │                   # ⚠ Sirve /es/retiros-en/[slug] vía rewrite (force-dynamic)
│   │   │   ├── retiro/[slug]/  # Ficha retiro: galería → breadcrumb → contenido (retreat_images)
│   │   │   ├── centros-retiru/ # Centros (hero + CentrosClient)
│   │   │   │   ├── page.tsx
│   │   │   │   ├── CentrosClient.tsx
│   │   │   │   └── [slug]/     # Por ciudad
│   │   │   ├── centros/[tipo]/ # Landings por tipo (/es/centros/yoga, …/[provincia])
│   │   │   ├── centro/[slug]/   # Ficha centro: galería → breadcrumb → contenido
│   │   │   ├── buscar/         # Buscador unificado retiros + centros
│   │   │   ├── destinos/
│   │   │   ├── organizador/[slug]/
│   │   │   ├── para-asistentes/   # Garantías para asistentes
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
│   │   ├── (organizer)/        # Panel del organizador (/es/panel/…)
│   │   │   └── panel/          # Dashboard, eventos, mensajes, verificación, etc.
│   │   └── page.tsx            # Home ES
│   ├── api/
│   │   ├── messages/           # API mensajería (conversations, support)
│   │   └── admin/              # API admin (messages, center-claims)
│   ├── administrator/         # Panel admin (protegido, /administrator)
│   └── en/                     # Páginas públicas EN + (organizer)/panel (/en/panel/…)
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

- **Header**: enlaces a retiros-retiru, centros-retiru, tienda, para-asistentes, para-organizadores, blog. (Condiciones solo en footer.)
- **Menú de usuario** (logueado): Mis reservas, Mi perfil, Mis centros, Mis eventos. Enlace a **Administración** si el usuario tiene rol `admin` en `user_roles`.
- **Menú móvil (off-canvas)**: panel lateral deslizable desde la derecha, backdrop con blur, bloqueo de scroll, cierre al hacer clic fuera o en enlace.

> **Documentación**: [`docs/ROUTES.md`](docs/ROUTES.md) · [`docs/SEO-LANDINGS.md`](docs/SEO-LANDINGS.md) · [`docs/SHOP-SURVEY.md`](docs/SHOP-SURVEY.md) · [`docs/SCHEMA-REVIEW.md`](docs/SCHEMA-REVIEW.md) (auditoría BD / gaps) · [`docs/ESTRATEGIA-CRECIMIENTO.md`](docs/ESTRATEGIA-CRECIMIENTO.md) (estrategia de marketing y crecimiento — documento vivo).


---

## Modelo de negocio

### Retiros (marketplace) — Modelo "Booking" (pago 100 %) con comisiones escalonadas

- El **organizador publica gratis**. Sin suscripción ni comisión directa.
- Al reservar, el **asistente paga el 100 %** del precio total (PVP) a Retiru vía Stripe en un solo paso.
- **Comisiones escalonadas** según retiros previos del organizador con al menos 1 reserva pagada:

| Retiro | Comisión Retiru | Neto organizador |
|--------|-----------------|-------------------|
| 1.er retiro con reserva pagada | **0 %** | **100 %** |
| 2.º retiro con reserva pagada | **10 %** | **90 %** |
| 3.er retiro en adelante | **20 %** | **80 %** |

- Cada retiro **mantiene de forma permanente** su nivel de comisión asignado al crearlo.
- Ejemplo (comisión estándar): retiro de 500 € → el asistente paga 500 € → Retiru retiene 100 € (20 %) y transfiere 400 € (80 %) al organizador.
- **Ventajas**: un solo pago para el asistente, mayor conversión, control total del flujo financiero, sin pagos pendientes.
- **Métodos de pago (desde 2026-07-24)**: el checkout usa los **métodos automáticos de Stripe** — se ofrecen los que estén activados en el dashboard (tarjeta, **Bizum**, Apple/Google Pay, Klarna…) según importe, divisa y país del cliente. **Prohibido el pago fuera de la plataforma** (efectivo o transferencia directa al organizador): todo cobro pasa por Stripe para que quede registrado y Retiru capture su comisión.
- **Modo lanzamiento — inscripción sin cobro (temporal, desde 2026-07-30):** si Stripe no está configurado con claves reales (o `ONLINE_PAYMENTS_ENABLED=0`), `POST /api/checkout` **no** intenta cobrar: crea `reserved_no_payment` sin `payment_deadline`, avisa al asistente y al organizador, y el botón de la ficha dice «Reservar plaza (sin pago)». Cuando haya claves reales en Vercel, el cobro online se reactiva solo (`src/lib/payments.ts`). No es pago offline al organizador.
- **Cancelaciones**: el organizador elige entre 4 presets al crear el evento (flexible —default: 100 % >7 d / 50 % >3 d—, estándar, estricta, clase/taller —100 % hasta 1 día antes—; `CANCELLATION_PRESETS` en `NuevoEventoForm`, default en BD por migración 052). Si al asistente le corresponde reembolso según esa política, recibe ese importe íntegro en su método de pago. La compensación de la comisión de Retiru en supuestos de cancelación se regula en el **acuerdo comercial con el organizador**, no como retención adicional sobre el reembolso del asistente.
- **Garantía Retiru de 48 h**: todo asistente puede cancelar con reembolso del 100 % durante las 48 horas siguientes a reservar, si faltan más de 7 días para el inicio. Aplica por encima de la política del evento (cláusula 8 del contrato, `/condiciones`, ayuda y para-asistentes ES+EN).
- **Motor de cancelación**: el asistente cancela desde `/es/mis-reservas/[id]` (botón con preview del reembolso) → `POST /api/bookings/[id]` calcula el tramo (`getCancellationRefund` en `src/lib/utils`), marca `cancelled_by_attendee`, reembolsa vía Stripe (total o parcial) y avisa por email a ambas partes. Si el **organizador cancela el retiro** (`POST /api/retreats/[id]`), todas las reservas activas pasan a `cancelled_by_organizer` con **reembolso íntegro automático**. El webhook `charge.refunded` solo registra el importe (sin machacar estado ni duplicar emails) cuando el reembolso lo inició uno de estos flujos.
- **Visibilidad**: las cards (`EventCard`) y las fichas ES/EN muestran el badge «Cancelación gratuita hasta X días antes» cuando la política tiene un tramo al 100 %.
- **Confirmación manual de reservas — solicitud sin pago (desde 2026-07-24):** en retiros con confirmación manual (`confirmation_type: 'manual'`), el asistente **no paga al reservar**: su solicitud entra como `reserved_no_payment` con `sla_deadline` para que el organizador responda. El organizador la **acepta** (`PATCH /api/bookings/[id]`, marca `organizer_approved_at`) o la **rechaza** desde su panel. Al aceptar —y con el mínimo de participantes cubierto— el asistente recibe `sendBookingRequestApprovedEmail` con enlace de pago y deadline (misma maquinaria que el mínimo viable); al pagar, el webhook confirma la plaza directamente (`confirmed`, sin pasar por `pending_confirmation`). Si el SLA vence sin decisión, el cron `POST /api/cron/sla-deadlines` (horario) anula la solicitud (`sla_expired`) y avisa con `sendBookingExpiredEmail`; no hay nada que reembolsar porque no hubo pago. Las reservas antiguas ya pagadas en `pending_confirmation` conservan el flujo anterior (confirmar/rechazar con reembolso).

### Directorio de centros (suscripción)

- El directorio es de **pago**: **20 €/mes** (cuota fija) para los centros. Retiru no intermedia ni cobra comisiones en la contratación de servicios del centro; solo ofrece presencia en el directorio.
- Fase de lanzamiento: los centros importados disfrutan de **6 meses de cortesía** para que valoren el impacto.
- Tras los 6 meses, los centros que quieran mantener su ficha activa pasan a la cuota de 20 €/mes.
- Los centros que no respondan o no quieran pagar se eliminan (o se conservan los ~100 mejor valorados como base).

---

## Estrategia de crecimiento — Directorio de centros

> **Estrategia global de marketing y captación de oferta:** ver [`docs/ESTRATEGIA-CRECIMIENTO.md`](docs/ESTRATEGIA-CRECIMIENTO.md) — documento vivo con diagnóstico, plan de acción por frentes, propuesta de verificación progresiva de organizadores, métricas semanales y diario de sesiones de reflexión. Leerlo antes de cualquier conversación o cambio de estrategia.

### Contexto

Se han importado **~592 centros** de yoga, pilates, meditación, wellness y spa de toda España, seleccionados por su buen perfil en Google Maps (valoración, reseñas, actividad). Estos centros no se han registrado ellos mismos — los hemos incluido proactivamente.

### Fases

#### Fase 0 — Preparación de datos (actual)

| Tarea | Estado | Detalle |
|-------|--------|---------|
| Importar centros desde `directorio.csv` | ✅ Completado | 592 centros |
| Enriquecer descripciones con IA (scraping web + Google Places + OpenAI) | 🔄 En curso | ~857 centros total |
| Buscar emails faltantes (CSV + SerpAPI) | 🔄 En curso | 416 con email, 176 sin email |
| Generar descripciones en inglés | ✅ Implementado | Tras cada descripción ES (API admin + scripts) se llama a GPT para EN; `npm run centers:translate-en` para rellenar histórico |

**Scripts disponibles:**

```bash
node scripts/generate-all-descriptions.mjs            # Generar descripciones faltantes (+ traducción EN si hay OPENAI_API_KEY)
node scripts/generate-all-descriptions.mjs --force    # Regenerar TODAS (scraping web + Google Places + OpenAI)
node scripts/generate-all-descriptions.mjs --limit 5  # Solo N centros
npm run centers:translate-en                            # Rellenar solo campos EN para centros ya en ES
node scripts/count-generic-descriptions.mjs            # Contar descripciones genéricas
node scripts/quick-stats.mjs                           # Estadísticas rápidas
```

#### Fase 1 — Notificación (email de bienvenida + claim)

- Enviar `mailing/enviados/1-2026-04-01-retiru-bienvenida-centro.html` (campaña #1) a todos los centros con email.
- Mensaje: "Enhorabuena, tu centro ha sido seleccionado para Retiru. Te ofrecemos 6 meses de cortesía para que pruebes el directorio."
- Cada email incluye un **link mágico** (`/es/reclamar/{{TOKEN}}`) que permite al dueño reclamar su centro con un clic.
- Objetivo: que visiten su perfil, lo reclamen, validen la información y se registren.
- **Operativa:** se gestiona desde el CRM `/administrator/mails` (crear campaña, generar HTML con IA, audiencia, lanzar/pausar/reanudar). Backend en migraciones 038 + 039 y cron `/api/cron/mailing-tick` (envío en micro-lotes para respetar el límite de OVH ≈ 200 emails/h). Detalles: `mailing/README.md`.
- **Bajas (unsubscribe, RGPD):** cada mail incluye un enlace `https://www.retiru.com/api/unsubscribe?t=<token>` que hace one-click (también `List-Unsubscribe-Post` para Gmail/Outlook); el token marca `centers.marketing_opt_out_at`. Además, quien entre a `https://www.retiru.com/api/unsubscribe` **sin token** ve un formulario bilingüe (ES/EN vía `?lang=` o `Accept-Language`) para darse de baja introduciendo su email. Esa baja marca todos los `centers` con ese email como opt-out e inserta el email en la tabla `email_suppressions` (migración 041), de modo que si más adelante se da de alta un centro con ese mismo email el mailing lo descarta igualmente. Tanto el script `scripts/mailing.mjs` como el cron `mailing-tick` y `populateRecipients` consultan `email_suppressions` antes de enviar.
- **Panel de bajas:** en `/administrator/mails/bajas` el admin ve la lista completa de `email_suppressions` (con búsqueda por email o motivo), puede **añadir una baja manual** (por ejemplo cuando alguien la pide por WhatsApp: también marca los centros con ese email como opt-out, `source='admin'`) y **revertir una baja** puntual (elimina la fila de `email_suppressions`; no limpia el `marketing_opt_out_at` de los centros, ya que ese flag puede tener otros orígenes y se ajusta desde la ficha de cada centro). Endpoint: `GET/POST/DELETE /api/admin/mailing/suppressions`.

##### Flujo "Reclama tu centro"

El dueño de un centro puede vincularse como propietario verificado mediante:

1. **Link mágico (email):** el email de bienvenida contiene un token único que auto-aprueba el claim.
2. **Email match:** si el email del usuario registrado coincide con el del centro, se auto-aprueba.
3. **Solicitud manual:** el botón "Reclamar este centro" en la ficha pública crea un claim **pending** que un admin revisa. Si los emails no coinciden, **no** hay rechazo automático: solo pasa a revisión humana. Un claim **rejected** solo lo marca un admin (o se reabre a pending si el usuario vuelve a reclamar desde la ficha).
4. **Proponer centro nuevo:** desde `/es/mis-centros`, el usuario busca el establecimiento en Google Maps (mismo flujo que el admin al crear centro). Antes de enviar debe completar descripción, actividades/servicios y una imagen de portada: subirla desde su dispositivo o generarla con IA (`POST /api/centers/generate-cover-image`). Se crea un registro en `centers` con `status = pending_review`, `submitted_by = user_id`, `description_es`, `services_es`, `cover_url` obligatorio y, si procede, `images[]`. El admin aprueba en `/administrator/centros` (icono publicar): pasa a `active` y se asigna `claimed_by` al proponente.

**Tablas:** `center_claims` (claim con estado pending/approved/rejected) + `claim_tokens` (tokens para links mágicos). Propuestas: filas en `centers` con `status = pending_review` y `submitted_by`.

**API (claims):**
- `POST /api/centers/claim` — crear claim (auto-aprueba si email coincide)
- `POST /api/centers/propose` — proponer centro nuevo (usuario autenticado; queda pendiente de revisión)
- `GET/POST /api/admin/center-claims` — listar/aprobar/rechazar claims (solo admin)

**API (eventos/retiros del usuario):**
- `POST /api/retreats/create` — crear retiro (auto-crea organizer_profile si no existe)
- `PATCH /api/retreats/[id]` — actualizar retiro existente (solo propietario)

**Rutas:**
- `/es/reclamar/[token]` y `/en/claim/[token]` — páginas de link mágico
- `/administrator/claims` — panel de gestión de claims

**Script:** `npm run centers:claim-tokens` — genera tokens para centros con email (se incluyen en el email de bienvenida).

#### Fase 2 — Activación (email de eventos)

- Enviar `mailing/3-2026-04-28-retiru-crea-tu-evento.html` (campaña #3) unos días/semanas después.
- Mensaje: "Crea tu primer evento en Retiru. Retiros, talleres, masterclasses..."
- Objetivo: generar contenido y actividad en la plataforma.
- Audiencia: solo centros ya reclamados (`audience=claimed` en el CRM).

> Entre #1 y #3 va el recordatorio **#2** (`mailing/2-2026-04-19-retiru-recordatorio-centro.html`) a los centros aún **no reclamados** ~7-10 días tras la inclusión, recordando los 6 meses gratuitos en marcha.

#### Fase 3 — Monetización (mes 6)

- Contactar a los centros para evaluar su experiencia.
- Los que vean valor → pasan a cuota de 20 €/mes.
- Los que no respondan / no quieran pagar → se eliminan del directorio.
- Posible alternativa: conservar los ~100 centros con mejor valoración como base de cortesía.

### Métricas clave a seguir

| Métrica | Cómo se mide |
|---------|-------------|
| Tasa de apertura del email | Proveedor SMTP / estadísticas externas si se conectan |
| Centros que visitan su perfil | Analítica web (GA4) |
| Centros que se registran | Tabla `center_claims` con status=approved |
| Centros que crean eventos | Tabla `retreats` con organizer vinculado a centro |
| Conversión a pago (mes 6) | Manual / CRM |

---

## Roles y tipos de usuario

### Roles en base de datos (multi-rol)

Los roles se gestionan en la tabla `user_roles` (tabla puente, N roles por usuario). Un usuario tiene **al menos** el rol `attendee` y puede acumular varios roles simultáneamente.

```
user_roles: 'attendee' | 'organizer' | 'center' | 'admin'
```

La columna legacy `profiles.role` se mantiene por compatibilidad pero está deprecada; la fuente de verdad es `user_roles`.

**Funciones SQL helper:**
- `has_role(uid, 'admin')` — comprueba si el usuario tiene un rol concreto
- `user_roles_array(uid)` — devuelve array con todos los roles del usuario
- `is_admin(uid)` — alias de `has_role(uid, 'admin')`, usado en políticas RLS

**Helper TypeScript:** `src/lib/roles.ts` — `hasRole()`, `isAdmin()`, `isOrganizer()`, `isCenter()`, `getRolesFromSupabase()`, `assignRole()`.

### Tipos funcionales de usuario

| Tipo funcional | Roles en BD | Cómo se llega | Capacidades |
|---|---|---|---|
| **Visitante** | Sin cuenta | Navega sin registrarse | Buscar, ver retiros, centros, blog, tienda |
| **Asistente** | `attendee` | Se registra con email y teléfono obligatorio | Reservar retiros, gestionar perfil, reclamar centros |
| **Propietario de centro** | `attendee` + `center` | Reclama un centro (claim aprobado) o propuesta aprobada por admin | Todo lo de asistente + editar su centro, publicar eventos |
| **Organizador** | `attendee` + `organizer` | Crea su primer evento (auto) o el admin aprueba un retiro | Todo lo de asistente + crear/gestionar retiros |
| **Admin** | `attendee` + `admin` (+ otros) | Asignado manualmente | Todo + panel `/administrator`, modera claims, retiros, centros |

Un usuario puede combinar roles: por ejemplo, `attendee` + `organizer` + `center` + `admin`.

### Flujo de asignación de roles (automático)

1. **Registro**: todo usuario nuevo recibe el rol `attendee` (trigger `tr_new_profile_role`).
2. **Reclamar centro (claim aprobado)**: al aprobar un claim (admin o auto-aprobación por email match), se añade el rol `center` automáticamente vía `assignRole()`.
3. **Aceptar contrato de organizador**: al aceptar el contrato en `/es/panel/eventos` (entrada por `/es/mis-eventos`), se crea `organizer_profile` con `status: 'pending'`, se registra `contract_accepted_at`, se añade el rol `organizer` y se redirige a `/es/panel/verificacion` para iniciar el KYC.
4. **Aprobar retiro**: al aprobar un retiro desde `/administrator/retiros`, se añade el rol `organizer` al dueño (idempotente).

### Verificación del organizador (KYC)

Antes de poder publicar eventos, el organizador debe completar un proceso de verificación:

1. **Aceptar contrato**: al acceder a `/es/mis-eventos` (redirige a `/es/panel/eventos`) por primera vez, el usuario ve una pantalla bloqueante con el **contrato del organizador** completo, dividido en 12 cláusulas que reflejan la operativa real (objeto del servicio, comisiones escalonadas 0/10/20 %, KYC obligatorio, calidad y veracidad del contenido, prohibición de canales externos para eludir comisión, plazos operativos —48 h confirmación—, mínimo viable, política de cancelación, payouts, RGPD, suspensión y aceptación electrónica con valor probatorio). Componente bilingüe en `src/components/panel/ContratoOrganizador.tsx` (versión `1.1 · 2026-07`, añade la garantía Retiru de 48 h a la cláusula 8). El usuario debe marcar la casilla final «He leído íntegramente el contrato y acepto todas sus cláusulas» y pulsar **«Aceptar contrato y continuar a verificación»**. Esto crea el `organizer_profile` con `contract_accepted_at` y `status: 'pending'`, y redirige automáticamente a `/es/panel/verificacion` (paso 2).

   Las cláusulas viven en una **fuente única** (`src/lib/legal/organizer-contract.tsx`: `CONTRACT_VERSION`, `getOrganizerContractClauses(locale)`, componente `<OrganizerContractClauses>`) y se consumen tanto desde el contrato del panel como desde la página pública dedicada `/es/legal/contrato-organizador` (+ `/en/legal/contrato-organizador`), accesible para cualquier asistente, centro u organizador sin estar logueado. Cualquier cambio en las cláusulas se refleja automáticamente en los dos puntos.

2. **Subir documentación**: en `/es/panel/verificacion` (alias legado `/es/mis-eventos/verificacion`), el organizador sube 5 documentos:
   - **Documento de identidad** (DNI/NIE/pasaporte)
   - **Alta en actividad económica** (certificado de autónomo o escritura de sociedad)
   - **Seguro de responsabilidad civil** (póliza vigente)
   - **Datos fiscales** (NIF/CIF + documento acreditativo)
   - **Datos bancarios** (IBAN + certificado de titularidad)

   Los documentos se suben al bucket privado `organizer-docs` en Storage. La tabla `organizer_verification_steps` registra el estado de cada paso.

3. **Revisión por admin**: en `/administrator/organizadores/[id]/verificar`, el admin ve cada documento, lo descarga y aprueba o rechaza individualmente con motivo. Cuando todos los pasos están aprobados, `organizer_profiles.status` pasa automáticamente a `'verified'`.

4. **Mientras tanto**: el organizador puede crear eventos como borrador y enviarlos a revisión, pero el admin **no puede aprobar un retiro si el organizador no está verificado**. La tabla de retiros muestra "No verificado" junto al organizador y el botón Aprobar está deshabilitado.

**Texto público alineado con este flujo:** `/es/para-organizadores`, `/en/for-organizers`, `/es/ayuda`, `/en/help` y la FAQ rápida de `/es/contacto`.

### Verificación del primer evento (admin)

La **primera publicación** de un retiro exige perfil de organizador verificado y aprobación admin. El flujo:

1. Organizador acepta contrato → puede acceder a `/es/mis-eventos`
2. Crea evento → estado `draft`
3. Envía a revisión → estado `pending_review`
4. Admin revisa en `/administrator/retiros`:
   - Si organizador **no verificado** → botón Aprobar deshabilitado, aviso visual
   - Si organizador **verificado** → puede aprobar (`published`) o rechazar (`rejected` con motivo)
5. Si aprobado: el retiro se publica y es visible en el frontend

Cuando el organizador **ya tiene al menos un retiro publicado**, las nuevas publicaciones desde el panel pueden ir directo a `published` sin cola de revisión admin (confianza progresiva en API `PATCH /api/retreats/[id]`).

Esto protege la calidad de la plataforma y asegura que solo organizadores verificados documentalmente puedan tener la **primera** publicación; después se aplica el modelo de confianza progresiva.

### Estados visuales de retiros (derivados de fecha + reservas)

En el panel de admin (`/administrator/retiros`) y en «Mis eventos» del organizador, el estado `published` de BD se desglosa visualmente según las fechas y las reservas confirmadas:

| Estado visual | Condición | Badge |
|---------------|-----------|-------|
| **Publicado** | `status = published`, `start_date` futuro | Verde |
| **En curso** | `status = published`, entre `start_date` y `end_date`, con reservas confirmadas > 0 | Esmeralda |
| **Expirado** | `status = published`, `start_date` ya pasó y `confirmed_bookings = 0` | Naranja |
| **Finalizado** | `status = published`, `end_date` ya pasó y `confirmed_bookings > 0` | Gris/Slate |

Estos estados son **puramente visuales** (no modifican el enum `retreat_status` de la BD). Los filtros/pestañas del admin permiten filtrar por cada uno de ellos.

### Visualización de roles (admin)

En `/administrator/usuarios`, la columna "Rol" muestra **todos los roles** del usuario como badges individuales (Admin, Organizador, Centro, Asistente). El filtro permite seleccionar usuarios que **tienen** un rol concreto (no excluyente). La tabla incluye **registro** (`profiles.created_at`) y **último acceso** (`last_sign_in_at` de Supabase Auth vía service role).

### Dashboard del usuario (4 secciones)

Cualquier usuario logueado (incluido el admin) tiene acceso a:

1. **Mis reservas** — reservas como asistente
2. **Mi perfil** — datos personales, avatar, contraseña
3. **Mis centros** — centros reclamados, propuestas en revisión, CTA para reclamar en el directorio o proponer centro nuevo (Google Maps). Las propuestas y la edición de ficha exigen descripción, actividades/servicios e imagen: portada manual desde dispositivo o portada generada con IA, de modo que no haya perfiles públicos vacíos o sin foto.
4. **Mis eventos** — retiros/eventos creados; wizard para crear/editar con **plazas máximas** (`max_attendees`) y **mínimo viable** (`min_attendees`): umbral de inscritos a partir del cual el organizador se compromete a celebrar el retiro; en ficha pública se muestra progreso de reservas si el mínimo es mayor que 1. **Imágenes:** hasta **8** fotos por retiro (subida al bucket `retreat-images` desde el cliente + registro en `retreat_images` vía API); una es la **portada** (listados y cabecera de ficha), el resto forman la **galería** visible en la ficha pública; portada opcional con **IA** (dossier del evento → GPT-4o → GPT Image 1.5; `POST /api/retreats/generate-cover-image`) o generada al guardar si no hay ninguna foto

El admin tiene además acceso a `/administrator` desde el menú.

### Precio público (PVP) y reparto (organizador / Retiru)

En el wizard de **Mis eventos** el organizador indica el **PVP por persona** (precio público final que ve el asistente en la ficha). **No hay recargo extra** al asistente: paga exactamente ese importe (o reserva sin pago en el flujo de mínimo viable). La comisión de Retiru es **escalonada**: 0 % en el primer retiro con reservas pagadas, 10 % en el segundo, 20 % a partir del tercero. Cada retiro mantiene su nivel permanentemente. El formulario muestra el desglose en tiempo real (`OrganizerPriceBreakdown`) según el tier del organizador, obtenido de `GET /api/organizer/commission-tier`.

### Eventos periódicos (series con ocurrencias)

Un evento puede marcarse como **periódico** en el wizard al crearlo («se repite cada N días»; 7 = semanal, 14 = quincenal) **o convertirse después** desde la edición en el panel («Convertir en evento periódico», `POST /api/retreats/series`). Pensado sobre todo para eventos de un día (p. ej. clase de yoga al atardecer). Los eventos de un día (`start_date = end_date`) indican además su **duración en horas** (`retreats.duration_hours`). Funcionamiento:

- La recurrencia se guarda en la tabla **`retreat_series`** (migración 051): `interval_days`, `occurrences_ahead` (cuántas fechas futuras se mantienen publicadas, por defecto 4, máx. 8), `series_end_date` opcional y `skip_dates` (fechas cerradas por vacaciones).
- Cada fecha es una **fila normal de `retreats`** (ocurrencia) clonada del master al publicarse este, con su propio slug (`slug-master-AAAAMMDD`), aforo y reservas: checkout, SLA, recordatorios y reseñas funcionan sin cambios. **No se generan infinitas filas**: horizonte rodante repuesto por el cron diario `series-occurrences` (`src/lib/series.ts` → `ensureSeriesOccurrences`).
- **Listados públicos** (home, buscador, categorías, destinos, geo-landings, sitemap): solo aparece la próxima fecha de cada serie (columna `retreats.is_series_next`). La **ficha pública** muestra chips de «próximas fechas» que enlazan a las fichas hermanas.
- **Reserva en la ficha (desde 2026-07-30):** en eventos periódicos el botón de reservar abre un **selector**: *solo esta fecha* (flujo normal) o *elegir varias fechas en un calendario* (`SeriesCalendarModal`: multiselección de las fechas futuras publicadas — otra fecha suelta, cada lunes, todas… — con las ya reservadas marcadas ✓ y las completas deshabilitadas; datos frescos vía `GET /api/retreats/series/[id]`; horizonte máximo de inscripción anticipada: **7 semanas** — `SERIES_BOOKING_HORIZON_DAYS` en `src/lib/series.ts`). Al confirmar, `POST /api/checkout` con `{ seriesId, retreatIds }` crea una reserva `reserved_no_payment` por fecha elegida (sin `retreatIds`, todas); email resumen al asistente con la lista de fechas y aviso único al organizador. En **Mis reservas**, cada serie con reserva activa muestra «Ampliar o modificar inscripción» (mismo calendario; la cancelación de días sueltos se hace desde el detalle de cada reserva). Con el cobro online activo, cada fecha se paga por separado desde Mis reservas dentro de su plazo.
- **Panel organizador**: badge «Periódico», y en la edición una sección «Fechas programadas» para **cerrar fechas sin reservas** (vacaciones; se añaden a `skip_dates` y no se regeneran) o **detener la serie** (`is_active = false`; las fechas ya publicadas siguen su curso). Una fecha con reservas activas **no puede cerrarse**: el organizador la gestiona con sus asistentes o la celebra. Gestión vía `POST /api/retreats/series/[id]` (`close_date` / `stop`).
- **Comisión escalonada**: una serie completa cuenta como **1 retiro** para el tier (las ocurrencias heredan el `commission_percent` del master); ver `countPaidRetreatUnits` en `src/lib/series.ts`.

### Flujo de reserva con mínimo viable ("crowdfunding de plazas")

Cuando un retiro tiene `min_attendees > 1`:

1. **Reserva sin pago** — Los primeros asistentes reservan plaza sin pagar. Estado: `reserved_no_payment`.
2. **Mínimo alcanzado** — Cuando `confirmed_bookings + reserved_no_payment >= min_attendees`:
   - Se calcula un deadline de pago: `min(ahora + 72h, start_date - 24h)`.
   - Se envía email a todos los inscritos con enlace de pago y plazo.
   - Se notifica al organizador que el mínimo se ha cumplido y se compromete a celebrar el evento.
3. **Pago por los inscritos** — Cada inscrito paga vía Stripe antes del deadline (`POST /api/checkout` con `bookingId` de su reserva). Si paga, su booking pasa a `pending_payment` → Stripe webhook → `confirmed` (o directamente `confirmed` si era una solicitud de confirmación manual ya aprobada).
4. **Gracia si no paga** — Si vence el deadline sin pagar, se da +24h extra con un recordatorio por email. Si aún no paga, la reserva se cancela automáticamente (`cancelled_by_attendee`).
5. **Nuevos asistentes tras el mínimo** — Pagan al instante vía Stripe (flujo estándar) si el retiro es de confirmación automática; con confirmación manual siguen entrando como solicitud sin pago hasta que el organizador las apruebe.

**Cruce con confirmación manual:** si el retiro es manual y con mínimo > 1, el enlace de pago del «mínimo alcanzado» solo se envía a las solicitudes **ya aprobadas** por el organizador (`organizer_approved_at`); las demás lo reciben al ser aprobadas.

El cron `/api/cron/payment-deadlines` (cada hora) gestiona la gracia y cancelación automática.

### Flujo de autenticación

- **Solo email/contraseña** (Google OAuth desactivado por ahora).
- Registro (nombre, **teléfono obligatorio**, email, contraseña) → email de verificación → clic en enlace → cuenta activa → login. El teléfono se guarda en `profiles.phone` vía metadatos de Supabase y el trigger `handle_new_user`.
- Si el usuario intenta reclamar un centro sin estar logueado, se le redirige a **registro** (no a login) con `redirect` al centro. Si ya tiene cuenta, puede ir a login desde el registro.

---

## Funcionalidades principales

### Front público
- **Homepage** con H1 "Centros y retiros de yoga, meditación y ayurveda", sección "Dos mundos, un solo lugar" (Directorio + Retiros), HeroSearch (toggle Retiros/Centros), centros destacados, retiros populares (en cards: valoración del **organizador** si tiene reseñas) y destinos desde Supabase; bloque **Tienda** solo si hay filas en `shop_products` con `is_available`
- **Retiros** (`/es/retiros-retiru`, EN `/en/retreats-retiru`): hero + buscador (texto, destino, fechas) + lista con filtros; filtros/orden por valoración usan datos del **organizador** — Supabase
- **Retiros por ciudad** (`/es/retiros-retiru/[slug]`): retiros filtrados por destino/ciudad (misma lógica de estrellas en card que el listado general)
- **Ficha de retiro** (`/es/retiro/[slug]`, EN `/en/retreat/[slug]`): **galería** (portada + resto de `retreat_images`, hasta 8 en creación/edición), **breadcrumb debajo de las fotos** (como en centro), título y cuerpo; precio (PVP), progreso si hay mínimo viable, **reseñas del retiro** + valoración del organizador, CTA sticky en móvil — Supabase
- **Centros** (`/es/centros-retiru`, EN `/en/centers-retiru`): hero + CentrosSearch (texto, tipo, ciudad) + directorio con filtros — datos desde Supabase
- **Centros por ciudad** (`/es/centros-retiru/[slug]`): centros filtrados por ciudad
- **Ficha de centro** (`/es/centro/[slug]`, EN `/en/center/[slug]`): galería, breadcrumb, servicios, horarios, contacto — datos desde Supabase
- **Organizador** (`/es/organizador/[slug]`, EN `/en/organizer/[slug]`): perfil público con retiros publicados (en cada retiro del grid solo se muestra valoración si el organizador tiene reseñas)
- **Buscador** (`/es/buscar`, EN `/en/search`): búsqueda unificada retiros + centros con filtros (tarjetas de retiro: valoración del organizador cuando aplica)
- **Blog** (`/es/blog`, `/es/blog/[slug]`; EN `/en/blog/…`): artículos desde Supabase. **Línea editorial:** contenido informativo (recetas, nutrición, yoga, meditación, ayurveda) — no landings de retiros por destino. Ver `docs/BLOG-EDITORIAL.md` y cola `docs/BLOG-TITULOS-PROPUESTOS.md`.
- **Tienda** (`/es/tienda`, `/es/tienda/[slug]`; EN: `/en/shop`): productos desde `shop_products`; si el listado público está vacío, **encuesta de interés** (cada clic 1–5 se guarda al instante vía `POST /api/shop/product-interest`; comentario opcional con botón propio) → `shop_product_interests`. Admin: `/administrator/tienda` + `docs/SHOP-SURVEY.md`
- **Para asistentes** (`/para-asistentes`): garantías de pago seguro, organizadores verificados, soporte, comparativa vs contratación directa/redes
- **Para centros y organizadores** (`/para-organizadores`): secciones centros + organizadores
- **Condiciones** (`/condiciones`): modelo de precios transparente, política de cancelación y, al final, las tres tarjetas «Acuerdos contractuales» que enlazan con los tres documentos formales (en footer)
- **Documentos legales** — tres acuerdos diferenciados por figura, todos accesibles sin login:
  1. **Términos legales** (`/legal/terminos`, EN `/en/legal/terminos`): términos generales del visitante/usuario web (uso del servicio, propiedad intelectual, responsabilidad, jurisdicción).
  2. **Contrato del centro** (`/es/legal/contrato-centro`, EN `/en/legal/contrato-centro`): acuerdo del directorio para centros con ficha de pago — tarifa 20 €/mes, 6 meses de cortesía, veracidad, cesión de derechos de uso, reseñas, RGPD, baja. Cláusulas en `src/lib/legal/center-contract.tsx` (`CENTER_CONTRACT_VERSION`, componente `<CenterContractClauses>`). Versión actual: borrador `0.1 · 2026-04`; la aceptación electrónica desde el panel se activará al término del periodo de cortesía.
  3. **Contrato del organizador** (`/es/legal/contrato-organizador`, EN `/en/legal/contrato-organizador`): 12 cláusulas operativas que cada organizador acepta antes de publicar su primer retiro (ver "Verificación del organizador (KYC)").

### Dashboard de usuario (cualquier usuario logueado)
- **Mis reservas**: reservas como asistente con estados visuales; reservas `reserved_no_payment` con botón para pagar cuando corresponda (datos desde BD)
- **Mensajes**: bandeja de conversaciones con organizadores + botón "Contactar soporte" para chat con admin
- **Mi perfil**: datos personales, avatar, contraseña
- **Mis centros**: centros reclamados y propuestas pendientes; reclamar desde el directorio o proponer centro nuevo. Al proponer o editar un centro, la ficha debe conservar descripción, actividades/servicios y al menos una foto (`cover_url` o `images[]`), con opciones de subida manual y generación IA para portada.
- **Mis eventos**: lista de retiros/eventos creados con imagen, estado, ocupación
  - Wizard de creación en 5 pasos (Información —incluye portada y galería—, Detalles, Programa, Incluye, Precio)
  - Edición de eventos existentes con publicación desde borrador; mismas opciones de **portada + galería** (hasta 8 imágenes)
  - Auto-creación de `organizer_profile` al crear el primer evento
- **"Reclama tu centro"**: botón en cada ficha pública de centro + link mágico en email de bienvenida

### Panel de administrador (usuarios con rol `admin`)
- Dashboard con métricas generales
- **Usuarios** — tabla con todos los perfiles (buscador, filtro por rol)
- **Organizadores** — gestión de organizadores verificados (datos desde `organizer_profiles`)
- **Retiros** — gestión de retiros (aprobar/rechazar los `pending_review`, ver todos; moderación de contenido opcional con `ANTHROPIC_API_KEY` vía `POST /api/admin/retreats/moderate`)
- **Centros** — gestión de centros (buscador, filtros, exportar CSV/Excel, generar descripciones IA, editar, ver ficha pública, despublicar/publicar, aprobar propuestas de usuario `pending_review` → `active` + titular, eliminar). Las altas nuevas desde admin también requieren portada manual o IA.
- **Claims** — gestión de reclamaciones de centros (aprobar/rechazar)
- **Mensajes** — moderación de conversaciones usuario-organizador + lectura y respuesta en chats de soporte (como "Andrea")
- Gestión de tienda (productos, categorías, pedidos) y **resultados de la encuesta** de interés de productos
- Reembolsos y reporting
- Acceso en `/administrator` (middleware + comprobación de rol admin)

---

## Diseño

- **Mobile-first**, limpio, premium pero accesible
- **Paleta cálida**: terracotta, verde salvia, blanco roto, arena
- **Tipografía**: DM Serif Display (títulos) + DM Sans (cuerpo)
- Precio único claro para el asistente (PVP); el desglose 80/20 solo se explica al organizador en el formulario y en páginas legales/informativas

---

## Licencia

Proyecto privado. Todos los derechos reservados.
