# Encuesta de interés de productos — Tienda Retiru

Validación de demanda antes de stock: los visitantes puntúan categorías (1–5) y pueden dejar un comentario; el equipo ve agregados en el panel de administración.

## Dónde está en la app

| Quién | Ruta | Código |
|--------|------|--------|
| Público ES | `/es/tienda` | `src/app/(public)/es/tienda/page.tsx` + `src/components/shop/ProductInterestSurvey.tsx` |
| Público EN | `/en/shop` | `src/app/(public)/en/shop/page.tsx` (mismo componente) |
| API | `POST /api/shop/product-interest` | `src/app/api/shop/product-interest/route.ts` — guarda cada valoración al instante (service role + categorías permitidas en `src/lib/shop/survey-config.ts`) |
| Admin | `/administrator/tienda` | `src/app/administrator/tienda/page.tsx`, `SurveyResultsClient.tsx` |

La encuesta solo se muestra cuando **no** hay filas en `shop_products` con `is_available = true` (misma condición que el mensaje «Próximamente disponible»).

### Comportamiento (público)

- Cada clic en **1–5** en una categoría envía **de inmediato** esa fila (no hay botón global «Enviar»). Puede responder solo las categorías que quiera.
- Visitantes anónimos: `session_id` estable en `sessionStorage` (`retiru_shop_survey_sid`); las valoraciones se recuerdan en `localStorage` (`retiru_shop_survey_levels`) para rellenar la UI al volver.
- **Comentario opcional:** botón «Guardar comentario»; la API exige **al menos una** categoría ya valorada y replica el texto en todas las filas de ese usuario o sesión.

## Base de datos

| Objeto | Descripción |
|--------|-------------|
| `public.shop_product_interests` | Una fila por categoría votada; `user_id` si hay sesión, si no `session_id` generado en cliente |
| `public.get_shop_interest_stats()` | Agregados por categoría (conteos por nivel, media) — usa el **service role** en la página admin |
| Migración **030** | Crea tabla, índices, RLS, políticas y la función |
| Migración **032** | **Importante:** la 030 definió un `UNIQUE` sobre `(user_id, product_category)` con *nulls not distinct*, lo que impide que **dos visitantes anónimos** voten la misma categoría. La **032** elimina esos `UNIQUE` y crea índices únicos **parciales** (`user_id` + categoría cuando hay usuario; `session_id` + categoría cuando hay sesión anónima). Ejecuta la 032 en el mismo proyecto donde aplicaste la 030 |

### RLS (resumen)

- **INSERT:** abierto a `anon` y `authenticated` (cualquiera puede enviar la encuesta).
- **SELECT:** usuarios autentificados solo sobre sus filas (`user_id = auth.uid()`); la política que compara `session_id` con un header personalizado **no la envía el cliente actual** — en la práctica el anónimo no relee filas por API; el admin usa **service role** y ve todo.
- **Admin:** política que comprueba rol `admin` en `user_roles` (misma tabla que el resto del panel).

## Comprobar que la BD está bien

Con `.env.local` configurado (URL, anon key y **service role**):

```bash
npm run verify-shop-survey-db
```

Comprueba: tabla accesible, RPC `get_shop_interest_stats`, dos inserts anónimos con `session_id` distinto y la **misma** `product_category` (debe pasar **solo** si la migración **032** está aplicada). Limpia filas de prueba al final.

## Panel admin — qué muestra

- Totales (respuestas, categorías con datos, comentarios con texto).
- Top 5 y bottom 5 por media; tabla con distribución por nivel 1–5.
- Comentarios recientes (acordeón).
- **Exportar CSV** (cliente) con agregados y comentarios.

## Categorías (IDs en BD)

Los `product_category` son slugs fijos en el componente: `esterillas-yoga`, `cojines-meditacion`, `bloques-yoga`, `ropa-deportiva`, `termos-botellas`, `incienso-velas`, `aceites-esenciales`, `libros-mindfulness`, `mantas-bolsters`, `joyeria-espiritual`.

## Reglas de producto / privacidad

En comentarios públicos de la encuesta **no** fomentar datos de contacto directos del usuario hacia fuera de Retiru; el equipo prioriza sugerencias de producto y marcas.

---

**Última actualización:** abril 2026
