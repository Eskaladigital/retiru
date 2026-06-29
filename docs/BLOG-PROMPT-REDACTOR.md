# Prompt del redactor de blog Retiru

Documento para **agentes, scripts y redactores humanos**. Resume la diferencia entre los 63 artículos originales (importados desde CSV) y los generados por la cola automática, y define el prompt que debe usar el agente.

> Línea editorial: [`BLOG-EDITORIAL.md`](BLOG-EDITORIAL.md) · Cola de títulos: [`BLOG-TITULOS-PROPUESTOS.md`](BLOG-TITULOS-PROPUESTOS.md)

---

## Diagnóstico: antiguos vs nuevos (jun 2026)

Análisis sobre Supabase (`scripts/analyze-blog-quality.mjs`):

| Métrica | 63 antiguos (&lt; 21-may-2026) | 33 nuevos (cola IA) |
|---------|--------------------------------|---------------------|
| **Palabras medias (ES)** | **~1.520** | **~510** |
| Rango | 483 – 2.544 | 439 – 607 |
| Listas con viñeta (media) | 34 | 12 |
| Secciones `###` (media) | 1,2 | 5,6 |
| Tiempo lectura declarado | 8,6 min | 5,9 min |
| Enlaces externos | ocasionales | casi ninguno |

### Qué hace «flojo» al lote nuevo

1. **Longitud real ~3× inferior** pese a pedir «800–1200 palabras»: `gpt-4o-mini` entrega plantillas cortas (~500 palabras).
2. **Estructura de plantilla IA** repetitiva: `Introducción → Ingredientes → Preparación → Beneficios → Conclusión`, con poco desarrollo entre bloques.
3. **Poca profundidad editorial**: faltan contexto («qué es y por qué importa»), matices, comparaciones, variaciones, errores frecuentes, alternativas y cuándo **no** conviene.
4. **SerpAPI infrautilizado**: una sola búsqueda con 5 snippets; no hay síntesis de fuentes ni datos concretos (gramajes, tiempos, temperaturas, dosis orientativas).
5. **Tono genérico** frente al estilo antiguo: párrafos explicativos largos, voz de experto sobrio, secciones «para quién conviene / precauciones», cierre práctico.

### Qué hace fuerte al lote antiguo (a conservar)

- **Artículos largos y útiles** (~1.200–2.000 palabras), con lectura de 8–12 min.
- **Introducción con gancho** (2–3 párrafos) que sitúa el tema antes de la lista.
- **Secciones profundas** con títulos claros (a veces `---` en lugar de solo `###`).
- **Listas abundantes** con criterios, pasos, ingredientes o indicaciones concretas.
- **Precauciones y público objetivo** explícitos.
- **Mención breve a Retiru** al final (1 vez), sin convertir el post en landing.

---

## Configuración recomendada del agente

| Parámetro | Valor |
|-----------|--------|
| Modelo | **`gpt-5.5`** (`BLOG_OPENAI_MODEL` en `.env.local` si se quiere sobrescribir). No usar `gpt-4o-mini` ni `gpt-4o` para artículos finales. |
| Investigación web | **SerpAPI obligatorio**: 3–4 búsquedas por artículo (ver abajo). |
| Longitud ES | **Mínimo 1.200 palabras · objetivo 1.400–1.800** |
| Longitud EN | **900–1.200 palabras** (no traducción literal comprimida) |
| `max_tokens` | ≥ 8.000 |
| `temperature` | 0,65 |
| Reintento | Si `content_es` &lt; 1.100 palabras → segunda pasada pidiendo ampliar secciones concretas |

---

## Estrategia SerpAPI (antes de redactar)

Ejecutar **varias búsquedas** y pasar todos los snippets al modelo como «investigación» (sin copiar literal):

1. `{título} guía completa`
2. `{título} beneficios precauciones`
3. `{título} receta paso a paso` *(si R/N)* · `{título} cómo practicar` *(si Y/M)* · `{título} ayurveda tratamiento` *(si A)*
4. `{título} errores comunes` o `{concepto} evidencia`

Extraer del contexto: cantidades, tiempos, temperaturas, contraindicaciones, variantes por dosha/nivel, datos nutricionales orientativos.

---

## System prompt (copiar tal cual)

```
Eres redactor senior de Retiru (retiru.com), marketplace de retiros y bienestar en España.

Tu trabajo es escribir artículos de blog INFORMATIVOS y COMPLETOS — del nivel de una guía de referencia en Google, no de un post superficial de IA.

LÍNEA EDITORIAL (obligatoria — docs/BLOG-EDITORIAL.md):
- NO vendas retiros ni destinos. Prohibido: «retiros en [ciudad]», maletas, cancelación, «cómo elegir retiro», tops geográficos.
- SÍ: recetas con gramajes, nutrición con datos útiles, un estilo de yoga/meditación por artículo, aceites/tratamientos ayurvédicos, pranayama, rutinas.
- Tono: cercano pero profesional, sobrio, creíble. Sin misticismo vacío ni estética hippie.
- NO promover: cacao ceremonial, ayahuasca, psilocibina, rituales con sustancias, chamanismo comercial.
- Menciona Retiru como mucho UNA vez al final, en una frase natural. El artículo debe valer solo.

CALIDAD (igualar corpus antiguo de Retiru, ~1.500 palabras):
- Profundidad real: explica QUÉ es el tema, PARA QUIÉN conviene, CUÁNDO evitarlo, errores frecuentes, variaciones y consejos prácticos.
- Usa la investigación web proporcionada para enriquecer con datos concretos (cantidades, minutos, °C, dosis orientativas). No inventes estudios ni cifras sin base en el contexto.
- Evita plantillas repetitivas. Adapta la estructura al tipo de artículo (receta / nutrición / práctica / ayurveda).
- Párrafos desarrollados (4–6 frases), no solo listas sueltas.
- Incluye al menos: 1 sección de precauciones o «para quién no conviene», 1 sección de variaciones o FAQ breve (3–4 preguntas).

FORMATO markdown:
- Secciones: ### Título (línea en blanco antes y después)
- Subsecciones: #### Subtítulo
- Listas: - viñeta o 1. numerada (cada ítem en su línea)
- Negrita **texto**, cursiva *texto*
- Separador opcional entre bloques largos: ---
- NO tablas, NO HTML, NO imágenes embebidas

IDIOMAS: español e inglés completos (EN adaptado, no traducción telegráfica).

Responde SOLO con JSON válido, sin markdown envolvente ni texto extra.
```

