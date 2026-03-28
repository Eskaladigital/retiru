# Tipos de centros (directorio)

**Fase actual:** solo tres valores en BD y en la web: `yoga`, `meditation`, `ayurveda`.

| Slug BD     | Etiqueta ES   | Etiqueta EN  |
|-------------|---------------|--------------|
| yoga        | Yoga          | Yoga         |
| meditation  | Meditación    | Meditation   |
| ayurveda    | Ayurveda      | Ayurveda     |

La columna `categories` (`text[]`) en `centers` sigue siendo libre para etiquetas auxiliares; no sustituye al `type`.

---

## Reclasificación con IA (OpenAI)

Antes de **reducir el enum** en Postgres, ejecutar el script para que cada centro quede en uno de los tres tipos (mientras el enum antiguo siga existiendo, los valores `yoga`, `meditation` y `ayurveda` ya son válidos):

```bash
npm run centers:reclassify-three              # CSV centros-tres-tipos-ia.csv
npm run centers:reclassify-three -- --limit 20
npm run centers:reclassify-three:update       # Escribir en Supabase
```

Requiere `OPENAI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` en `.env.local`.

Opcional: `--active-only` para procesar solo `status = active`.

Luego aplicar en Supabase la migración **`014_center_type_three_disciplines.sql`**.

---

## Agrupación por reglas (sin IA)

```bash
npm run centers:group-types
npm run centers:group-types:update
```

Usa `directorio.csv`, `search_terms`, `google_types`, nombre, servicios y descripción. Los tipos de salida son solo los tres anteriores.

---

## Scripts legacy

`npm run centers:infer-types-ai` clasificaba en 9 tipos antiguos; ya no encaja con el enum reducido. Usar `centers:reclassify-three`.

---

## Migraciones relacionadas

- `009_center_types_ayurveda_pilates.sql` — histórico (amplió el enum en instalaciones antiguas).
- `014_center_type_three_disciplines.sql` — enum final de tres valores.
