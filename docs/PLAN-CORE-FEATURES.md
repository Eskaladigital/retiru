# RETIRU — Plan de implementación: 5 Core Features

Plan de desarrollo para las funcionalidades críticas que generan dependencia (lock-in) del organizador y activan la monetización de la plataforma.

> **Principio rector:** Todo gira alrededor del flujo de reserva. Sin reservas funcionando, no hay asistentes, no hay CRM, no hay pagos, no hay comunicación. El Sprint 1 es absolutamente bloqueante.

---

## Estado actual (Marzo 2026)

| Feature | Estado | % |
|---------|--------|---|
| Event Builder (wizard) | Funcional parcial | 60% |
| Sistema de reservas | **No funciona** | 10% |
| CRM de asistentes | Solo modelo de datos | 5% |
| Panel de pagos | Mock/placeholder | 5% |
| Comunicación + automatizaciones | Mensajería 1:1 real, emails transaccionales activados | 70% |

**Conclusión:** La infraestructura de BD está muy avanzada (tablas, enums, campos), pero la lógica de negocio y las interfaces están sin conectar.

---

## Sprint 1 — FLUJO DE RESERVA COMPLETO

> **Objetivo:** Que un usuario pueda reservar un retiro, pagar el 20% con Stripe, y que el organizador lo vea.
> **Prioridad:** CRÍTICA — sin esto no hay negocio.
> **Dependencias:** Ninguna. Es el primer bloque.

### 1.1 Activar botón "Reservar plaza"

**Problema:** El botón en `/es/retiro/[slug]` es un `<button>` sin `onClick`. No hace nada.

**Qué debe hacer:**
- Si el usuario NO está logueado → redirigir a `/es/registro` con `?redirect=/es/retiro/[slug]`
- Si está logueado → iniciar flujo de checkout

**Archivos afectados:**
- `src/app/(public)/es/retiro/[slug]/page.tsx` — añadir lógica al botón
- Posible: extraer sidebar de reserva a componente client para manejar estado

### 1.2 Crear sesión de Stripe Checkout

**Problema:** `/api/checkout` es un placeholder que devuelve un mensaje estático.

**Qué debe hacer:**
1. Recibir `retreat_id` y `user_id`
2. Validar que hay plazas disponibles
3. Crear un registro `booking` en estado `pending_payment`
4. Crear sesión de Stripe Checkout con `platform_fee` como importe
5. Incluir en metadata: `booking_id`, `retreat_id`, `user_id`
6. Devolver URL de Stripe al frontend

**Archivos afectados:**
- `src/app/api/checkout/route.ts` — reescribir completamente
- `src/lib/stripe/index.ts` — función `createCheckoutSession` ya existe, revisarla

**Datos del checkout:**
- Importe: `platform_fee` (el 20% del `total_price`)
- Moneda: EUR
- Success URL: `/es/mis-reservas/[booking_id]?payment=success`
- Cancel URL: `/es/retiro/[slug]?payment=cancelled`
- Metadata: `booking_id`, `retreat_id`, `user_id`

### 1.3 Webhook de Stripe → crear/confirmar booking

**Problema:** El webhook en `/api/webhooks/stripe` recibe eventos pero no procesa nada (código comentado).

**Qué debe hacer al recibir `checkout.session.completed`:**
1. Extraer `booking_id` de metadata
2. Actualizar booking: `status` → `pending_confirmation` (si manual) o `confirmed` (si automático)
3. Actualizar `platform_payment_status` → `paid`, `platform_paid_at` → now
4. Calcular `remaining_payment_due_date` (ej: 7 días antes del retiro)
5. Actualizar `confirmed_bookings` en el retiro (incrementar +1)
6. Disparar emails (ver 1.4)

**Qué debe hacer al recibir `charge.refunded`:**
1. Localizar booking por `stripe_payment_intent_id`
2. Actualizar estados de pago y booking
3. Restaurar plaza (+1 `available_spots` via decrement `confirmed_bookings`)

**Archivos afectados:**
- `src/app/api/webhooks/stripe/route.ts` — implementar lógica real

### 1.4 Activar emails transaccionales ✅

**Estado:** Implementado. Todas las funciones de email se llaman desde los endpoints correspondientes.

