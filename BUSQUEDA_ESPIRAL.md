# Búsqueda en espiral (directorio Retiru)

Cubre España con centros de yoga, meditación y ayurveda. El criterio es el de **MapafurgoCasa**: radio **20–25 km** a un estudio, no «¿cuántos hay en la provincia?». Esta guía vive en la **W**, no en Git.

El mapa: [retiru.com/es/centros-retiru](https://www.retiru.com/es/centros-retiru). UI: [`DIRECTORIO-MAPA.md`](DIRECTORIO-MAPA.md). Cifras vivas también en `RAID-CUENTAS-Y-STACK.md` ficha Retiru.

Corte: **28 ago 2026**. España **1654** activos (`vxrdawltytmkxsmhyiah`).

## Criterio

| Sí | No |
|---|---|
| Estudio / shala / escuela de yoga | Gym, crossfit, pádel, spinning |
| Centro de meditación, mindfulness, Kadampa, **Dojo Zen** | Fisioterapia, quiromasaje, osteopatía como negocio principal |
| Ayurveda (consulta, masaje en un centro ayurvédico, formación) | Estética, spa, kobido, yoga facial, herbolario, tienda |
| Ficha en el **pueblo** (ciudad = municipio) | Clínica / consulta psicológica con mindfulness de adorno |
| País **España** | Online-only, pilates-only, dojo marcial, matrona, registros akáshicos |

Un pueblo **sin ficha en Google** (solo gym/pilates) no se inventa. Eso es hueco real, no fallo del script.

## Cómo se barre

Origen: **Murcia** (donde está el taller). Se abre un anillo de provincias limítrofes, se cubre, y se pasa al siguiente. Narciso puede saltar (Málaga, top 3 de población) sin romper la espiral.

Script: `webretiru/scripts/import-places-province.mjs`

```
node scripts/import-places-province.mjs --province Madrid --execute
```

- Text Search Places: `yoga` / `meditación` / `ayurveda` × cada municipio de la lista.
- Dedupe por `google_place_id`. `search_terms`: `import-places-{provincia}-2026-08`. Status `active`.
- Nearby `yoga_studio` **no**: el field mask daba 400; el text search basta.
- Alias sin tilde (PowerShell las come): `Jaen` → Jaén, `Almeria` → Almería, `Malaga` → Málaga. Los mismos alias están en `assign-center-images.mjs` y `generate-all-descriptions.mjs`.
- Tras el insert: SQL `inactive` de la basura que se cuela (el filtro del script no lo pilla todo). **Dojo Zen se queda.**
- **No** volver a correr `remap-center-geo.mjs --execute` sobre toda España: pasó pueblos a barrios/capital. Se revirtió a mano.

El dato entra en Supabase al momento. El mapa lo ve **sin push**.

## Anillos hechos (28 ago)

### 0 — Murcia (centro)

| | |
|---|---|
| Activos | **130** (118 yoga · 9 medit · 3 ayur) |
| En el pueblo | Cartagena, Lorca, Alhama, Totana, Cieza, Jumilla, Águilas, Yecla |
| Google no tiene estudio | Caravaca, Cehegín, Calasparra, Moratalla, Fortuna, Archena, Puerto Lumbreras, Fuente Álamo, La Unión |
| Radio 25 km | Solo **Moratalla** al filo (25,3 km a Bullas) |

Limpieza extra: Casa del Colorín (guardería), Constanza Olivares (quiromasaje), «Best Space Es7H4», «Estudio de yoga» Alguazas.

### 1 — Limítrofes de Murcia

| Provincia | Activos | Notas |
|---|---|---|
| **Alicante** | **197** | Vega Baja ya no está vacía: Torrevieja, Orihuela, Callosa, Guardamar, Pilar, Almoradí, Rojales, San Miguel |
| **Almería** | **42** | Huércal-Overa, Vera, Roquetas, El Ejido |
| **Albacete** | **23** | Hellín, Almansa, Caudete, Yeste, Villarrobledo |

Apagados ~18 (estética, fisio, spa, herbolario, matrona, dojo marcial). España tras este anillo: **840**.

### 2 — Siguiente corona

| Provincia | Activos | En el pueblo (ejemplos) |
|---|---|---|
| **Valencia** | **162** | Gandia, Requena, Xàtiva |
| **Granada** | **77** | Motril, Baza, Huéscar |
| **Jaén** | **20** | Linares, Cazorla |
| **Ciudad Real** | **32** | Tomelloso, Valdepeñas |
| **Cuenca** | **11** | Buendía; **Tarancón** sin estudio en Google |

Jaén falló al primer intento por la tilde (`Jaen` alias). España tras este anillo: **1099**.

### Salto — Málaga (costa, no es anillo 3)

**158** (+131; −3 clínica/consulta). Marbella, Mijas, Fuengirola, Estepona, Nerja, Vélez-Málaga, Ronda, Antequera. España iba **1227**.

### Salto — Top 3 población de España

| Provincia | Antes | Ahora | Places nuevos (neto) |
|---|---|---|---|
| **Madrid** | 66 | **265** | +212, −13 basura |
| **Barcelona** | 55 | **283** | +238, −10 |
| **Valencia** | 162 | **162** | ya barrida en el anillo 2 |

Dojo Zen Sant Cugat se queda. España **1654**.

## Huecos reales (>25 km, Google no tiene estudio)

No se rellenan a mano. Si Places no saca yoga / meditación / ayurveda, no hay ficha.

| Zona | Distancia al más cercano | Nota |
|---|---|---|
| **Vélez-Rubio / Vélez-Blanco** | ~30–34 km a Albox | Barrido; solo gym/pilates |
| **Tarancón** | ~46 km a Buendía | En la lista de Cuenca; Google no sacó estudio |
| NW Murcia: Caravaca, Calasparra, Moratalla | filo 25 km | Places solo gym/pilates |
| **Segovia** | — | **0** activos. Aún no se ha barrido |

## Provincias en el script

Ya tienen lista de municipios en `import-places-province.mjs`:

Alicante · Almería · Albacete · Valencia · Granada · Málaga · Jaén · Ciudad Real · Cuenca · Madrid · Barcelona.

Murcia se barrió antes (script propio / mismo molde). **No** están aún: Segovia, Castellón, Córdoba, Toledo, Guadalajara, Sevilla, Cádiz, y el resto.

## Fotos y descripciones (después del Places)

1. Portada: web oficial del centro (`assign-center-images.mjs`). Instagram / Facebook / Canva / linktr.ee no cuentan. Si no hay, `gpt-image-2` (`ai-cover-*`). Overlay «imagen generada por IA» en ficha/mapa.
2. Texto: Responses API `gpt-5.6-terra` + `tools: [{ type: "web_search" }]`. EN: `gpt-4o-mini`. Criterio: `description_es` ≥ 400 chars.
3. Cursor mata jobs largos → lotes **fuera del chat** (`Start-Process`, logs en `%TEMP%`). TLS Windows: `NODE_TLS_REJECT_UNAUTHORIZED=0` **antes** del `Start-Process`.
4. Un lote a la vez (OpenAI). Si ya corre Alicante/Granada, el siguiente espera.

```
node scripts/assign-center-images.mjs --province Madrid --no-ia
node scripts/assign-center-images.mjs --province Madrid
node scripts/generate-all-descriptions.mjs --province Madrid
```

Corte 28 ago (huecos; los lotes en local siguen):

| Provincia | Sin foto | Desc. corta |
|---|---|---|
| Barcelona | 231 | 228 |
| Madrid | 202 | 199 |
| Valencia | 147 | 144 |
| Málaga | 130 | 128 |
| Alicante | 63 | 84 |
| Granada | 24 | 64 |
| Murcia | 1 | 0 |

Málaga: el primer lote de fotos/desc no cogió nada (PowerShell → `Málaga` roto). Reintento con `--province Malaga`.

## Siguiente espiral (si Narciso la pide)

Desde Murcia, el anillo 3 geográfico sería **Castellón, Córdoba, Toledo, Guadalajara** (y Sevilla/Cádiz si se salta otra vez a costa). **Segovia** sigue a 0: no está en la espiral; hay que añadirla al script y barrerla.

No remap global. No SQL para Narciso: MCP `supabase-eskaladigital` o `.env.local` de `webretiru`. Push: **Eskaladigital** / `retiru` (este trabajo de datos no pide push).

## Trampas

- Radio 25 km, no recuento provincial. Un Murcia a 130 no tapa Caravaca.
- `export function` síncrono en `"use server"` tumba Next 16 (otro repo; no mezclar con esto).
- `redirect` en `generateMetadata` = 500. No toca este barrido.
- Nearby Places 400 por field mask: no insistir.
- No mezclar **Furgocasa** (web), **MapafurgoCasa** (mapa) y **casi cinco**. El molde de cobertura es MapafurgoCasa.
