# Mailings Retiru

Documentación práctica del sistema de emails de Retiru: qué plantillas hay, cómo probarlas, cómo mantenerlas y qué convenciones seguir.

> **Importante:** la carpeta `mailing/` está en `.gitignore`, así que los HTML NO se versionan. Los scripts y los iconos sí (están en `scripts/` y `public/email/`). Cuando hagas cambios en una plantilla, súbelos al entorno donde las uses (producción usa el mismo SMTP OVH que el resto de la app).

**Producción (panel + cron):** las campañas del admin (`/administrator/mails`) y el cron `POST /api/cron/mailing-tick` envían con **el mismo transporte SMTP** que los correos transaccionales (`src/lib/mailing/transport.ts`, `buildTransport`). Rate-limit OVH y reintentos están descritos más abajo; **no** hay otro proveedor de envío paralelo en Vercel.

**Bienvenidas por fase (producto):** hoy el envío programático «de bienvenida» al verificar email es `sendWelcomeEmail` → plantilla `app/14-welcome.html` (ver `README.md` tabla de emails). Una evolución habitual es **segmentar** tres mensajes: usuario general, centro tras claim aprobado (`sendClaimApprovedEmail` / plantilla 04), organizador tras homologación KYC (`sendOrganizerVerifiedEmail` / `app/20-organizer-verified.html` cuando exista en `mailing/app`). No obliga a nuevas plantillas hasta que copy y legal lo aprueben.

---

## 1. Estructura

```
mailing/
├── README.md                              ← este archivo
│
├── # ═══ Marketing (campañas numeradas) ═══   se envían con npm run mailing:*
├── 2-2026-04-19-retiru-recordatorio-centro.html   día 7-10 · recordatorio reclamación
├── 3-2026-04-28-retiru-crea-tu-evento.html        día 14-21 · activación organizadores
│   (cuando una campaña termina, se mueve a enviados/ con `npm run mailing:archive`)
│
├── firma-andrea.html                      firma HTML corporativa
│
├── app/                                   # ═══ Transaccionales (referencia ≥21; +20 organizador verificado, +21 organizador rechazado) ═══
│   ├── 01-booking-confirmed.html          confirmación de reserva
│   ├── 02-payment-reminder.html           recordatorio de pago
│   ├── 03-new-booking-organizer.html      nueva reserva (aviso al organizador)
│   ├── 04-claim-approved.html             reclamación aprobada
│   ├── 05-claim-rejected.html             reclamación rechazada
│   ├── 06-retreat-approved.html           retiro aprobado
│   ├── 07-retreat-rejected.html           retiro rechazado
│   ├── 08-new-message.html                mensaje recibido
│   ├── 09-booking-cancelled.html          cancelación de reserva
│   ├── 10-booking-rejected.html           reserva rechazada por organizador
│   ├── 11-event-reminder.html             recordatorio día evento
│   ├── 12-review-request.html             solicitud de reseña
│   ├── 13-broadcast.html                  comunicado masivo
│   ├── 14-welcome.html                    bienvenida usuario
│   ├── 15-retreat-pending-review.html     retiro pendiente revisión admin
│   ├── 16-booking-expired.html            reserva expirada
│   ├── 17-retreat-cancelled-attendee.html retiro cancelado (aviso asistente)
│   ├── 18-claim-pending-admin.html        claim pendiente revisión admin
│   ├── 19-payment-overdue-organizer.html  pago vencido
│   ├── 20-organizer-verified.html          perfil organizador verificado (KYC) — paralelo `sendOrganizerVerifiedEmail`
│   ├── 21-organizer-rejected.html          perfil organizador no verificado — `sendOrganizerRejectedEmail`
│   └── index.html                         catálogo visual
│
└── enviados/                              # historial de envíos reales
    └── 1-2026-04-01-retiru-bienvenida-centro.html
```

**Convención de nombres para campañas de marketing:**
`N-YYYY-MM-DD-<nombre-plantilla>.html` donde `N` es un número correlativo.
El script `npm run mailing:archive` mueve automáticamente el archivo a `enviados/`.

**Total activas (referencia local):** 21 transaccionales en `app/` (incl. 20–21 organizador) + 2 marketing en curso + 1 firma. El número exacto puede variar si falta crear el HTML local.