**Emails activos tras `checkout.session.completed`:**
1. `sendBookingConfirmedEmail(booking)` → al asistente ✅
2. `sendNewBookingToOrganizerEmail(booking)` → al organizador ✅

**Dónde llamarlos:** Dentro del handler del webhook, después de actualizar el booking.

**Archivos afectados:**
- `src/app/api/webhooks/stripe/route.ts` — añadir llamadas a email
- `src/lib/email/index.ts` — verificar que las funciones están completas y bien formateadas

### 1.5 Lógica de confirmación (automática vs manual)

**Problema:** El campo `confirmation_type` existe en `retreats` (automatic/manual) pero no hay lógica.

**Flujo automático (`automatic`):**
- Webhook recibe pago → booking pasa directamente a `confirmed`
- Email de confirmación al asistente

**Flujo manual (`manual`):**
- Webhook recibe pago → booking pasa a `pending_confirmation`
- Email al organizador: "Tienes una nueva reserva, confirma o rechaza en X horas"
- El organizador confirma/rechaza desde su panel
- Si no responde en `sla_hours` → estado `sla_expired` → reembolso automático

**Archivos afectados:**
- `src/app/api/webhooks/stripe/route.ts` — lógica condicional según `confirmation_type`
- Nuevo endpoint: `POST /api/bookings/[id]/confirm` — para que el organizador confirme/rechace
- Panel organizador: botones de confirmar/rechazar en la lista de reservas

### 1.6 Página de confirmación post-pago

**Problema:** No hay feedback visual después de pagar.

**Qué debe mostrar la success page:**
- Número de reserva
- Resumen del retiro (nombre, fechas, lugar)
- Desglose de pago (20% pagado ahora, 80% pendiente al organizador)
- Estado de la reserva (confirmada o pendiente de confirmación)
- Enlace a "Mis reservas"
- Enlace al chat con el organizador

**Archivos afectados:**
- `src/app/(public)/es/(dashboard)/mis-reservas/[id]/page.tsx` — ya existe, verificar que muestra todo correctamente
- Posible: componente de toast/banner para `?payment=success`

### Entregable del Sprint 1

Al terminar este sprint:
- Un usuario puede reservar y pagar el 20% de un retiro
- Se crea un booking real en BD con estados correctos
- El organizador recibe notificación por email
- El asistente recibe confirmación por email
- Las plazas disponibles se decrementan correctamente
- La página "Mis reservas" muestra la reserva real

---

## Sprint 2 — EVENT BUILDER COMPLETO

> **Objetivo:** Que el organizador pueda crear una landing de evento profesional y completa.
> **Prioridad:** ALTA — sin esto la landing no convierte.
> **Dependencias:** Ninguna directa (paralelo a Sprint 1 si hay recursos).

### 2.1 Subida de imágenes en el wizard

**Problema:** No hay forma de subir fotos. La ficha pública las muestra (tabla `retreat_images`) pero el wizard no tiene upload.

**Qué debe permitir:**
- Subir imagen de portada (obligatoria)
- Subir hasta 8 imágenes adicionales (galería)
- Drag & drop y/o selector de archivos
- Preview de imágenes subidas
- Reordenar imágenes
- Eliminar imágenes

**Storage:** Supabase Storage (bucket `retreat-images`, ya debería existir la política en `004_storage_policies.sql`)

**Flujo:**
1. Nuevo paso en el wizard (o integrado en paso 0/1) → "Imágenes"
2. El usuario sube fotos → se guardan en Supabase Storage
3. Al guardar el evento → se crean registros en `retreat_images` con URLs y `sort_order`

**Archivos afectados:**
- `src/app/(public)/es/(dashboard)/mis-eventos/nuevo/NuevoEventoForm.tsx` — añadir paso o sección de imágenes
- Nuevo componente: `ImageUploader.tsx` (drag & drop, preview, reordenar)
- `src/app/api/retreats/create/route.ts` — aceptar y guardar imágenes
- `src/app/api/retreats/[id]/route.ts` — actualizar imágenes al editar

### 2.2 Programa/agenda del retiro

**Problema:** El campo `schedule` (JSONB) existe en `retreats` y la ficha lo muestra, pero el wizard no lo pide.

