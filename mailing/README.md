# Mailing HTML — Retiru + ESKALA

## Emails Retiru (directorio de centros)

Emails transaccionales y de captación para la estrategia de crecimiento del directorio de centros.

### Secuencia de onboarding

| # | Archivo | Asunto sugerido | Cuándo enviar |
|---|---------|-----------------|---------------|
| 1 | `retiru-bienvenida-centro.html` | Enhorabuena, tu centro ha sido incluido en Retiru | Día 0 — primera toma de contacto |
| 2 | `retiru-crea-tu-evento.html` | Crea tu primer evento en Retiru | Día 7-14 — activación |

### Personalización

Ambos emails incluyen variables que deben sustituirse antes del envío:

| Variable | Ejemplo | Dónde aparece |
|----------|---------|---------------|
| `{{NOMBRE_CENTRO}}` | Yoga Sala Madrid | Saludo y cuerpo |
| `{{URL_PERFIL}}` | `retiru.com/es/centro/yoga-sala-madrid` | Link "ver tu ficha" |
| `{{CENTER_SLUG}}` | `yoga-sala-madrid` | Link secundario al perfil |
| `{{CLAIM_TOKEN}}` | `abc123...` (base64url) | Botón CTA "Reclamar mi centro" |
| `{{CIUDAD}}` | Madrid | Cuerpo del texto |

> **Flujo de reclamación:** El email de bienvenida incluye un link mágico `https://retiru.com/es/reclamar/{{CLAIM_TOKEN}}` que permite al dueño reclamar su centro con un clic. Los tokens se generan con `npm run centers:claim-tokens`.

### Datos de contacto Retiru

```
Email remitente: contacto@retiru.com
Web: https://www.retiru.com
```

### Compatibilidad

Ambos emails siguen las mismas reglas de compatibilidad que los de ESKALA (ver abajo): tablas HTML, estilos inline, condicionales MSO, responsive 600px, sin gradientes ni animaciones.

### Logo

El header replica el logo del navbar de retiru.com: "retiru" en Georgia serif terracota + punto redondo terracota. Compatible con Outlook (MSO conditional comments).

### Checklist pre-envío Retiru

- [ ] Email remitente: `contacto@retiru.com`
- [ ] Variables personalizadas sustituidas (`{{NOMBRE_CENTRO}}`, `{{URL_PERFIL}}`, `{{CENTER_SLUG}}`, `{{CLAIM_TOKEN}}`)
- [ ] Tokens de claim generados (`npm run centers:claim-tokens`)
- [ ] Todos los links apuntan a `retiru.com` (no localhost)
- [ ] Link "Cancelar suscripción" con mailto a `contacto@retiru.com`
- [ ] Probado en Outlook Desktop y Gmail
- [ ] Responsive verificado (600px)
- [ ] Cumple RGPD

---

## Emails ESKALA Marketing Digital (referencia)

Emails de ejemplo de otro proyecto (Eskala Digital) usados como referencia de diseño y estructura.

### Emails de Marca (Presentación General)

| Archivo | Descripción | Estilo |
|---------|-------------|--------|
| `email-franjas-murcia.html` | Versión original con franjas verticales | Clásico |
| `eskala-franjas-vertical.html` | Versión mejorada, más impactante | Profesional |
| `eskala-dia-noche-animado.html` | Con animaciones CSS (luna, sol, estrellas) | Espectacular |

### 🌅 Emails Día/Noche (5 Versiones)

| Archivo | Concepto | Ideal para |
|---------|----------|------------|
| `v1-horizonte-completo.html` | Horizonte completo con sol y nubes | Primer contacto |
| `v2-timeline-24h.html` | Timeline de 24 horas narrativo | Storytelling |
| `v3-split-dia-noche.html` | Split vertical día/noche | Impacto visual |
| `v4-viaje-amanecer.html` | Viaje del amanecer con métricas | Resultados |
| `v5-cielo-completo.html` | Cielo completo con constelaciones | Premium |

### 🎯 Campaña Kit Digital (10 Versiones)