---

## 2. Probar un email

Script: `scripts/send-mailing-test.mjs` (Node, sin dependencias extras — solo `nodemailer`, ya en `package.json`).

### Por defecto

```bash
node scripts/send-mailing-test.mjs
```

→ Envía `retiru-recordatorio-centro.html` a `contacto@retiru.com` por SMTP de OVH.

### Flags disponibles

| Flag | Por defecto | Descripción |
|------|-------------|-------------|
| `--file=` | `retiru-recordatorio-centro.html` | Plantilla a enviar (relativa a `mailing/`, p.ej. `app/01-booking-confirmed.html`) |
| `--to=` | `contacto@retiru.com` | Destinatario |
| `--subject=` | Auto según archivo | Asunto del email |
| `--nombre=` | `tu centro` | Sustituye `{{NOMBRE_CENTRO}}` |
| `--location=` | `tu zona` | Sustituye `{{LOCATION}}` |
| `--from=` | `Retiru <contacto@retiru.com>` | Remitente (nombre + email) |
| `--provider=` | auto | `smtp` o `resend` (fuerza proveedor) |

### Ejemplos

```bash
# Probar la bienvenida con datos reales
node scripts/send-mailing-test.mjs \
  --file=retiru-bienvenida-centro.html \
  --nombre="Yoga Sala Madrid" \
  --location="Madrid" \
  --to=narciso@acttax.com

# Probar un transaccional
node scripts/send-mailing-test.mjs \
  --file=app/01-booking-confirmed.html \
  --subject="Prueba de confirmación"

# Forzar Resend en vez de SMTP
node scripts/send-mailing-test.mjs --provider=resend
```

### Configuración (`.env.local`)

Selección automática en `send-mailing-test.mjs` (solo scripts locales):

1. Si hay `SMTP_HOST + SMTP_USER + SMTP_PASSWORD` → usa **SMTP** (OVH).
2. Si no, si hay `RESEND_API_KEY` válida → usa **Resend** (solo fallback del script de prueba; **en producción Retiru el envío oficial es SMTP OVH**).
3. Si no hay nada, el script muestra las variables que faltan.

**Opción A · SMTP de OVH** (recomendado; coincide con Vercel):

```env
SMTP_HOST=ssl0.ovh.net
SMTP_PORT=465
SMTP_USER=contacto@retiru.com
SMTP_PASSWORD=********
SMTP_FROM_EMAIL=contacto@retiru.com      # opcional
SMTP_FROM_NAME=Retiru                    # opcional
SMTP_STRICT_TLS=false                    # opcional: true si tu red no tiene proxy AV
```

**Opción B · Resend** (solo para pruebas locales si no tienes SMTP; **no** es la vía de envío en producción Retiru):

```env
RESEND_API_KEY=re_XXXXXXXXXXXX
RESEND_FROM_EMAIL=Retiru <contacto@retiru.com>   # opcional
```

### Placeholders soportados

Los siguientes se sustituyen automáticamente en el preview:

- `{{NOMBRE_CENTRO}}` (nombre del centro)
- `{{LOCATION}}` (ciudad/provincia)
- `{{FIN_MEMBRESIA}}` (fecha en la que termina la membresía gratuita del centro; por defecto hoy + 6 meses, o `created_at + 6 meses` si usas `--center=<slug>`)
- `{{UNSUBSCRIBE_URL}}` (enlace de baja; en `mailing:send` se genera por destinatario; en `send-mailing-test.mjs` queda como literal)

Cualquier otro placeholder deberás sustituirlo manualmente antes de probar, o extender el script.

---

## 2.bis. Campañas masivas (sistema de envío + BD)

Para enviar una plantilla a cientos o miles de centros manteniendo un
histórico (quién recibió qué, cuándo, si falló, si se dio de baja), usa el
orquestador `scripts/mailing.mjs` con sus 4 subcomandos. Los datos viven en
las tablas `mailing_campaigns` y `mailing_recipients` (migración `038`).

Audiencias (`--audience=` en `create`):
- `all` (por defecto) — centros activos con email, excluye opt-out
- `claimed` — solo centros con claim aprobado
- `not_claimed` — solo centros aún no reclamados (ideal para recordatorios)
- `--test-emails=a@b.com,c@d.com` — lista manual (modo prueba interna)