**Estructura del schedule (ya definida en tipos):**
```
ScheduleDay {
  day: number
  title_es: string
  title_en?: string
  items: ScheduleItem[]
}
ScheduleItem {
  time: string        // "09:00"
  activity_es: string
  activity_en?: string
}
```

**Qué debe permitir:**
- Añadir días (auto-generados según `start_date`/`end_date`)
- Por cada día: título + lista de actividades con hora
- Añadir/eliminar actividades dinámicamente

**Flujo:**
1. Paso nuevo en el wizard (después de "Detalles") → "Programa"
2. Se genera automáticamente la estructura de días según las fechas
3. El organizador rellena actividades por día
4. Se guarda como JSONB en `retreats.schedule`

**Archivos afectados:**
- `src/app/(public)/es/(dashboard)/mis-eventos/nuevo/NuevoEventoForm.tsx` — nuevo paso
- `src/app/api/retreats/create/route.ts` — aceptar `schedule`
- `src/app/api/retreats/[id]/route.ts` — aceptar `schedule`

### 2.3 Política de cancelación editable

**Problema:** `cancellation_policy` tiene un valor por defecto en la BD pero el organizador no puede cambiarlo.

**Opciones para el organizador:**
1. **Estándar** (por defecto): 100% si cancela >30 días, 50% si >14, 0% si <7
2. **Flexible**: 100% si >14 días, 50% si >7, 0% si <3
3. **Estricta**: 50% si >30 días, 0% después
4. **Personalizada**: el organizador define los tramos

**Flujo:**
- En el paso de "Precio" del wizard → selector de política
- Si elige "Personalizada" → formulario de tramos (días_antes, % reembolso)
- Se guarda como JSONB en `retreats.cancellation_policy`

**Archivos afectados:**
- `src/app/(public)/es/(dashboard)/mis-eventos/nuevo/NuevoEventoForm.tsx` — añadir al paso 3 (Precio)

### 2.4 "Qué no incluye" en el wizard

**Problema:** `excludes_es` existe en la BD, la ficha lo muestra, pero el wizard no lo pide.

**Implementación:** Clonar la lógica de `includes_es` (lista dinámica de strings) y añadirla al paso "Incluye", renombrándolo a "Incluye / No incluye".

**Archivos afectados:**
- `src/app/(public)/es/(dashboard)/mis-eventos/nuevo/NuevoEventoForm.tsx` — paso 2

### 2.5 URL compartible + preview social

**Problema:** El organizador necesita poder compartir su evento fácilmente.

**Qué debe existir:**
- URL limpia y bonita: `retiru.com/es/retiro/yoga-ibiza-abril-2026`
- Meta tags Open Graph correctos (título, descripción, imagen de portada)
- Botón "Copiar enlace" visible en el panel del organizador
- Preview de cómo se ve al compartir en WhatsApp/Instagram

**Estado actual:** El slug se genera automáticamente. Los meta tags probablemente ya están (verificar `src/lib/seo/`). Falta el botón de copiar y la preview.

**Archivos afectados:**
- `src/app/(public)/es/(dashboard)/mis-eventos/page.tsx` — botón "Copiar enlace" por evento
- `src/app/(public)/es/retiro/[slug]/page.tsx` — verificar OG tags

### Entregable del Sprint 2

Al terminar este sprint:
- El organizador puede crear un evento completo con fotos, programa, política de cancelación
- La landing del evento es profesional y compartible
- Cualquier campo que aparezca en la ficha pública puede editarse en el wizard

---

## Sprint 3 — CRM DE ASISTENTES + FORMULARIO

> **Objetivo:** Que el organizador vea y gestione a sus asistentes con datos completos.
> **Prioridad:** ALTA — es la funcionalidad que más lock-in genera.
> **Dependencias:** Sprint 1 (necesita bookings reales).

### 3.1 Formulario post-reserva configurable

**Problema:** El organizador necesita recoger datos específicos del asistente (dieta, alergias, experiencia, transporte, etc.) pero no hay UI para configurarlo ni para rellenarlo.

**Modelo de datos (ya existe):**
- `retreats.post_booking_form` → JSONB con array de `FormField`
- `bookings.form_responses` → JSONB con las respuestas

