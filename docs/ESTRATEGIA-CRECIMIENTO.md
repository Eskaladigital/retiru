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

---

## 7. Backlog de decisiones pendientes

- [ ] Aprobar (o no) el modelo de **verificación progresiva** (§5) — la mitad «producto» de los dos niveles de evento ya está hecha (2026-07-24); falta la mitad «requisitos por tipo de evento».
- [ ] Definir el **N** exacto del objetivo de inventario (propuesto: 5 retiros futuros).
- [ ] Elegir las **provincias objetivo** y la lista de 30–50 centros para la ronda de llamadas conserje.
- [ ] Decidir calendario de lanzamiento de la campaña de claims (#1 → #2 → #3).
- [ ] Definir el ritmo mínimo de publicación en Instagram (p. ej. 2–3 piezas/semana de contenido real).
- [ ] **Separación clases vs retiros en UX/SEO:** cuando haya volumen de eventos de un día, decidir si los listados necesitan facetas/etiquetas («Clase», «Taller», «Retiro»), landings propias tipo «clases de yoga en [ciudad]» (ataca `yoga classes near me`, 644 imp. pos. 10) y cómo evitar que un buscador de «retiro yoga» aterrice en una página dominada por clases de 2 h.
- [ ] **Naming/posicionamiento:** ¿Retiru sigue siendo «marketplace de retiros y escapadas» o pasa a «retiros, clases y experiencias de bienestar»? Afecta a home, metas y pitch de captación.

---

## 8. Diario de sesiones

> Añadir cada sesión **arriba** (orden cronológico inverso). Formato: fecha, reflexiones planteadas, análisis/correcciones del agente, decisiones, trabajo ejecutado.

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
