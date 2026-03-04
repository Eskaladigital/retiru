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
| wellness   | Wellness      |
| spa        | Spa           |

Además se mantienen los tipos compuestos: `yoga_meditation`, `wellness_spa`, `multidisciplinary`.

---

## Campos utilizados para la agrupación

Para cada centro se analizan:

- **name** — Nombre del centro (peso extra si la palabra clave aparece aquí)
- **description_es** — Descripción generada por IA
- **services_es** — Array de servicios/disciplinas
- **categories** — Array de categorías
- **type** — Tipo actual en BD
- **search_terms** — Términos de búsqueda (Búsqueda del CSV)

---

## Lógica de inferencia (categoría principal)

1. **Puntuación por palabras clave**  
   Se buscan términos específicos en el texto combinado. Cada coincidencia suma puntos. Si la palabra está en el **nombre**, se añaden +5 puntos extra.

2. **Palabras clave por categoría**
   - **ayurveda**: ayurveda, ayurvédico, abhyanga, shirodhara, dosha, marma, udvartana, kansu
   - **pilates**: pilates, reformer, mat pilates
   - **yoga**: yoga, ashtanga, vinyasa, hatha, kundalini, yin, acroyoga
   - **meditation**: meditación, mindfulness, gong, cuencos tibetanos, sound bath, reiki
   - **spa**: spa, baños árabes, termal, hidro, sauna, jacuzzi, circuito termal
   - **wellness**: wellness, bienestar, fisioterapia, osteopatía, masaje, quiromasaje, reflexología

3. **Prioridad de decisión**  
   En caso de empate o solapamiento, se aplica este orden:  
   Ayurveda > Spa > Pilates > Yoga > Meditación > Wellness

4. **Fallback**  
   Si no hay coincidencias, se usa el `type` actual mapeado a las categorías objetivo.

---

## Servicios 1, 2 y 3

- Se toman primero de `services_es` si existen.
- Si faltan, se intentan extraer de `description_es` usando una lista de servicios conocidos.
- Se prioriza la categoría principal como primer servicio si no está ya en la lista.

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