### Ciclo de vida de una campaña

```bash
# 1. Crear la campaña y precargar destinatarios pending (dice cuántos salen)
npm run mailing:create -- \
  --template=3-2026-04-28-retiru-crea-tu-evento.html \
  --slug=crea-tu-evento-2026-04 \
  --subject="Crea tu primer retiro o taller en Retiru" \
  --audience=claimed \
  --number=3

# 2. Revisar lo que se va a enviar sin disparar SMTP
npm run mailing:send -- --slug=crea-tu-evento-2026-04 --limit=10 --dry-run

# 3. Enviar por tandas (con 800 ms de delay entre mails por defecto)
npm run mailing:send -- --slug=crea-tu-evento-2026-04 --limit=50

# 4. Ver cómo va (contadores + últimos fallidos)
npm run mailing:status -- --slug=crea-tu-evento-2026-04

# 5. Reintentar los que fallaron (p.ej. bounces temporales SMTP)
npm run mailing:send -- --slug=crea-tu-evento-2026-04 --only-failed

# 6. Al terminar, archivar: mueve el HTML a mailing/enviados/
npm run mailing:archive -- --slug=crea-tu-evento-2026-04
```

### Respetar el límite por hora del SMTP (OVH ≈ 200/h)

El SMTP de OVH suele estar limitado a unos **200 envíos/hora por buzón**.
Para evitar que el servidor rechace correos a mitad de campaña:

```bash
# Lanzar en "modo desatendido": envía hasta 180/h, y cuando llegue al tope
# duerme el script automáticamente hasta que pueda seguir.
npm run mailing:send -- \
  --slug=recordatorio-centro-2026-04-19 \
  --max-per-hour=180 \
  --auto-resume
```

- `--max-per-hour=N` consulta la BD (no un contador local), por lo que también
  funciona si partes la campaña en varias invocaciones o en varios días.
- `--auto-resume` hace countdown en pantalla y retoma solo al cumplirse la hora.
- Si el SMTP devuelve un `421` / `451 4.7.x` / `550 5.7.x` / "too many" /
  "rate limit", el script lo detecta: con `--auto-resume` deja la fila en
  `pending`, espera 60 min y reintenta; sin `--auto-resume` la marca `failed`
  con el motivo y sigue.
- Sin `--auto-resume`, cuando toque el tope el script termina y te dice la hora
  exacta a la que relanzarlo.

Estimación rápida: 717 destinatarios a 180/h → **~4 tandas · ≈ 3 h total**.

### Estados por destinatario

| Estado | Significado |
|---|---|
| `pending` | En cola, aún no enviado |
| `sent` | Enviado OK, se guarda el `message_id` de SMTP |
| `failed` | Error de envío (se guarda `failed_reason`, reintento con `--only-failed`) |
| `skipped_opt_out` | El centro había solicitado no recibir marketing |
| `skipped_no_email` | El centro no tenía email (no se encoló en create) |
| `bounced` | Rebote detectado post-envío (futuro: integración de feedback loop) |

### Darse de baja (opt-out)

Cada mail de marketing incluye `{{UNSUBSCRIBE_URL}}` que apunta a
`/api/unsubscribe?t=<token>`. Al hacer click se marca en `centers`:

- `marketing_opt_out_at` = timestamp
- `marketing_opt_out_reason` = opcional (por query string)

A partir de ese momento `mailing:create` los excluye automáticamente en
futuras campañas. Los mails también incluyen la cabecera estándar
`List-Unsubscribe` + `List-Unsubscribe-Post: One-Click`, para que Gmail y
Outlook muestren el botón nativo de "Darse de baja" en el cliente.

### Primera aplicación (solo una vez)

```bash
npm run db:apply-mailing-system
```

Aplica la migración `038_mailing_system.sql`: crea las tablas y añade las
columnas de opt-out a `centers` (con token por defecto para todos).

---

## 2.ter. CRM de mails en `/administrator` (panel web)