**Tipo FormField (ya definido en `src/types/index.ts`):**
```
FormField {
  id: string
  label_es: string
  label_en?: string
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'number'
  required: boolean
  options?: { value: string; label_es: string; label_en?: string }[]
}
```

**Parte A — Configuración (organizador):**
- Nuevo paso en el wizard (o sección en edición) → "Formulario de inscripción"
- Campos predefinidos sugeridos: nombre completo, teléfono, dieta, alergias, nivel de experiencia, cómo llega, comentarios
- El organizador puede activar/desactivar campos y añadir campos custom
- Se guarda en `retreats.post_booking_form`

**Parte B — Rellenado (asistente):**
- Después de pagar (success page o email) → enlace al formulario
- Formulario dinámico generado desde `post_booking_form`
- Las respuestas se guardan en `bookings.form_responses`
- Estado visual: "Formulario pendiente" / "Formulario completado"

**Archivos afectados:**
- `src/app/(public)/es/(dashboard)/mis-eventos/nuevo/NuevoEventoForm.tsx` — nuevo paso o sección
- Nuevo componente: `PostBookingFormBuilder.tsx` — constructor del formulario para el organizador
- Nuevo componente: `PostBookingFormFill.tsx` — formulario para el asistente
- Nueva ruta: `/es/mis-reservas/[id]/formulario` — página donde el asistente rellena
- `src/app/api/bookings/[id]/form/route.ts` — guardar respuestas

### 3.2 Vista de asistentes real (organizador)

**Problema:** `/es/panel/asistentes` y `/es/panel/eventos/[id]/reservas` muestran datos mock hardcodeados.

**Qué debe mostrar la lista de asistentes por evento:**

| Columna | Origen |
|---------|--------|
| Nombre | `profiles.full_name` |
| Email | `profiles.email` |
| Estado reserva | `bookings.status` |
| Pago 20% | `bookings.platform_payment_status` |
| Pago 80% | `bookings.remaining_payment_status` |
| Formulario | ¿completado? (check `bookings.form_responses`) |
| Fecha reserva | `bookings.created_at` |

**Acciones por asistente:**
- Ver ficha completa (datos + respuestas del formulario)
- Marcar 80% como pagado
- Enviar mensaje (redirigir a mensajería)
- Cancelar reserva (con motivo)

**Archivos afectados:**
- `src/app/(public)/es/(organizer)/panel/eventos/[id]/reservas/page.tsx` — reescribir con datos reales
- `src/app/(public)/es/(organizer)/panel/asistentes/page.tsx` — reescribir con datos reales
- Nuevo endpoint: `GET /api/organizer/events/[id]/bookings` — listar bookings de un evento
- Nuevo endpoint: `GET /api/organizer/attendees` — listar todos los asistentes del organizador (cross-event)

### 3.3 Ficha individual de asistente

**Qué debe mostrar:**
- Datos personales (nombre, email, teléfono, avatar)
- Historial de reservas con este organizador
- Respuestas del formulario
- Estado de pagos
- Notas del organizador (`bookings.organizer_notes`)
- Tags (futuro: VIP, repetidor, etc.)

**Archivos afectados:**
- Nueva ruta: `/es/panel/asistentes/[id]` — ficha de asistente
- Endpoint: `GET /api/organizer/attendees/[id]` — datos del asistente

### 3.4 Exportación CSV/Excel

**Qué debe exportar:**
- Lista de asistentes de un evento con todos los datos + respuestas del formulario
- Formatos: CSV y Excel

**Dónde:** Botón "Exportar" en la vista de asistentes por evento.

**Archivos afectados:**
- Nuevo endpoint: `GET /api/organizer/events/[id]/bookings/export` — generar CSV
- UI: botón en la vista de reservas del evento

### Entregable del Sprint 3

Al terminar este sprint:
- El organizador puede configurar un formulario de inscripción personalizado
- El asistente rellena sus datos después de reservar
- El organizador ve una lista real de asistentes con todos los datos
- Puede exportar la lista a CSV
- Tiene una ficha por asistente con historial

---

## Sprint 4 — PANEL DE CONTROL DE PAGOS

