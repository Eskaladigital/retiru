# Estrategia de crecimiento — documento vivo

> **Qué es esto:** el cuaderno de estrategia de marketing y crecimiento de Retiru. Se trabaja por **sesiones de reflexión** entre el equipo y el agente: cada sesión parte de lo ya recorrido, corrige el rumbo y deja registro. No es documentación técnica (para eso está el `README.md`); es diagnóstico, plan, decisiones y seguimiento.
>
> **Cómo se usa (equipo y agentes de IA):**
> 1. **Antes** de cualquier conversación de estrategia/marketing/captación: leer este documento entero.
> 2. **Después** de cada sesión: actualizar el estado de las acciones (§4), registrar la sesión en el diario (§8) y mover decisiones del backlog (§7) si se han tomado.
> 3. Si una decisión estratégica cambia el producto (flujos, verificación, precios…), aplicar además la regla `documentacion-sync.mdc`: README, docs y páginas públicas coherentes.

---

## 1. Diagnóstico de partida (24/07/2026)

### El hallazgo crítico: no hay oferta vigente

Verificado contra la base de datos de producción (tabla `retreats`, 10 filas):

| Situación | Nº | Detalle |
|---|---|---|
| Publicados, ya celebrados | 8 | Entre abril y julio de 2026 (el último empezó el 08/07). Invisibles en listados y sitemap porque el filtro es `start_date > hoy`. |
| Pendiente de revisión, **fecha futura** | 1 | «Retiro de Yoga», 2–4 de octubre de 2026. Esperando aprobación en `/administrator/retiros`. |
| Borrador, fecha pasada | 1 | Formación Shaktipat (junio). Solo útil si el organizador la reedita con fechas nuevas. |

**Consecuencia SEO medida:** «retiro yoga» en posición **45** de Google, «retiro ayurveda» en **61**. Google no tiene nada que enseñar en nuestras páginas de retiros: están vacías de oferta futura.

### Lectura estratégica

- **El cuello de botella es la oferta, no el SEO técnico ni Instagram.** La infraestructura de captación ya existe: ~2.000 URLs indexables (landings tipo/provincia/ciudad/estilo, ~858 centros, blog con cola editorial). Quien reserva un retiro llega buscando «retiro de yoga en Málaga», no por un reel. Pero ese tráfico no convierte (ni posiciona) sin inventario.
- **El inventario caduca.** Los 8 retiros pasados demuestran que hubo oferta y se dejó secar. La captación de eventos debe ser **continua**, no puntual.
- **Instagram es señal de confianza, no motor de captación.** Sustituir las fotos de IA por contenido real (aunque sea sencillo) es correcto como mantenimiento de credibilidad; la constancia importa más que la producción. Sin obsesionarse con seguidores.
- **Problema clásico de marketplace:** los primeros 10–20 eventos se consiguen a mano (outreach directo), no por inbound.

---

## 2. Objetivo operativo

> **Nunca menos de 5 retiros futuros publicados.**

Cada retiro que se celebra dispara una acción: contactar al organizador para publicar la siguiente edición. El organizador que ya publicó es el más fácil de reactivar (conoce la plataforma y la comisión escalonada le favorece).

---

## 3. Métricas semanales (solo 3 números)

| # | Métrica | Fuente |
|---|---|---|
| 1 | Clics desde Google | Search Console |
| 2 | Centros reclamados | `center_claims` con `status=approved` |
| 3 | Retiros futuros publicados | `retreats` con `status=published` y `start_date > hoy` (objetivo ≥ 5) |

La motivación viene de ver estos tres contadores subir semana a semana, no de "empujones de inspiración".

---

## 3bis. Ataque a consultas genéricas (GSC · 24/07/2026)

Prioridad: **impresiones altas + intent alineado con el negocio**, no solo la marca «retiru».

| Consulta | Imp. | Pos. | Intent | Página canónica a empujar | Qué hace falta para subir |
|---|---:|---:|---|---|---|
| `yoga classes near me` | 644 | **10,0** | Local / clases (no retiro) | `/en/centers/yoga` + landings ciudad EN; ojo: Google Maps se come el «near me» | Title/H1 orientados a *yoga classes* + listado con geo; no competir de frente con Maps. Mejor empujar long-tail `yoga classes [city]` vía Cap. 5. |
| `nature retreat meaning` | 281 | **8,1** | Informacional (definición) | **Artículo de blog EN** dedicado («What does a nature retreat mean?») enlazando a `/en/retreats-retiru` | Contenido didáctico + schema FAQ. Posición ya peleable → un buen artículo puede meter clics ya. |
| `retiro ayurveda` | 279 | **61,2** | Transaccional / core negocio | `/es/retiros-ayurveda` | **Inventario futuro** + intro/FAQ/sections de categoría. Sin retiros publicados Google no premia la landing. |
| `retiru` | 252 | 2,0 | Marca | Home | Mantener; no es el cuello de botella. |
| `centro de meditación en santander` | 208 | 17,9 | Directorio local | `/es/centros/meditacion/cantabria` (+ ciudad si existe) | Contenido Cap. 3/5 + enlaces internos desde blog/ficha. |
| `wellness experience andorra` | 174 | 6,0 | Marca de centro / local | Ficha del centro + landing Andorra | Enriquecer ficha (Places) — ya en marcha. |
| `meditation retreat spain` | 160 | 20,4 | Transaccional EN | `/en/retreats-meditation` o `/en/retreats-retiru` | Igual que ayurveda/yoga: **oferta futura** en inglés visible. |
| `retiro yoga` | 142 | **45,8** | Transaccional / core negocio | `/es/retiros-yoga` | Mismo diagnóstico que `retiro ayurveda`: landing sin chicha de oferta. |

### Lectura