Emails agresivos para empresas que recibieron un mal servicio del Kit Digital.

#### Estilo Visual (Adaptados de v2-v5)

| Archivo | Basado en | Descripción |
|---------|-----------|-------------|
| `kit-digital-timeline-24h.html` | v2-timeline | Narrativa temporal del problema |
| `kit-digital-split-dia-noche.html` | v3-split | Contraste problema/solución |
| `kit-digital-viaje-amanecer.html` | v4-viaje | De la oscuridad al éxito |
| `kit-digital-cielo-completo.html` | v5-cielo | Servicios en cielo degradado |

#### Expresiones Murcianas/Españolas 🇪🇸

| Archivo | Expresión | Emoji | Color Principal |
|---------|-----------|-------|-----------------|
| `kit-digital-nurdo-murciano.html` | "Te han hecho un ñurdo" | 💩 | Marrón/Naranja |
| `kit-digital-truno.html` | "Te han hecho un truño" | 💩🪰 | Marrón tierra |
| `kit-digital-churro-murciano.html` | "Te han hecho un churro" | 🥖 | Beige/Crema |
| `kit-digital-queso.html` | "Te la han dado con queso" | 🧀 | Amarillo/Dorado |
| `kit-digital-doblada.html` | "Te la han metido doblada" | 📐 | Rojo oscuro |
| `kit-digital-moto.html` | "Te han vendido la moto" | 🏍️ | Gris/Naranja |
| `kit-digital-pelo.html` | "Te han tomado el pelo" | ✂️💇 | Marrón dorado |
| `kit-digital-cara.html` | "Te han visto la cara" | 👀 | Púrpura |
| `kit-digital-tangado.html` | "Te han tangado" | 💸 | Negro/Dorado |
| `kit-digimal.html` | "Kit DigiMAL" (terminal) | 💻 | Verde terminal |

---

## ✅ Compatibilidad con Outlook y Clientes Tradicionales

**TODOS los emails están optimizados para Outlook, Gmail, Apple Mail y clientes tradicionales:**

- ✅ **Sin linear-gradient()** — Usa `bgcolor` y `background-color` sólidos
- ✅ **Sin radial-gradient** — Elementos decorativos eliminados o reemplazados
- ✅ **Sin position: absolute** — Layout basado en tablas
- ✅ **Sin @keyframes/animaciones** — Compatible con todos los clientes
- ✅ **Fuente Arial** — Universal, sin dependencia de Google Fonts
- ✅ **Tablas HTML** — Layout clásico para máxima compatibilidad
- ✅ **Estilos inline** — Donde sea necesario
- ✅ **Condicionales MSO** — `<!--[if mso]>` para Outlook
- ✅ **Responsive** — Media queries para móviles (600px)

---

## 🔗 Links y CTAs en Todos los Emails

**Cada email incluye:**
- **CTA principal** (botón o enlace destacado) que dirige a la web o contacto
- **Link "Visita nuestra web"** en emails Kit Digital (además del mailto)
- **Logo/header** con enlace a https://www.eskaladigital.com
- **Footer** con navegación completa:

```html
<!-- Links de navegación -->
<a href="https://www.eskaladigital.com">Home</a>
<a href="https://www.eskaladigital.com/quienes-somos">Quiénes Somos</a>
<a href="https://www.eskaladigital.com/portfolio">Portfolio</a>
<a href="https://www.eskaladigital.com/blog">Blog</a>
<a href="https://www.eskaladigital.com/contacto">Contacto</a>

<!-- Cancelar suscripción -->
<a href="mailto:contacto@eskaladigital.com?subject=Quiero%20cancelar%20mi%20suscripci%C3%B3n%20a%20ESKALA%20MARKETING%20DIGITAL">
    Cancelar suscripción
</a>
```

---

## 📞 Datos de Contacto

```
Email: contacto@eskaladigital.com
Teléfono: +34 626 82 34 04
Ubicación: Murcia, España
Web: https://www.eskaladigital.com
```

---

## 📱 Compatibilidad Probada