> **Objetivo:** Que el organizador tenga visibilidad total del estado financiero de cada evento.
> **Prioridad:** MEDIA-ALTA — importante pero no bloqueante para el lanzamiento MVP.
> **Dependencias:** Sprint 1 (necesita bookings reales).

### 4.1 Dashboard financiero por evento

**Problema:** El panel del organizador muestra KPIs mock. No hay visión real de cuánto se ha cobrado.

**Qué debe mostrar por evento:**

| Métrica | Cálculo |
|---------|---------|
| Ingresos potenciales | `total_price × confirmed_bookings` |
| 20% cobrado (Retiru) | Suma de `platform_fee` de bookings confirmados |
| 80% cobrado (organizador) | Suma de bookings donde `remaining_payment_status = confirmed_by_organizer` |
| 80% pendiente | Suma de bookings donde `remaining_payment_status = pending` |
| Plazas ocupadas | `confirmed_bookings / max_attendees` |

**Vista:** Tabla resumen arriba + lista de asistentes con estado de pago abajo.

**Archivos afectados:**
- `src/app/(public)/es/(organizer)/panel/page.tsx` — reescribir con datos reales
- Nuevo endpoint: `GET /api/organizer/dashboard` — KPIs reales del organizador

### 4.2 Marcar pago del 80% como recibido

**Problema:** El organizador cobra el 80% por su cuenta (Bizum, transferencia, efectivo) y necesita registrarlo.

**Flujo:**
1. En la lista de asistentes → botón "Marcar como pagado" por cada booking
2. Selecciona método de pago (Bizum, transferencia, efectivo, otro)
3. Opcionalmente añade fecha y notas
4. El estado cambia a `remaining_payment_status = confirmed_by_organizer`

**Archivos afectados:**
- Nuevo endpoint: `PATCH /api/organizer/bookings/[id]/payment` — marcar pago
- UI en la lista de reservas del evento

### 4.3 Alertas de pago pendiente

**Problema:** El organizador tiene que perseguir a los asistentes que no han pagado el 80%.

**Automatización:**
- Si `remaining_payment_due_date` se acerca (ej: quedan 7 días) y `remaining_payment_status = pending`:
  - Enviar `sendPaymentReminderEmail` al asistente (ya existe la función)
  - Marcar como `overdue` si pasa la fecha

**Implementación:**
- Cron job (Supabase Edge Function o Vercel Cron) que se ejecuta diariamente
- Busca bookings con `remaining_payment_due_date` próxima
- Envía emails y actualiza estados

**Archivos afectados:**
- Nueva Edge Function o API route: `/api/cron/payment-reminders`
- `src/lib/email/index.ts` — `sendPaymentReminderEmail` ya existe, verificar

### 4.4 Vista consolidada (todos los eventos)

**Qué debe mostrar el dashboard general del organizador:**
- Total de ingresos (todos los eventos)
- Ingresos por evento (tabla)
- Próximos cobros pendientes
- Eventos con pagos vencidos (highlight)

**Archivos afectados:**
- `src/app/(public)/es/(organizer)/panel/page.tsx` — dashboard general con datos reales

### Entregable del Sprint 4

Al terminar este sprint:
- El organizador ve el estado financiero real de cada evento
- Puede marcar pagos del 80% como recibidos
- Los asistentes reciben recordatorios automáticos de pago
- Hay una vista consolidada de todos los ingresos

---

## Sprint 5 — COMUNICACIÓN + AUTOMATIZACIONES

> **Objetivo:** Que el organizador no tenga que acordarse de nada. La plataforma comunica por él.
> **Prioridad:** MEDIA — no bloquea lanzamiento pero es el feature que mata a WhatsApp.
> **Dependencias:** Sprint 1 (emails transaccionales) + Sprint 3 (asistentes reales).

### 5.1 Emails automáticos del ciclo de vida ✅ (mayoría implementados)