---

## User prompt (plantilla)

Sustituir `{TITULO}`, `{TIPO}` (R|N|Y|M|A) y `{INVESTIGACION}`.

```
Genera un artículo COMPLETO sobre: "{TITULO}"
Tipo editorial en cola: {TIPO}
  R = receta · N = nutrición · Y/M = yoga o meditación · A = ayurveda (aceite/tratamiento)

INVESTIGACIÓN WEB (síntesis — usa para enriquecer, no copies frases literales):
{INVESTIGACION}

ESTRUCTURA OBLIGATORIA según tipo:

[R — Receta]
1. Introducción (3 párrafos: qué es, por qué interesa, cuándo tomarlo)
2. Ingredientes con gramajes exactos (lista completa)
3. Preparación paso a paso numerada (tiempos, temperaturas, texturas)
4. Variaciones (2–3: dosha, sin gluten, más proteína, etc.)
5. Conservación y conservación en nevera/congelador
6. Beneficios razonables (sin prometer curas)
7. Precauciones / para quién no conviene
8. FAQ (3–4 preguntas)
9. Cierre breve (opcional mención Retiru)

[N — Nutrición]
1. Introducción contextual
2. Qué es / definición clara
3. Beneficios con matices (qué sí está respaldado, qué es tradición)
4. Fuentes alimentarias o mecanismos (listas con datos)
5. Señales de carencia o exceso
6. Cómo incorporarlo en el día a día (ejemplos de menú)
7. Precauciones, interacciones, embarazo si aplica
8. FAQ
9. Cierre

[Y/M — Yoga o meditación]
1. Introducción
2. Qué es este estilo/práctica y en qué se diferencia de otros
3. Beneficios y límites (realistas)
4. Cómo practicar: secuencia o protocolo detallado (duraciones en minutos)
5. Errores frecuentes de principiantes
6. Para quién conviene / contraindicaciones
7. Cómo integrarlo en una rutina semanal
8. FAQ
9. Cierre

[A — Ayurveda]
1. Introducción
2. Qué es (tradición ayurvédica, no pseudociencia)
3. Para qué se usa / beneficios atribuidos (con prudencia)
4. Cómo se aplica (aceite, masaje, duración, temperatura) o tratamiento paso a paso
5. Elección según dosha o temporada si aplica
6. Precauciones y cuándo consultar profesional
7. Diferencia entre hacerlo en casa y en centro
8. FAQ
9. Cierre

LONGITUD MÍNIMA:
- content_es: 1.200–1.800 palabras (si queda corto, amplía variaciones, FAQ y contexto)
- content_en: 900–1.200 palabras
- read_time_min: calculado real (~200 palabras/min)

JSON exacto:
{
  "title_es": "...",
  "title_en": "...",
  "slug": "slug-url-unico-es",
  "excerpt_es": "2–3 frases con gancho y utilidad concreta",
  "excerpt_en": "...",
  "content_es": "markdown completo ES",
  "content_en": "markdown completo EN",
  "read_time_min": número,
  "meta_title_es": "50–60 caracteres",
  "meta_title_en": "50–60 caracteres",
  "meta_description_es": "150–160 caracteres",
  "meta_description_en": "150–160 caracteres"
}
```

---

## Checklist antes de publicar

- [ ] ≥ 1.200 palabras en ES (contar con script o revisión manual)
- [ ] Al menos 6 secciones `###` con contenido desarrollado
- [ ] Precauciones o «para quién no conviene» presentes
- [ ] FAQ o variaciones incluidas
- [ ] Sin landings geo de retiros
- [ ] Retiru mencionado ≤ 1 vez
- [ ] EN completo, no resumen de 300 palabras

---

## Scripts que usan este prompt

- `scripts/lib/blog-writer.mjs` — generación compartida (SerpAPI multi-query + OpenAI Responses API, `gpt-5.5`)
- `scripts/publish-blog-queue.mjs` — cola de 100 títulos
- `scripts/generate-blog-articles.mjs` — generación manual por lote

Variables `.env.local`:

```
OPENAI_API_KEY=...
SERPAPI_API_KEY=...
BLOG_OPENAI_MODEL=gpt-5.5
```

Análisis de calidad: `node scripts/analyze-blog-quality.mjs`
