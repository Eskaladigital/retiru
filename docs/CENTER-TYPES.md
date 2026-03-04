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

## Uso del script

```bash
# Generar reporte y revisar propuesta (sin modificar BD)
npm run centers:group-types

# Aplicar cambios a la BD (requiere migración 009 ejecutada)
npm run centers:group-types:update
```

El reporte se guarda en `centros-agrupacion-propuesta.csv` con columnas:

- Nombre, Slug, Tipo_actual, Tipo_propuesto, Servicio_1, Servicio_2, Servicio_3

---

## Migración

La migración `009_center_types_ayurveda_pilates.sql` añade los valores `pilates` y `ayurveda` al enum `center_type`. Ejecutar en Supabase antes de usar `--update`.