**Emails activados:**
1. ✅ `sendBookingConfirmedEmail` → al confirmar reserva (Webhook Stripe + organizador confirma)
2. ✅ `sendNewBookingToOrganizerEmail` → al organizador cuando recibe reserva (Webhook Stripe)
3. ✅ `sendPaymentReminderEmail` → recordatorio del 80% (Cron diario 9:00)
4. ✅ Recordatorio pre-evento → 7 y 2 días antes (Cron diario 10:00, `/api/cron/event-reminders`)
5. ✅ Solicitud de reseña → 2 días después (Cron diario 11:00, `/api/cron/review-requests`)
6. ✅ `sendBookingCancelledEmail` → al asistente y al organizador (Webhook Stripe charge.refunded)
7. ✅ `sendBookingRejectedEmail` → al asistente con motivo (`/api/bookings/[id]`)
8. ✅ `sendClaimApprovedEmail` / `sendClaimRejectedEmail` → al usuario (`/api/admin/center-claims`)
9. ✅ `sendRetreatApprovedEmail` / `sendRetreatRejectedEmail` → al organizador (`/api/admin/retreats`)
10. ✅ `sendNewMessageEmail` → notificación al destinatario de mensajes y soporte (`/api/messages/conversations/[id]`)

**Emails pendientes (fase 2):**
- **Instrucciones del organizador** → cuando el organizador las envía manualmente
- **Formulario pendiente** → si el asistente no ha rellenado el formulario en 48h

### 5.2 Mensajes broadcast (organizador → todos los asistentes)

**Problema:** El organizador solo puede enviar mensajes 1:1. No puede escribir a todos los asistentes de un evento a la vez.

**Qué debe permitir:**
- Desde el panel del evento → botón "Enviar mensaje a todos"
- Escribir mensaje → se envía a todos los asistentes confirmados
- Opción: enviar también por email (además del mensaje in-app)

**Flujo:**
1. Organizador entra en el evento → "Comunicaciones"
2. Escribe mensaje
3. Selecciona destinatarios: todos, solo confirmados, solo pendientes de pago
4. Envía → se crea un mensaje en cada conversación existente (o se crean las que falten)

**Archivos afectados:**
- Nuevo endpoint: `POST /api/organizer/events/[id]/broadcast` — enviar a múltiples
- Nueva sección en el panel del evento: "Comunicaciones"
- `src/lib/email/index.ts` — función de email para broadcast

### 5.3 Historial de comunicaciones por evento

**Problema:** No hay forma de ver toda la comunicación de un evento en un solo lugar.

**Qué debe mostrar:**
- Timeline de todos los mensajes enviados (automáticos + manuales + broadcast)
- Filtro por tipo: automáticos, manuales, broadcast
- Estado: enviado, leído, respondido

**Archivos afectados:**
- Nueva sección en el panel del evento: "Historial de comunicaciones"
- Endpoint: `GET /api/organizer/events/[id]/communications` — timeline

### 5.4 Plantillas de mensaje reutilizables (fase 2)

**Para más adelante:**
- El organizador guarda plantillas: "Instrucciones de llegada", "Qué traer", "Bienvenida"
- Las reutiliza en futuros eventos
- Variables dinámicas: `{{nombre}}`, `{{fecha}}`, `{{lugar}}`

**Nota:** Esto es fase 2, no MVP. Pero conviene tener el modelo de datos preparado.

### Entregable del Sprint 5

Al terminar este sprint:
- Los asistentes reciben recordatorios automáticos antes del evento
- El organizador puede enviar mensajes a todos los asistentes a la vez
- Hay solicitud automática de reseña post-evento
- Todo el historial de comunicación queda registrado

---

## Resumen de sprints y dependencias

```
Sprint 1: Flujo de reserva ─────────┬──────────────────────────────────┐
  (CRÍTICO, bloqueante)              │                                  │
                                     │                                  │
Sprint 2: Event Builder ────────┐    │                                  │
  (paralelo a Sprint 1)         │    │                                  │
                                │    │                                  │
                                ▼    ▼                                  │
                           Sprint 3: CRM asistentes                    │
                             (necesita Sprint 1)                       │
                                     │                                  │
                                     ▼                                  ▼
                           Sprint 4: Panel pagos          Sprint 5: Comunicación
                             (necesita Sprint 1)           (necesita Sprint 1 + 3)
```

---

## Tabla resumen de endpoints nuevos

