# Tipos de centros — Agrupación y categorización

Documentación de la lógica de agrupación de los ~858 centros del directorio.

---

## Categorías objetivo

| Slug BD    | Etiqueta UI   |
|------------|---------------|
| yoga       | Yoga          |
| pilates    | Pilates       |
| meditation | Meditación    |
| ayurveda   | Ayurveda      |
| spa        | Spa           |
| multidisciplinary | Multidisciplinar |

Wellness no se usa como categoría principal (es genérico). Se mantienen tipos compuestos: `yoga_meditation`, `wellness_spa`.

---

## Campos utilizados para la agrupación

Fuentes de verdad (en orden de prioridad):

- **search_terms** (Búsqueda del CSV) — Cómo encontramos el centro ("centro pilates" → pilates)
- **directorio.csv** — Categoría original por nombre+provincia
- **google_types** (Tipos Google) — Lo que devuelve la API de Google (spa, yoga_studio)
- **name** — Nombre del centro
- **services_es** + **description_es** — Último recurso, solo keywords específicos (NO wellness)

---

## Lógica de inferencia (categoría principal)

1. **search_terms (Búsqueda)** — Si contiene "pilates", "yoga", "ayurveda", "spa", "meditación" → tipo correspondiente.

2. **CSV Categoría** — Si hay match nombre+provincia en directorio.csv, usar su Categoría.

3. **google_types** — Si contiene "spa" → spa; "yoga_studio" → yoga.

4. **Nombre** — Si contiene ayurveda, pilates, yoga, spa.

5. **Puntuación por keywords** (description + services_es) — Solo términos específicos (NO wellness/bienestar):
   - **ayurveda**: ayurveda, ayurvédico, abhyanga, shirodhara, udvartana, kansu
   - **pilates**: pilates, reformer, mat pilates
   - **yoga**: yoga, ashtanga, vinyasa, hatha, kundalini, yin, acroyoga
   - **meditation**: meditación, mindfulness, gong, cuencos tibetanos, sound bath, reiki
   - **spa**: spa, baños árabes, termal, hidro, sauna, jacuzzi, circuito termal

6. **Fallback** — type actual mapeado, o multidisciplinary.

---

## Servicios 1, 2 y 3

- **Solo datos reales**: se usan `services_es` (filtrando Wellness/Bienestar).
- No se inventan servicios desde la descripción.
- Se añade la categoría principal como primer servicio si no está ya.

---

## Scripts de clasificación

### 1. group-centers-by-type (reglas + directorio + Google)

```bash
npm run centers:group-types        # Reporte CSV (centros-agrupacion-propuesta.csv)
npm run centers:group-types:update  # Aplicar a BD
```

Usa: directorio.csv, search_terms, google_types, nombre, services_es, descripción.

### 2. infer-center-types-with-ai (OpenAI)

La IA recibe tipo actual, servicios (Google), descripción (que ella misma escribió), nombre, search_terms. Con todo eso determina la categoría correcta. Útil para afinar: ej. gimnasio de alto rendimiento que ofrece pilates → multidisciplinary, no pilates.

```bash
npm run centers:infer-types-ai           # Reporte CSV (centros-tipos-ia-propuesta.csv)
npm run centers:infer-types-ai -- --limit 20   # Probar con 20 centros
npm run centers:infer-types-ai:update    # Aplicar a BD (tras revisar)
```

Requiere `OPENAI_API_KEY` en .env.local.

---

## Migración

La migración `009_center_types_ayurveda_pilates.sql` añade los valores `pilates` y `ayurveda` al enum `center_type`. Ejecutar en Supabase antes de usar `--update`.