Desde `https://www.retiru.com/administrator/mails` puedes operar todo el ciclo
sin tocar terminal: crear campaña, generar el HTML con IA (OpenAI
`gpt-4o-mini`) basándose en diseños anteriores, previsualizar con datos
reales, enviar test, seleccionar audiencia, configurar ritmo y arrancar con
Play. El envío real lo hace el cron `/api/cron/mailing-tick` cada minuto, en
micro-lotes (por defecto 3 correos/tick → ~180/h, por debajo del límite de
OVH), con pausa automática si detecta rate-limit.

Primera aplicación (ya hecha · solo histórico):

```bash
# Aplicado vía SQL Editor de Supabase (no hay DATABASE_URL en .env.local).
# La 039 hace DROP+CREATE de la vista mailing_campaigns_stats porque
# CREATE OR REPLACE VIEW no permite reordenar columnas.
supabase/migrations/038_mailing_system.sql
supabase/migrations/039_mailing_campaigns_extended.sql
```

### Estado actual de las campañas en BD

Sembradas con `mailing-load-html.mjs --create-if-missing` el 2026-04-19:

| # | Slug | Estado | Audiencia | Origen del HTML |
|---|------|--------|-----------|-----------------|
| 1 | `bienvenida-centro-2026-04-01` | `archived` | `all` | `mailing/enviados/1-2026-04-01-retiru-bienvenida-centro.html` |
| 2 | `recordatorio-centro-2026-04-19` | `sending` | (definida desde el panel) | `mailing/2-2026-04-19-retiru-recordatorio-centro.html` |
| 3 | `crea-tu-evento-2026-04-28` | `draft` | `claimed` | `mailing/3-2026-04-28-retiru-crea-tu-evento.html` |

Las tres tienen `html_content` poblado, así que la IA puede usarlas como
referencia y la pestaña *Vista previa* del panel renderiza con datos reales.

### Relación entre BD y carpeta `mailing/`

**La fuente de la verdad es la BD** (`mailing_campaigns.html_content`). Vercel
no tiene filesystem persistente, así que lo que se genera en el panel vive
en Supabase, no en archivos.

La carpeta `mailing/` es una **copia local** para:
- Tener los HTML a mano en el editor para ver/retocar.
- Servir de referencia a la IA cuando genere campañas futuras
  (`mailing:seed-library` resube los cambios a BD).
- Guardar histórico en `mailing/enviados/` una vez terminadas las campañas.

### Sincronización

```bash
# Baja de BD a filesystem local (espeja lo que hay en el panel).
# · status draft/sending → mailing/<archivo>.html
# · status sent/archived → mailing/enviados/<archivo>.html
# · limpia duplicados (si un archivo estaba en ambos sitios, se queda solo
#   en el correcto según el estado de la campaña).
npm run mailing:sync
npm run mailing:sync:dry               # solo muestra qué haría

# Upsert: sube (o crea) una campaña a partir de un archivo HTML local.
# Útil para importar plantillas existentes o sembrar campañas archivadas
# como referencia para la IA.
#
# Flags principales:
#   --slug=                obligatorio
#   --file=                obligatorio (relativo a la raíz)
#   --create-if-missing    crea la fila si no existe (sin él, falla)
#   --number=N             número de orden
#   --status=draft|sending|sent|archived
#   --audience=all|claimed|not_claimed
#   --subject= --description=
#
# Ejemplo: registrar una campaña ya enviada como archivada
npm run mailing:load-html -- \
  --slug=bienvenida-centro-2026-04-01 \
  --file=mailing/enviados/1-2026-04-01-retiru-bienvenida-centro.html \
  --number=1 --status=archived --audience=all \
  --subject="Bienvenido a Retiru: tu centro ya está online" \
  --create-if-missing

# Ejemplo: actualizar el HTML de una campaña existente
npm run mailing:load-html -- \
  --slug=recordatorio-centro-2026-04-19 \
  --file=mailing/2-2026-04-19-retiru-recordatorio-centro.html \
  --subject="¿Aún no has reclamado tu centro en Retiru?" \
  --description="Recordatorio a los centros no reclamados (día 7-10)."
```

> Nota PowerShell: `npm run … -- --flag=valor` corta los argumentos con
> espacios. Si tu valor lleva espacios, llama directo a Node entre comillas:
> `node scripts/mailing-load-html.mjs "--subject=Hola que tal" …`