| Sprint | Método | Ruta | Descripción |
|--------|--------|------|-------------|
| 1 | POST | `/api/checkout` | Crear sesión de Stripe Checkout (reescribir) |
| 1 | POST | `/api/webhooks/stripe` | Procesar pagos (activar) |
| 1 | POST | `/api/bookings/[id]/confirm` | Organizador confirma/rechaza reserva |
| 3 | POST | `/api/bookings/[id]/form` | Asistente guarda respuestas del formulario |
| 3 | GET | `/api/organizer/events/[id]/bookings` | Listar bookings de un evento |
| 3 | GET | `/api/organizer/attendees` | Listar todos los asistentes |
| 3 | GET | `/api/organizer/attendees/[id]` | Ficha de un asistente |
| 3 | GET | `/api/organizer/events/[id]/bookings/export` | Exportar CSV |
| 4 | GET | `/api/organizer/dashboard` | KPIs reales del organizador |
| 4 | PATCH | `/api/organizer/bookings/[id]/payment` | Marcar 80% como pagado |
| 4 | POST | `/api/cron/payment-reminders` | Cron: recordatorios de pago |
| 5 | POST | `/api/organizer/events/[id]/broadcast` | Mensaje a todos los asistentes |
| 5 | GET | `/api/organizer/events/[id]/communications` | Timeline de comunicaciones |
| 5 | POST | `/api/cron/event-reminders` | Cron: recordatorios pre-evento |
| 5 | POST | `/api/cron/review-requests` | Cron: solicitar reseñas post-evento |

---

## Tabla resumen de componentes nuevos

| Sprint | Componente | Descripción |
|--------|-----------|-------------|
| 1 | `ReserveButton.tsx` | Botón de reserva con lógica (auth check + checkout) |
| 2 | `ImageUploader.tsx` | Subida de imágenes con drag & drop y reordenar |
| 2 | `ScheduleEditor.tsx` | Editor de programa por días |
| 2 | `CancellationPolicySelector.tsx` | Selector de política de cancelación |
| 3 | `PostBookingFormBuilder.tsx` | Constructor de formulario para el organizador |
| 3 | `PostBookingFormFill.tsx` | Formulario dinámico para el asistente |
| 3 | `AttendeeList.tsx` | Lista real de asistentes con estados |
| 3 | `AttendeeCard.tsx` | Ficha individual de asistente |
| 4 | `PaymentDashboard.tsx` | Dashboard financiero del evento |
| 4 | `MarkAsPaidButton.tsx` | Marcar pago del 80% |
| 5 | `BroadcastComposer.tsx` | Editor de mensaje broadcast |
| 5 | `CommunicationTimeline.tsx` | Timeline de comunicaciones del evento |

---

## Tabla resumen de migraciones SQL

| Sprint | Migración | Descripción |
|--------|----------|-------------|
| 1 | — | No necesita migración (tablas ya existen) |
| 2 | — | No necesita migración (campos ya existen) |
| 3 | `011_attendee_tags.sql` | Tabla `organizer_attendee_tags` (si se implementa) |
| 4 | — | No necesita migración (campos ya existen) |
| 5 | `012_broadcast_messages.sql` | Posible: tabla para tracking de broadcasts |

> La mayor parte de la infraestructura de BD ya está creada. El trabajo principal es de frontend, API routes y lógica de negocio.

---

## Criterio de "listo para lanzar"

La plataforma está lista para operar con usuarios reales cuando:

- [ ] **Sprint 1 completo** — se pueden hacer reservas con pago real
- [ ] **Sprint 2 completo** — los organizadores pueden crear eventos completos con fotos
- [ ] **Sprint 3 mínimo** — al menos la vista de asistentes real (sin formulario custom, puede ser fase 2)
- [x] Emails transaccionales funcionando (confirmación, nueva reserva, claims, retiros, mensajes, cancelaciones)

Los Sprints 4 y 5 pueden lanzarse después como mejoras incrementales.

---

## Métricas de éxito por feature

| Feature | Métrica | Objetivo |
|---------|---------|----------|
| Event Builder | % de organizadores que publican con fotos + programa | >70% |
| Reservas | Tasa de conversión visita → reserva | >3% |
| CRM | % de asistentes que completan el formulario | >80% |
| Pagos | % de pagos del 80% registrados en plataforma | >50% |
| Comunicación | % de organizadores que usan broadcast | >40% |

---

*Plan generado: Marzo 2026 · Revisión continua según avance de sprints.*