1. **Las dos peores posiciones (`retiro yoga` / `retiro ayurveda`) son exactamente el core del negocio.** No se arreglan con más landings de centros: se arreglan con **retiros futuros publicados** en esas categorías + que la landing de categoría no aparezca vacía (ya implementado el fallback de ediciones pasadas; falta inventario real).
2. **Las peleables (pos. 8–10)** son oportunidades distintas: `nature retreat meaning` → blog (rápido); `yoga classes near me` → directorio EN, aceptando que «near me» es territorio Maps.
3. Orden de ataque recomendado: **(A)** inventario retiros yoga + ayurveda → **(B)** artículo EN «nature retreat meaning» → **(C)** reforzar Cap. 3 meditación Cantabria/Santander → **(D)** copy EN de `/en/centers/yoga` hacia “yoga classes”.

---

## 4. Plan de captación de oferta (por orden de prioridad)

| # | Acción | Detalle | Estado |
|---|---|---|---|
| 0 | **Aprobar el retiro de octubre** | Revisar el `pending_review` (2–4 oct) en `/administrator/retiros`; si el organizador no completó el KYC, acompañarle activamente. Es el único inventario futuro que existe. | 🔴 Pendiente |
| 1 | **Reactivar organizadores pasados** | Contactar uno a uno a los 7–8 organizadores de los retiros ya celebrados para publicar la siguiente edición. | 🔴 Pendiente |
| 2 | **Lanzar la campaña de claims ya construida** | CRM `/administrator/mails` + tokens mágicos + emails #1/#2/#3 listos; ~416 centros con email. Ejecutar y medir claims semanalmente. | 🔴 Pendiente (máquina construida pero parada) |
| 3 | **Llamadas conserje a 30–50 centros top** | No a los 592: elegir los mejor valorados en provincias con buenas landings. Oferta concreta: *«tu primer retiro publica con 0 % de comisión y te montamos nosotros la ficha con tus fotos y textos»*. Onboarding tipo conserje. | 🔴 Pendiente |
| 4 | **Organizadores con audiencia propia** | Profesores con Instagram activo que ya llenan retiros por WhatsApp. Pitch: «usa Retiru como herramienta de reservas y cobro, primer retiro al 0 %». Traen sus propios asistentes → eventos, reseñas y tráfico. | 🔴 Pendiente |
| 5 | **Instagram con contenido real** | Ir sustituyendo fotos IA por vídeos/fotos/contenido propio. Ritmo constante y sencillo; es mantenimiento de credibilidad, no canal principal. | 🟡 En curso (compromiso del equipo) |
| 6 | **Captar profesores/terapeutas para clases y sesiones periódicas** | Nuevo desde 2026-07-24: el producto soporta eventos de un día (horas) y periódicos (serie semanal = inventario futuro que **no caduca**, el cron repone fechas solo). Pitch: *«publica tu clase semanal una vez y olvídate: cobras online, la serie entera cuenta como un solo retiro para la comisión (0 % la primera)»*. Mismo perfil que el frente 4 pero con barrera de entrada mucho menor que un retiro. | 🔴 Pendiente (producto listo, falta outreach) |

**Leyenda de estados:** 🔴 Pendiente · 🟡 En curso · 🟢 Hecho · ⚪ Descartado.

---

## 5. Verificación de organizadores: de muro a escalera (propuesta)

**Problema:** hoy se exigen 5 documentos **antes de poder publicar nada** (DNI, alta en actividad económica, seguro RC, datos fiscales, datos bancarios). Para un retiro de 900 € con alojamiento tiene sentido; para la profesora de yoga que quiere publicar clases en la playa es un muro — y ese perfil es el que puede dar volumen de eventos ahora, además de alimentar el embudo (quien publica clases hoy organiza su primer retiro en un año, ya dentro de la plataforma).

**Propuesta: verificación progresiva** — pedir cada documento cuando de verdad hace falta:

| Documento | Cuándo pedirlo |
|---|---|
| DNI / identidad | Al publicar. Mínimo para que nadie sea anónimo. Badge «Identidad verificada». |
| Datos bancarios y fiscales | Con la **primera reserva pagada**. Antes no hay payout que hacer; el organizador con dinero esperándole los aporta sin fricción. |
| Seguro RC + alta actividad económica | Según tipo de evento: obligatorios para **retiros** (varios días, alojamiento, ticket alto → badge «Organizador verificado»); no exigidos para **clases y talleres** de un día y ticket bajo. |

**Dos niveles de evento** con requisitos distintos:

- **Clases y talleres** (un día, sin alojamiento, ticket bajo): DNI + IBAN.
- **Retiros** (varios días, alojamiento, ticket alto): KYC completo actual.

**Matiz legal:** como Retiru cobra el 100 % vía Stripe y liquida al organizador, el alta en actividad económica sí es relevante cuando hay dinero y ticket alto de por medio. El modelo progresivo mantiene la confianza donde más importa sin cerrar la puerta al evento pequeño.

**Vía de escape (implementar ya, coste casi nulo):** aviso en `/es/panel/verificacion` tipo *«¿No tienes alguno de estos documentos? Escríbenos y vemos tu caso»*, conectado al chat de soporte existente. Evita el abandono silencioso y genera conversaciones reales con organizadores (oro para saber qué les frena).

**Estado:** 🔴 Propuesta pendiente de decisión e implementación. Si se aprueba, toca: wizard de eventos, `/es/panel/verificacion`, contrato del organizador (`src/lib/legal/organizer-contract.tsx`), páginas públicas (`/es/para-organizadores`, `/es/ayuda`, `/es/condiciones`) y README (regla `documentacion-sync.mdc`).

**Actualización 2026-07-24:** la mitad «producto» de los dos niveles de evento **ya existe**: eventos de un día con duración en horas, PVP sin mínimo (> 0 €) y eventos periódicos (series). Lo que sigue pendiente es la mitad «verificación»: hoy la profesora de la clase de 15 € pasa por el mismo KYC de 5 documentos que el retiro de 900 €. Con el producto listo, esta propuesta pasa de «mejora deseable» a **cuello de botella directo** del frente 6 de captación.