| Cliente | Soporte |
|---------|---------|
| Outlook 2016/2019/365 Desktop | ✅ Completo |
| Outlook.com (web) | ✅ Completo |
| Gmail (web/móvil) | ✅ Completo |
| Apple Mail (iOS/macOS) | ✅ Completo |
| Yahoo Mail | ✅ Completo |
| Thunderbird | ✅ Completo |
| Samsung Mail | ✅ Completo |

---

## 🎯 Recomendaciones de Uso

### Por Objetivo:

| Objetivo | Email Recomendado |
|----------|-------------------|
| Primer contacto frío | `v2-timeline-24h.html` o `v4-viaje-amanecer.html` |
| Empresas con Kit Digital malo | Cualquiera de la campaña Kit Digital |
| Impacto visual máximo | `v5-cielo-completo.html` |
| Tono cercano/murciano | `kit-digital-nurdo-murciano.html` o `churro` |
| Tono profesional/tech | `kit-digimal.html` |
| Empresas serias | `kit-digital-tangado.html` |

### Por Industria:

| Industria | Expresión Recomendada |
|-----------|----------------------|
| Hostelería/Restauración | "churro", "queso" |
| Comercio tradicional | "ñurdo", "truño" |
| Profesionales/Abogados | "tangado", "doblada" |
| Tech/Startups | "kit-digimal" |
| General | "moto", "pelo", "cara" |

---

## 📝 Subject Lines Sugeridos

### Para Kit Digital:

```
❌ "¿Te han hecho un ñurdo con el Kit Digital?"
🧀 "Te la han dado con queso... ¿y ahora qué?"
🏍️ "Te vendieron la moto del Kit Digital"
💇 "Kit Digital: ¿te han tomado el pelo?"
💸 "¿2.000€ de subvención y esto es lo que tienes?"
💻 "Kit DigiMAL: el error que todos cometieron"
```

### Para Marca:

```
🌅 "Tu negocio, de la noche al día"
⭐ "El marketing que tu empresa merece"
🚀 "¿Listo para escalar?"
```

---

## 🚀 Cómo Usar

### 1. Seleccionar email
Elige según el objetivo y audiencia.

### 2. Personalizar (opcional)
- Cambiar nombre de empresa en saludos
- Ajustar CTA según campaña
- Modificar subject line

### 3. Enviar
- **Plataforma recomendada:** Mailchimp, Brevo, Mailerlite
- **No recomendado:** Gmail directo para envíos masivos

### 4. Trackear
- Open rate
- Click rate por sección
- Conversiones (respuestas al email)

---

## Estructura de archivos

```
mailing/
├── README.md                          # Este archivo
│
├── # ═══ RETIRU (emails activos) ═══
├── retiru-bienvenida-centro.html      # Email 1: bienvenida al directorio
├── retiru-crea-tu-evento.html         # Email 2: crea tu primer evento
│
├── # ═══ ESKALA (referencia) ═══
├── CATALOGO-COMPLETO.md
├── ALTERNATIVA-GIF.md
├── email-franjas-murcia.html
├── eskala-franjas-vertical.html
├── eskala-dia-noche-animado.html
├── v1-horizonte-completo.html
├── v2-timeline-24h.html
├── v3-split-dia-noche.html
├── v4-viaje-amanecer.html
├── v5-cielo-completo.html
├── kit-digital-*.html                 # 10 versiones Kit Digital
│
└── enviados/                          # Emails ya enviados (historial)
```

---

## ✅ Checklist Pre-Envío

- [ ] Email remitente: `contacto@eskaladigital.com`
- [ ] Subject line atractivo
- [ ] Todos los links funcionan (Home, Quiénes Somos, Portfolio, Blog, Contacto)
- [ ] Link "Cancelar suscripción" con mailto correcto
- [ ] **Probado en Outlook** (Desktop y web)
- [ ] **Probado en Gmail** (web y app)
- [ ] Responsive verificado (móvil 600px)
- [ ] Sin errores ortográficos
- [ ] Cumple RGPD

---

**Total de emails disponibles:** 22

**¿Listo para enviar?** 🚀