Recomendación: ejecuta `npm run mailing:sync` después de generar campañas
nuevas con IA en el panel (baja los HTML a local), y también cuando el panel
te diga que una campaña ha terminado (los manda a `enviados/` automáticamente).

---

## 3. Mantenimiento de plantillas

### 3.1 Regenerar iconos sociales

Los iconos de Instagram y Facebook del footer son imágenes PNG en `public/email/` generadas desde SVG oficiales de Simple Icons en color corporativo `#c85a30`.

```bash
# 1. (si cambias el color) descarga los SVG nuevos:
Invoke-WebRequest "https://cdn.simpleicons.org/instagram/c85a30" -OutFile public/email/instagram.svg
Invoke-WebRequest "https://cdn.simpleicons.org/facebook/c85a30"  -OutFile public/email/facebook.svg

# 2. Regenera los PNG a partir de los SVG (requiere sharp)
npm install --no-save sharp
node scripts/generate-email-icons.mjs
```

Salida: `public/email/instagram.png` y `public/email/facebook.png` (64×64 px, transparente, retina-ready para mostrarse a 28 px).

En las plantillas, los iconos se referencian así:

```html
<img src="https://www.retiru.com/email/instagram.png" alt="Instagram" width="28" height="28" />
<img src="https://www.retiru.com/email/facebook.png"  alt="Facebook"  width="28" height="28" />
```

### 3.2 Propagar el mismo footer a todas las plantillas

Si en el futuro redis­eñas el footer de `retiru-recordatorio-centro.html` y quieres que las otras 21 plantillas hereden el cambio, edita el script y vuelve a ejecutarlo. Es idempotente (las ya migradas se saltan).

```bash
node scripts/update-mailing-footers.mjs
# si deja residuos del footer antiguo:
node scripts/cleanup-mailing-residuals.mjs
```

> **Diferencia importante:**
> - `mailing/*.html` (marketing) → footer con enlace `Cancelar suscripción`.
> - `mailing/app/*.html` (transaccionales) → footer más escueto, **sin** cancelar suscripción (son emails operativos obligatorios, no marketing).

---

## 4. Convenciones de diseño

### Paleta

| Color | Uso |
|-------|-----|
| `#c85a30` | Naranja corporativo Retiru (CTA, iconos, acentos) |
| `#1a1a1a` | Texto principal (titulares) |
| `#444` · `#666` | Texto secundario |
| `#999` · `#bbb` · `#ccc` | Texto terciario, separadores |
| `#fafafa` | Fondo de footer |
| `#fff8f4` · `#f0d9cc` | Fondos suaves naranja (cajas destacadas) |

### Tipografía

- **Titulares:** `Georgia, serif` (clásico, cálido)
- **Cuerpo:** `Arial, sans-serif` (universal)
- **Logos/marca:** la imagen PNG se usa en su lugar

### Estructura común de cada email

```
┌─────────────────────────────────────┐
│ Preheader (oculto, visible en inbox)│
├─────────────────────────────────────┤
│ Header con logo (retiru.com)        │
├─────────────────────────────────────┤
│ Hero · título + subtítulo           │
├─────────────────────────────────────┤
│ Contenido / CTAs                    │
├─────────────────────────────────────┤
│ Firma: "Un abrazo del equipo..."    │
├─────────────────────────────────────┤
│ Footer: logo + redes (IG, FB) +     │
│   nav + copyright + (unsubscribe)   │
└─────────────────────────────────────┘
```

### URLs absolutas (para el correo en producción)

- Logo: `https://www.retiru.com/Logo_retiru.png`
- Iconos sociales: `https://www.retiru.com/email/instagram.png`, `.../facebook.png`
- Links internos: siempre con `https://www.retiru.com/...` (nunca rutas relativas, no funcionan en un cliente de email)

---

## 5. Compatibilidad

Todas las plantillas respetan las reglas clásicas de email HTML:

- Layout basado en **tablas** (`<table>` anidadas), NO flexbox ni grid.
- **Estilos inline** (nada crítico en `<style>`).
- **Condicionales MSO** (`<!--[if mso]>...<![endif]-->`) para que los botones se vean bien en Outlook Desktop.
- **Responsive** con `@media only screen and (max-width: 600px)` — ancho base 600 px.
- **Sin**: gradientes, animaciones `@keyframes`, `position: absolute`, Google Fonts, vídeos.
- **Sin** imágenes SVG en `<img>` (Outlook Desktop y Gmail con proxy las bloquean). Usamos PNG.

### Clientes probados (target)

| Cliente | Estado |
|---------|--------|
| Outlook 2016 / 2019 / 365 Desktop | ✅ |
| Outlook Web | ✅ |
| Gmail web/móvil | ✅ |
| Apple Mail iOS/macOS | ✅ |
| Yahoo Mail | ✅ |
| Thunderbird | ✅ |

### Bloqueo de imágenes

Muchos clientes (Outlook desktop y Gmail) **bloquean imágenes externas** hasta que el usuario pulsa "mostrar imágenes". Es comportamiento normal y esperable. Por eso:

- Todos los `<img>` llevan `alt=` descriptivo (por si no se cargan).
- Nunca dependemos de una imagen para transmitir información crítica (p.ej. el CTA es un enlace/botón con fondo de color sólido, no una imagen).

---

## 6. Checklist pre-envío

Cuando lances una campaña o actives un mail transaccional nuevo:

- [ ] **Logo y iconos sociales funcionan** (URLs públicas de `retiru.com/...` servidas tras deploy).
- [ ] **Remitente**: `contacto@retiru.com` (o el que corresponda).
- [ ] **Asunto** revisado, no genérico, longitud < 60 caracteres.
- [ ] **Preheader** presente y distinto al asunto.
- [ ] **Placeholders** (`{{NOMBRE_CENTRO}}`, `{{LOCATION}}`, etc.) se sustituyen en N8N/Resend antes de enviar.
- [ ] **Todos los links** absolutos, `https://`, a dominios de Retiru (no `localhost`, no dominios de test).
- [ ] **Cancelar suscripción** presente en marketing con `{{UNSUBSCRIBE_URL}}` (no un `mailto:` fijo).
- [ ] **Probado** en Outlook Desktop + Gmail (usa `send-mailing-test.mjs` o `mailing:send --dry-run`).
- [ ] **Responsive** verificado en móvil (600 px o menor).
- [ ] **RGPD**: no enviar a listas no consentidas; respetar bajas previas.

---

## 7. Flujo recomendado de onboarding (centros)

Para la secuencia de captación y onboarding de centros:

| Día | Plantilla | Cuándo |
|-----|-----------|--------|
| 0 | `retiru-bienvenida-centro.html` | Primer contacto: "te hemos incluido" |
| +7-10 | `retiru-recordatorio-centro.html` | Solo a los **no reclamados** |
| +14-21 | `retiru-crea-tu-evento.html` | Solo a los **reclamados** (activación) |

Segmentación sugerida en N8N o la herramienta que uses:

- Para recordatorio: `centers` sin `claimed_by` que recibieron email 1 hace ≥ 7 días.
- Para activación: `centers` con `claimed_by IS NOT NULL` sin retiros publicados hace ≥ 14 días.

---

## 8. Histórico · plantillas ESKALA (referencia)

Antes de enfocarnos en Retiru, esta carpeta albergó un catálogo de plantillas de email de **Eskala Digital** (campaña Kit Digital, emails día/noche, expresiones murcianas). Hoy no son parte del flujo activo de Retiru; se conservan como referencia de diseño y recursos reutilizables si queremos ideas visuales.

Si vas a reusar alguna, **ten cuidado con**:

- Textos y marca: están escritos para Eskala, no Retiru.
- Datos de contacto: el remitente es `contacto@eskaladigital.com`, NO `contacto@retiru.com`.
- Links: apuntan a `eskaladigital.com`.

Para ver el listado completo y qué representa cada plantilla, mira `mailing/CATALOGO-COMPLETO.md` (si sigue existiendo).

---

## 9. Contacto

| Dato | Valor |
|------|-------|
| Remitente operativo | `contacto@retiru.com` |
| Web | `https://www.retiru.com` |
| Instagram | `https://www.instagram.com/retiru.es` |
| Facebook | `https://www.facebook.com/retiru.es` |