---

## 6. Mejoras de producto propuestas

| Mejora | Por qué | Estado |
|---|---|---|
| **Landings de retiros nunca vacías** | Cuando un listado se queda sin retiros futuros: mostrar ediciones pasadas marcadas «celebrado» + CTA a organizadores / listado general. Helper `getPastPublishedRetreats` + `PastRetreatsFallback` en las 6 landings cat/destino ES+EN. | 🟢 Hecho (2026-07-24) |
| **Aviso «habla con nosotros» en verificación** | Ver §5. Independiente del resto de la verificación progresiva; se puede hacer primero. | 🔴 Pendiente |
| **Verificación progresiva completa** | Ver §5. | 🔴 Pendiente de decisión |
| **Eventos de un día (duración en horas) + PVP sin mínimo** | Abre la plataforma a clases, sesiones de terapia, talleres y experiencias (gastronómicas, de bienestar…). Migraciones 049–050. | 🟢 Hecho (2026-07-24) |
| **Eventos periódicos (series con ocurrencias)** | Una clase semanal se publica una vez; el cron mantiene 1–8 fechas futuras vivas (horizonte rodante), cierre de fechas por vacaciones, detener serie, conversión de evento existente en periódico. En listados solo la próxima fecha; la serie cuenta como 1 retiro para la comisión. Migración 051. | 🟢 Hecho (2026-07-24) |
| **Motor de cancelación y reembolsos** | Hallazgo (revisión 2026-07-24): la cancelación del asistente no estaba implementada (botón sin acción, `refund_tiers` sin aplicar) y la cancelación de retiro por el organizador no reembolsaba. Implementado como parte del paquete «cancelación flexible de lanzamiento»: `POST /api/bookings/[id]` (asistente, tramos + garantía 48 h + Stripe), reembolso íntegro automático en `POST /api/retreats/[id]` (organizador), webhook sin duplicados. | 🟢 Hecho (2026-07-24) |
| **Paquete «cancelación flexible de lanzamiento»** | Presets recentrados (default flexible 100 % >7 d / 50 % >3 d; nuevo preset clase/taller 100 % hasta 1 día antes), garantía Retiru 48 h, badge «Cancelación gratuita» en cards y fichas ES/EN, contrato v1.1, condiciones/ayuda/para-asistentes ES+EN, migración 052. | 🟢 Hecho (2026-07-24) |
| **Copy honesto en reserva sin pago** | Bajo el botón «Reservar plaza (sin pago)» se anunciaba «Visa, Mastercard y más», dando a entender que se pedía tarjeta cuando no se pide ninguna (confundió al propio equipo). Ahora en modo sin pago dice «Sin tarjeta ahora · Te avisaremos por email para completar el pago si se confirma» (ES+EN). | 🟢 Hecho (2026-07-24) |
| **Confirmación manual: solicitar plaza sin pago** | En retiros de confirmación manual el asistente ya **no paga antes** de que el organizador apruebe: la solicitud entra como `reserved_no_payment` (con SLA para el organizador), al aprobar se envía el enlace de pago con plazo (reutiliza la maquinaria de «mínimo alcanzado») y el pago confirma la plaza directamente. Si el SLA vence sin respuesta, la solicitud se anula sin coste. Migración 053 (`organizer_approved_at`), aplicada y verificada en prod. | 🟢 Hecho (2026-07-24) |
| **Más métodos de pago vía Stripe (Bizum, wallets, plazos)** | El checkout ya usa **métodos automáticos de Stripe** (eliminado `payment_method_types: ['card']`). Falta activar en el dashboard de Stripe **Bizum**, Apple Pay / Google Pay y Klarna. Guardarraíl decidido: **nada de pago fuera de la plataforma** (efectivo/transferencia al organizador) — todo debe quedar registrado y cobrado vía Stripe para que Retiru capture su comisión. Prerrequisito: claves Stripe reales en producción (hoy hay un placeholder; el checkout de pago no ha funcionado nunca). | 🟡 Código hecho (2026-07-24) — falta activar métodos en el dashboard |
| **Modo lanzamiento: inscripción sin cobro** | Mientras no haya claves Stripe reales, `/api/checkout` crea `reserved_no_payment` (sin deadline) en lugar de fallar. UI y emails honestos. Se apaga solo al configurar Stripe. | 🟢 Hecho (2026-07-30) |

---

## 7. Backlog de decisiones pendientes

- [ ] Aprobar (o no) el modelo de **verificación progresiva** (§5) — la mitad «producto» de los dos niveles de evento ya está hecha (2026-07-24); falta la mitad «requisitos por tipo de evento».
- [ ] Definir el **N** exacto del objetivo de inventario (propuesto: 5 retiros futuros).
- [ ] Elegir las **provincias objetivo** y la lista de 30–50 centros para la ronda de llamadas conserje.
- [ ] Decidir calendario de lanzamiento de la campaña de claims (#1 → #2 → #3).
- [ ] Definir el ritmo mínimo de publicación en Instagram (p. ej. 2–3 piezas/semana de contenido real).
- [ ] **Separación clases vs retiros en UX/SEO** *(aplazada a propósito — ver decisión 2026-07-24 nocheV)*: solo cuando haya volumen real de eventos de un día, decidir facetas/etiquetas («Clase», «Taller», «Retiro»), landings propias tipo «clases de yoga en [ciudad]» (ataca `yoga classes near me`, 644 imp. pos. 10) y cómo evitar que un buscador de «retiro yoga» aterrice en una página dominada por clases de 2 h.
- [ ] **Naming/posicionamiento** *(aplazada igual que la anterior)*: ¿Retiru sigue siendo «marketplace de retiros y escapadas» o pasa a «retiros, clases y experiencias de bienestar»? Afecta a home, metas y pitch de captación.
- [x] **Paquete «cancelación flexible de lanzamiento»** (sesión 2026-07-24 nocheVI): ✅ aprobado por el equipo (paquete completo, garantía 48 h incluida) e implementado en la misma sesión. Ver §6 y diario.
- [x] **Confirmación manual sin pago por adelantado** — ✅ aprobado e implementado en la sesión 2026-07-24 nocheVII (ver §6 y diario). Migración 053 aplicada y verificada en prod; código en `main` (commit `ec47626`).
- [x] **Pago fuera de la plataforma: NO** — ✅ decidido (2026-07-24 nocheVII): todo cobro debe quedar registrado y pasar por Stripe para que Retiru capture su comisión. Nada de efectivo ni transferencias directas al organizador.
- [ ] **Activar Bizum / wallets / Klarna en el dashboard de Stripe** — el código ya usa métodos automáticos (nocheVII); queda activar los métodos en el dashboard cuando estén las claves reales en producción.
- [x] **Corregir ficha Vinyasa Rodalquilar** (sesión 2026-07-30): ✅ convertido a serie diaria (`npm run retreats:fix-vinyasa-daily`).
- [x] **Modo inscripción sin cobro mientras no haya Stripe** (2026-07-30): ✅ implementado (`src/lib/payments.ts` + checkout). Sigue vigente el no al cobro offline; al poner claves Stripe reales se reactiva el pago.

---

## 8. Diario de sesiones

> Añadir cada sesión **arriba** (orden cronológico inverso). Formato: fecha, reflexiones planteadas, análisis/correcciones del agente, decisiones, trabajo ejecutado.

### 2026-07-30 — Clase Vinyasa Rodalquilar: mal modelada + checkout roto sin Stripe

**Reflexiones del equipo:**
1. El único evento publicado (Vinyasa Flow · Hotel Los Patios · Rodalquilar) se ve como un retiro de ~516 días; la organizadora lo pensó como **clase diaria** (misma hora, periodo largo).
2. Al pulsar «Reservar plaza» falla el pago («No se pudo iniciar el pago…»). Sin plataforma Stripe/Redsys operativa, ¿cómo dejar que la gente se inscriba aunque paguen después al organizador?

**Verificado en BD (prod):**
- Fila `retreats` `2d3ec590-…` / slug `…-mrzdxvl0`: `start_date=2026-08-03`, `end_date=2027-12-31`, `duration_days=516`, `duration_hours=null`, **`series_id=null`**, `confirmation_type=automatic`, `min_attendees=1`, precio 10 €, schedule Día 1 a las **20:00**.
- Tabla `retreat_series`: **0 filas**. No es un evento periódico; es un único retiro con fechas inicio/fin muy separadas (el rango que la organizadora usó como “periodo”, sin marcar «Evento periódico»).
- Por eso listados y ficha muestran «516 días · 515 noches».

**Análisis:**
- **Recurrencia:** el producto ya soporta serie diaria (`is_recurring` + `recurrence_interval_days=1` + `duration_hours` de la clase + `recurrence_end_date` opcional). Aquí no se usó.
- **Pago:** con confirmación automática y mínimo 1, el botón cobra ya vía Stripe. El mensaje de error es el catch de `/api/checkout` cuando falla `createCheckoutSession` (claves Stripe placeholder / no configuradas en Vercel) — hallazgo ya documentado en nocheVII/IX.
- **«Pagar luego al organizador»:** choca con la decisión nocheVII (**prohibido pago fuera de plataforma**). Alternativa temporal: modo lanzamiento inscripción sin cobro dentro de Retiru.

**Decisiones:** ✅ convertir Vinyasa a serie diaria; ✅ implementar modo lanzamiento 2 (inscripción sin cobro mientras no haya Stripe), sin reabrir pago offline al organizador.

**Trabajo ejecutado:**
1. Script `npm run retreats:fix-vinyasa-daily` — master same-day + `duration_hours=1.5`, serie `interval_days=1`, fin 2027-12-31, horizonte 7 fechas.
2. `src/lib/payments.ts` + checkout: si no hay Stripe real → `reserved_no_payment` sin deadline; UI/ficha/emails/ayuda ES+EN alineados. Se desactiva solo al poner claves reales (o `ONLINE_PAYMENTS_ENABLED=1` con claves válidas).
3. Contador de plazas de la ficha corregido: resta también las reservas sin pago (`spotsLeft`), incl. JSON-LD y estado «Agotado».
4. **Selector de inscripción en eventos periódicos** (commit posterior): al reservar en una serie se abre un modal con *solo esta fecha* o **calendario multiselección** (otra fecha suelta, cada lunes, todas…; fechas ya reservadas ✓, completas deshabilitadas). `GET /api/retreats/series/[id]` + `POST /api/checkout` con `{ seriesId, retreatIds }`; email resumen + aviso único al organizador. En Mis reservas, botón «Ampliar o modificar inscripción» por serie (mismo calendario). Horizonte máximo de inscripción anticipada: **7 semanas** (decisión 2026-07-30, `SERIES_BOOKING_HORIZON_DAYS`).

**Pendiente del equipo:** deploy a Vercel; cuando existan claves Stripe reales, el cobro vuelve solo; reserva de prueba end-to-end.

### 2026-07-24 (nocheIX) — Cierre de la noche: todo en `main` y BD al día

**Contexto:** cierre operativo de las sesiones nocheVI–VIII.

**Trabajo ejecutado:**
- **Commit `ec47626` subido a `main`** (44 archivos, +1.326/−180). Agrupa todo lo que estaba sin commitear: paquete de cancelación flexible (nocheVI: motor de reembolsos, presets, badge, migración 052), confirmación manual sin pago + métodos de pago automáticos + fixes de checkout (nocheVII, migración 053), copy del hero de `/es/retiros-retiru` (nocheVIII) y el fix de la migración 011 (auditoría BD).
- **Migración 053 verificada en producción** (`organizer_approved_at` existe; `npm run db:verify-migrations` en verde para toda la estructura). El deploy que dispare este push sale sin riesgo de columna inexistente.

**Pendiente del equipo (sin cambios, consolidado):**
1. Claves Stripe reales en Vercel (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`) — sin ellas el pago sigue fallando (ahora con error claro, ya no un 500 opaco).
2. Activar Bizum / Apple Pay / Google Pay / Klarna en el dashboard de Stripe.
3. Reserva de prueba end-to-end cuando estén 1 y 2 (la clase de 10 € de Rodalquilar sirve: confirmación inmediata → prueba checkout + webhook completos).

### 2026-07-24 (nocheVIII) — `/es/retiros-retiru` habla solo de retiros, ¿y las clases?

**Reflexión del equipo:** la página madre de eventos dice «Retiros y escapadas» pero no menciona lo nuevo (clases, talleres…). ¿Está optimizada para SEO o para UX?

**Análisis del agente:** para SEO está bien **a propósito**: el `<title>` ya dice «Retiros y eventos» y el H1 se queda en «Retiros y escapadas» porque las consultas core son `retiro yoga` / `retiro ayurveda` (§3bis); diluir el H1 con «clases» debilitaría esa relevancia, y las búsquedas de clases se atacan por directorio de centros y futuras landings propias (decisión nocheV, sigue vigente). Para UX sí había hueco: el único evento vivo es una clase de 10 € bajo un hero que solo promete retiros, y el contador decía «+1 retiros» (mal concordado).

**Trabajo ejecutado (copy, sin reabrir la decisión aplazada):** subtítulo del hero ES/EN ampliado a «retiros, clases, talleres y experiencias…», contador «+N evento(s)» con concordancia, meta description y keywords de `categoriesES/EN` ensanchadas (clases/talleres). H1 y title intactos.

### 2026-07-24 (nocheVII) — ¿Pedir datos de pago antes de confirmar el retiro es una barrera?

**Reflexión del equipo:** que quien se inscribe tenga que meter sus datos de pago antes de que el retiro se confirme y nazca la obligación de pagar, ¿no echa a la gente para atrás? ¿No es mejor que paguen cuando se apruebe, o incluso pagar de otra forma?

**Análisis del agente (corrección de premisa):** el caso principal ya funciona como se propone. En retiros grupales con mínimo > 1, la reserva es **sin tarjeta** (`reserved_no_payment`); solo al alcanzarse el mínimo llega el email con enlace de pago y 72 h de plazo. La confusión venía de dos sitios reales:

1. **Copy engañoso:** bajo el botón «Reservar plaza (sin pago)» se mostraba siempre «Visa, Mastercard y más…», anunciando tarjetas justo donde no se pide ninguna. Si confundió al fundador, confunde al usuario.
2. **Confirmación manual:** ahí sí se paga **antes** de que el organizador apruebe (reembolso si rechaza), y el motor de reembolsos no existe todavía (nocheVI) — pagar por adelantado, a marca desconocida, para algo no aprobado y sin reembolso automático es la barrera real.

En mínimo = 1 con confirmación inmediata no hay nada que cambiar: reservar es confirmar y el pago inmediato es lo esperable (diferirlo solo genera no-shows).

**Propuestas (en §6):** (1) copy honesto en modo sin pago — hecho en la sesión; (2) confirmación manual → solicitud sin pago y enlace de pago tras aprobación, reutilizando la maquinaria de «mínimo alcanzado» (descartada la retención de tarjeta con *manual capture*: misma fricción y menos métodos de pago); (3) más métodos vía Stripe: Bizum (clave en España), Apple/Google Pay, Klarna a plazos. **Guardarraíl:** nada de pago fuera de la plataforma — la comisión de Retiru se captura en el cobro y el pago offline invita a la desintermediación que ya se cuida en las fichas (sin teléfonos ni emails).

**Contexto técnico de la misma noche:** al intentar una reserva real de prueba se descubrió que el checkout de pago **no ha funcionado nunca en producción** — `STRIPE_SECRET_KEY` es un placeholder y ninguna reserva de la BD tiene sesión de Stripe. Arreglado en código: cálculo de `minReached` con mínimo = 1 (el botón decía «sin pago» y la API cobraba), `/api/checkout` ya no deja reservas huérfanas si Stripe falla, y limpiada la reserva bloqueante `RTR-A93440`. **Pendiente del equipo: poner las claves reales de Stripe en Vercel y desplegar.**

**Decisiones (segunda parte de la sesión):** ✅ aprobadas las tres propuestas — (1) confirmación manual sin pago por adelantado, (2) más métodos de pago dentro de Stripe, (3) **prohibido el pago fuera de la plataforma**: «todo debe quedar registrado y pagado antes para que Retiru cobre su comisión».

**Trabajo ejecutado (misma noche):**
- **Flujo de solicitud sin pago en confirmación manual** (migración 053, `bookings.organizer_approved_at`): el asistente «Solicita plaza (sin pago)» → el organizador acepta/rechaza desde su panel dentro del SLA → al aceptar (con mínimo cubierto) el asistente recibe email con enlace de pago y plazo (`sendBookingRequestApprovedEmail`) → al pagar, el webhook confirma la plaza directamente. Si el SLA vence sin respuesta, el cron anula la solicitud sin coste. Cruce con mínimo viable resuelto: los enlaces de «mínimo alcanzado» solo van a solicitudes aprobadas. Tocados: `/api/checkout`, `/api/bookings/[id]`, webhook Stripe, cron `sla-deadlines`, panel organizador, mis-reservas (lista+detalle, con cancelación de solicitudes), `ReserveButton` y fichas ES/EN, 2 emails nuevos + 1 adaptado.
- **Métodos de pago**: checkout con métodos automáticos de Stripe (tarjeta, Bizum, wallets, Klarna según lo activado en el dashboard).
- **Docs sincronizadas**: README (flujos, emails, crons, migraciones 049–053), ayuda/help, condiciones ES+EN, para-organizadores/for-organizers, contrato del organizador (cláusula SLA).

**Pendiente del equipo:** (1) claves Stripe reales en Vercel + desplegar; (2) ~~aplicar migración 053~~ ✅ aplicada y verificada la misma noche; (3) activar Bizum/wallets/Klarna en el dashboard de Stripe; (4) reserva de prueba end-to-end.

### 2026-07-24 (nocheVII) — Auditoría BD vs migraciones: bug latente del contador de plazas corregido

**Contexto:** tras aplicar la migración 052, el equipo pidió verificar que toda la BD de producción coincide con las migraciones del repo.

**Trabajo y hallazgos:**
- Nueva herramienta permanente `npm run db:verify-migrations` (`scripts/verify-migrations-db.mjs`): parsea las migraciones y contrasta tablas+columnas, vistas, buckets, enums clave y RPCs contra producción vía PostgREST.
- **Hallazgo crítico:** la migración 011 nunca se aplicó — un conflicto con una función de 001 revertía la transacción entera en el SQL Editor. Las RPC `increment/decrement_confirmed_bookings` no existían y el código las llama sin comprobar errores: el contador de plazas (`confirmed_bookings` / `available_spots`, el «Completo» de las cards y el mínimo viable) **no se habría actualizado con las reservas futuras**. Sin daño acumulado (1 reserva, contadores coherentes). Archivo corregido, RPCs creadas en prod por el equipo y verificado en verde.
- Migraciones 052 (default cancelación flexible) y 053 (`organizer_approved_at`, de otra sesión) aplicadas y verificadas.
- Detalle documental en `docs/SCHEMA-REVIEW.md` → «Verificación contra producción (julio 2026)» y README → «Migraciones y seeds».

**Pendiente del equipo:** deploy a Vercel del paquete de cancelación flexible (nocheVI).

### 2026-07-24 (nocheVI) — Cancelación mucho más flexible como palanca de lanzamiento (propuesta)

**Reflexión del equipo:** como app en pleno lanzamiento debemos ser mucho más flexibles en la política de cancelación.

**Análisis del agente:** de acuerdo, con matiz. El riesgo es asimétrico a favor: con ~0 reservas futuras, el coste esperado de una política generosa es casi nulo y el beneficio (que alguien pague ticket alto a meses vista en una marca desconocida) es máximo — «cancelación gratuita hasta X días» es la palanca de conversión estilo Booking. Matiz del lado oferta: el cuello de botella son los organizadores (§1), así que la flexibilidad se empuja vía **defaults, presets y visibilidad**, no imponiéndola (un retiro tiene costes fijos reales). Hallazgo técnico previo de la misma sesión: el motor de cancelación no existe (botón del asistente sin acción, `refund_tiers` sin aplicar en código, cancelación de retiro por organizador sin reembolso automático) — cambiar la política ahora no rompe nada, pero sin motor cualquier promesa es papel mojado.

**Propuesta (paquete «cancelación flexible de lanzamiento»):** (1) recentrar presets un escalón y default = flexible (100 % >7 d / 50 % >3 d / 0 % después; estándar = flexible actual; estricta = estándar actual; desaparece la estricta actual de máx. 50 %); (2) garantía Retiru de arrepentimiento: 100 % en las 48 h tras reservar si faltan >7 d; (3) badge «Cancelación gratuita hasta X días antes» en cards y ficha; (4) preset 24–48 h para clases/eventos de un día (frente 6); (5) motor de reembolsos real (asistente + cancelación de retiro), ver §6; (6) docs coherentes (condiciones, ayuda, para-asistentes, contrato cláusula 8, README).

**Decisión tomada:** ✅ el equipo aprueba el **paquete completo con garantía de 48 h incluida**.

**Trabajo ejecutado (misma sesión):**
- Presets recentrados en el wizard (`CANCELLATION_PRESETS`): flexible (nuevo default, 100 % >7 d / 50 % >3 d), estándar (antiguo flexible), estricta (antiguo estándar; el estricta de máx. 50 % desaparece) y nuevo preset **clase/taller** (100 % hasta 1 día antes). Migración 052 cambia el default en BD.
- Motor de reembolsos: `POST /api/bookings/[id]` (cancelación del asistente: `getCancellationRefund` en `src/lib/utils` aplica garantía 48 h + tramos, reembolso Stripe total/parcial, emails a ambas partes); botón funcional con preview del importe en `/es/mis-reservas/[id]`; `POST /api/retreats/[id]` ahora marca reservas `cancelled_by_organizer` y reembolsa el 100 % automáticamente; webhook `charge.refunded` ya no machaca estados ni duplica emails de los flujos propios.
- Visibilidad: badge «Cancelación gratuita hasta X días antes» en `EventCard` y en las fichas ES/EN (cabecera de la política + sidebar de reserva), con nota de la garantía 48 h en la sección de política.
- Coherencia documental: contrato del organizador **v1.1 · 2026-07** (garantía en cláusula 8, ES+EN), `/es|/en/condiciones`, ayuda ES+EN, para-asistentes ES+EN, README y ROUTES.

### 2026-07-24 (nocheV) — Decisión: ahora prima el volumen; la dilución se gestiona cuando exista

**Reflexión del equipo:** respecto a los riesgos de dilución y nicho señalados en la sesión anterior — «ahora queremos tráfico, movimiento; es mejor que no tener eventos».

**Análisis del agente:** de acuerdo sin matices en esta fase. Con 0 eventos futuros publicados, la dilución es un problema imaginario: no se puede diluir un listado vacío. Una landing con 3 clases y 1 taller gana a una landing en blanco ante Google (frescura, fechas futuras), ante el visitante (web viva, reseñas recientes) y ante el siguiente organizador que evalúe publicar. La dilución es un *good problem to have*: si llega, se resuelve con facetas/etiquetas (trabajo menor, ya definido en backlog). Freno estructural ya incorporado: cada serie muestra solo su próxima fecha en listados.

**Decisión tomada:** ✅ prioridad a corto plazo = **volumen y movimiento de eventos, del tipo que sea** (clases, sesiones, talleres, gastronómicos…). Las dos entradas del backlog §7 sobre separación UX/SEO y naming quedan **aplazadas conscientemente** hasta que el volumen de eventos de un día sea real; no son requisito para captar.

**Consecuencia operativa:** el frente 6 de captación (§4) es ejecutable ya, sin esperar a nada de producto. Lo único que sigue frenando ese perfil es el KYC de 5 documentos (§5, verificación progresiva) — próxima decisión de producto sobre la mesa.

### 2026-07-24 (noche++++) — Eventos de un día y periódicos: de marketplace de retiros a plataforma de actividades de bienestar

**Reflexión del equipo:** con los eventos de un día (duración en horas), el precio sin mínimo y los eventos periódicos, cualquiera puede publicar una clase de yoga, una sesión de terapia o incluso un evento gastronómico. ¿Es el gran cambio que amplía el espectro de oferta de la web?

**Análisis del agente (pros):**
1. **Ataca directamente el cuello de botella del §1 (oferta) y lo hace de forma estructural:** una clase semanal es inventario futuro que *no caduca* — el cron repone fechas solo. El problema de «el inventario se seca» (8 retiros pasados, 0 vigentes) no existe para las series.
2. **La demanda ya estaba medida:** la consulta nº 1 del sitio en GSC es `yoga classes near me` (644 imp., pos. 10), por delante de cualquier término de retiro. Hasta ahora no había producto que ofrecerle; ahora sí.
3. **Baja la barrera de captación:** pedir a una profesora que publique su clase de los martes es una venta mucho más fácil que pedirle un retiro de 3 días. Y es el **embudo** ya descrito en §5: quien publica clases hoy organiza su primer retiro en un año, ya dentro de la plataforma. Nuevo frente 6 en §4.
4. **Efectos compuestos:** más eventos → más reseñas y más rotación de fechas → más señales de vida para Google y más confianza para el comprador de retiros (ticket alto).
5. **Coste de oportunidad casi nulo:** la infraestructura (checkout, SLA, reseñas, recordatorios) se reutiliza entera; una serie cuenta como 1 retiro en la comisión, así que no rompe el modelo.

**Análisis del agente (contras / riesgos):**
1. **Economics por reserva:** 20 % de una clase de 15 € son 3 €, y Stripe se lleva parte. Las clases no son negocio por sí mismas: son **tráfico, hábito y embudo**. No desviar esfuerzo comercial del producto que paga las facturas (retiros).
2. **Dilución de marca/UX:** «Retiru — retiros y escapadas» con listados dominados por clases de 2 h puede confundir al buscador de retiros. Mitigación en backlog §7: facetas/etiquetas por tipo de evento y, más adelante, landings propias de clases.
3. **Competencia distinta:** en clases se compite con Google Maps, gimnasios y el WhatsApp del profesor (gratis). El valor diferencial de Retiru ahí es cobro online + página reservable + reseñas, no el descubrimiento.
4. **El KYC es ahora el cuello de botella (§5):** exigir 5 documentos para publicar una clase de 15 € anula la ventaja de la barrera baja. La verificación progresiva sube de prioridad.
5. **Moderación:** más eventos pequeños = más cola de revisión (las ocurrencias clonadas no pasan por revisión, eso ya está resuelto; los eventos nuevos sí).

**Decisiones:** ninguna formal; añadidas dos al backlog §7 (separación clases vs retiros en UX/SEO; naming/posicionamiento). El frente 6 de captación queda definido y listo para ejecutar.

**Trabajo ejecutado (producto, 2 commits previos + este):** migraciones 049 (PVP > 0), 050 (`duration_hours`), 051 (`retreat_series` + `series_id`/`is_series_next`); generador de ocurrencias (`src/lib/series.ts`); cron diario `series-occurrences`; toggle de recurrencia en el wizard + conversión de evento existente en periódico desde la edición (`POST /api/retreats/series`); listados/sitemap con solo la próxima fecha; chips «próximas fechas» en ficha ES/EN; panel con fechas programadas, cierre por vacaciones y detener serie; serie = 1 retiro para comisión. Documentación: README (posicionamiento y sección nueva), ROUTES, SCHEMA-REVIEW, FAQ de para-organizadores y ayuda ES+EN, y este cuaderno.

### 2026-07-24 (noche+++) — Deploy verificado + landing ayurveda creada

**Deploy:** commits `3a35b1a` + `cdd0141` (fix typecheck) + `ce7d7e6` (fix galería: no pasar funciones a client components) en producción. Barrido de **1.010 URLs** (todas las fichas de centro ES+EN + páginas clave): **1.009 OK**.

**Hallazgo importante:** el único 404 era `/es/retiros-ayurveda` — la categoría `ayurveda` **no existía en la tabla `categories`** (el §3bis asumía que la landing existía). `retiro ayurveda` (279 imp., pos. 61) apuntaba a un 404: imposible posicionar.

**Fix:** insertada categoría `ayurveda` por script (intro ES/EN, meta ES/EN, FAQ formato `{question, answer}`, icono, sort_order 3). `/es/retiros-ayurveda` y `/en/retreats-ayurveda` ya responden **200**.

### 2026-07-24 (noche++) — Prohibido Place Photo (coste)

**Decisión:** no usar Google Places Photo API. Las imágenes las aportan los centros o se buscan fuera de Google API.

**Trabajo:** `centers:places-sync` solo pide `rating,reviews,regularOpeningHours` (sin campo `photos` ni descarga `/media`). Docs README / SEO-LANDINGS actualizados.

### 2026-07-24 (noche+) — Migración 048 confirmada y volcada

**Contexto:** el equipo compartió credenciales de API de Supabase (no hace falta `DATABASE_URL` si el DDL ya está en prod).

**Hallazgo:** columnas `google_reviews` / `google_opening_hours` / `google_data_synced_at` **ya existían** en producción.

**Trabajo:** `npm run centers:places-sync -- --force --no-photos` → **499 ok · 1 error**; reseñas y horario volcados a columnas (sin re-descargar fotos).

**Pendiente del equipo:**
1. **Rotar** las claves que se pegaron en el chat (service role / secret) y no volver a compartirlas en conversaciones.
2. Desplegar a Vercel.
3. Inventario retiros (§3bis / §4) + artículo EN *nature retreat meaning*.

### 2026-07-24 (noche) — Priorizar queries genéricas de GSC

**Reflexión del equipo:** hay impresiones fuertes en términos genéricos (`yoga classes near me`, `nature retreat meaning`, `retiro ayurveda`, `retiro yoga`). Las dos primeras están peleables (pos. ~8–10); las de retiro están el core del negocio pero están en pos. 45–61 — hay que atacarlas.

**Análisis:**
- Confirmado el marco del §3bis: separar intent informacional / local-clases / transaccional-retiro.
- `retiro yoga` y `retiro ayurveda` no se ganan con más SEO técnico: la landing ya existe; Google ve listados sin oferta futura.
- `nature retreat meaning` es la victoria rápida (blog EN).
- `yoga classes near me` se trabaja por directorio + ciudades, no como retiro.

**Trabajo:** documentado el plan de ataque en §3bis. Sin código nuevo en esta micro-sesión.

**Próximo paso acordado:** (1) inventario en `/es/retiros-yoga` y `/es/retiros-ayurveda`, (2) publicar artículo EN sobre *nature retreat meaning*, (3) deploy de lo ya hecho esta tarde.

### 2026-07-24 (tarde) — Ejecución SEO tras auditoría GSC

**Reflexiones:** el equipo pidió arreglar las carencias de la auditoría SEO (indexación, fichas de centro, autoridad, landings genéricas, CTR bajo).

**Análisis confirmado con datos:**
- ~243–311 fichas EN sin `description_en` (placeholder) → candidatos claros a «rastreadas sin indexar».
- Migración `048` (reseñas/horario Places): en esa sesión aún no se había verificado en prod; **más tarde (noche+) confirmada aplicada** y datos volcados a columnas.
- Capas SEO 5/2/4 sin `sections_es`; Cap. 3 ya completa (91/91).
- 0 retiros vigentes → landings de retiros vacías ante Google.

**Trabajo ejecutado:**
- Jobs completados: `centers:translate-en` (242/243 OK; queda 1 sin EN), `centers:places-sync` (499 OK · 1.569 fotos Places · reseñas/horario en Storage), `seo:sections` Cap.5/2/4 (+ backfill sections desde intro).
- UI fichas centro: FAQ contextual + schema FAQPage; OG image de portada; reseñas/horario Places (ES/EN).
- Landings de retiros nunca vacías (§6) implementadas.
- Badge «Estamos en Retiru» ya en `/es/mis-centros` para reclamados.
- `createStaticSupabase` preferirá service role en sitemap/SSG si está en el entorno (destinos en sitemap).
- Canvas de auditoría: `canvases/auditoria-seo-retiru.canvas.tsx`.

**Pendiente del equipo (actualizado en noche+):** deploy Vercel + oferta + blog EN; 048 ya resuelta.

### 2026-07-24 — Sesión fundacional: diagnóstico y plan

**Reflexiones planteadas por el equipo:**
1. Estancamiento en marketing: no se ve por dónde empujar (Instagram con fotos IA «horroroso», falta tráfico/seguidores, la única idea es llamar centro a centro).
2. Duda sobre la verificación de organizadores: ¿los 5 documentos echan para atrás al organizador pequeño (p. ej. profesora de yoga con clases en la playa)? ¿Hacerlo más soft o dar opción de «habla con el equipo»?

**Análisis del agente:**
- Reordenación: el problema no es Instagram; el activo de tráfico es el SEO ya construido. El cuello de botella real es la **oferta**.
- Hallazgo crítico verificado en BD: **0 retiros vigentes publicados** (8 pasados, 1 `pending_review` de octubre, 1 borrador caducado) → explica posiciones 45/61.
- Propuestas: plan de captación en 4+1 frentes (§4), verificación progresiva (§5), landings nunca vacías (§6), 3 métricas semanales (§3), objetivo ≥ 5 retiros futuros (§2).

**Trabajo ejecutado en la sesión:**
- Email interno con el informe completo enviado a `contacto@retiru.com` (CC `narciso.pardo@acttax.es`). Plantilla: `mailing/interno-2026-07-24-estrategia-marketing.html`.
- Fix: `scripts/count-retreats.mjs` ya no se traga errores de conexión (antes mostraba «No hay retiros» con la red corporativa interceptando TLS; ahora muestra el error y la pista `NODE_TLS_REJECT_UNAUTHORIZED=0`).
- Mejora: `scripts/send-mailing-test.mjs` acepta `--cc=email`.
- Creado este documento y enlazado desde `README.md`; regla `documentacion-sync.mdc` ampliada para que las sesiones de estrategia lean y actualicen este cuaderno.

**Decisiones tomadas:** ninguna formal todavía (todo en backlog §7). Compromiso del equipo: contenido real en Instagram.

**Próximo paso acordado:** seguir iterando por reflexiones; el agente parte siempre de este documento.
