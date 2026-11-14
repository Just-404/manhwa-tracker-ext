# Extracción de datos ("scraping")

Este documento describe **cómo se obtiene la información hoy**. Basado en
`src/js/contentScript.js`, `src/js/utils/utils.js` y `src/js/background.js`.

> **Aclaración importante:** en la implementación actual **no hay scraping de DOM**.
> No existen selectores, ni adaptadores por sitio, ni lectura del HTML de la página.
> La extracción se basa en **la URL de la pestaña** más **metadatos de la API de AniList**.
> Cualquier afirmación sobre "sitios con selectores" sería inventada.

## Estrategia de extracción

Al recibir `{action:"extractInfo"}` en la pestaña activa, `contentScript.js` construye dos
objetos:

### `site` (a partir del host)

| Campo | Origen en el código |
| --- | --- |
| `name` | `getDomainName(window.location.hostname)` |
| `baseUrl` | `window.location.hostname` |
| `isActive` | `1` |
| `language` | `navigator.language` |
| `lastChecked` | `new Date().toISOString()` |
| `imgUrl` | Favicon de Google: `https://s2.googleusercontent.com/s2/favicons?domain_url=https://<host>` |

### `manhwa` (a partir de la URL y metadatos)

| Campo | Origen en el código |
| --- | --- |
| `title` | `decodeURIComponent(cleanTitle(window.location.pathname.split("/")[2]))` |
| `chapters` | `null` inicialmente; se sobrescribe con AniList |
| `currentChapterUrl` | `window.location.href` |
| `lastReadChapter` | `extractChapterFromUrl(window.location.href)` |
| `isFavorite` | `0` |
| `status` | `null` inicialmente; se sobrescribe con AniList |
| `lastTimeRead` | `new Date().toISOString()` |
| `imgUrl` | `null`; se sobrescribe con AniList |
| `genre` | `null`; se sobrescribe con AniList (`genres.join(", ")`) |
| `note` | `""` |

## Heurísticas de URL (`src/js/utils/utils.js`)

### `cleanTitle(title)`
1. Divide el string por `-`.
2. Si el **último** fragmento cumple `/^[a-z0-9]{6,}$/` (parece un hash/ID), lo elimina.
3. Une los fragmentos con espacios y aplica Title Case (`/\b\w/g`).
4. Recorta espacios.

> El título se toma del **tercer segmento** del path (`split("/")[2]`), es decir se asume
> un patrón tipo `/seccion/<titulo>/...`.

### `extractChapterFromUrl(url)`
- Pasa la URL a minúsculas y aplica el regex `/\/chapter[-/](\d+(\.\d+)?)/`.
- Devuelve `parseFloat` del número, o `null` si no hay coincidencia.
- Solo reconoce variantes `chapter-<n>` o `chapter/<n>`.

### `getDomainName(hostname)`
- Divide por `.`; si hay ≤ 2 partes devuelve la primera; si empieza por `www` la elimina;
  devuelve el penúltimo segmento (el dominio de segundo nivel).

## Metadatos desde AniList (`src/js/api/anilist.js`, orquestado por `src/js/background.js`)

- Endpoint: `POST https://graphql.anilist.co`.
- Query GraphQL **con variables** (`Media(search: $search, type: MANGA)`) que pide:
  `chapters`, `genres`, `coverImage { large }`, `status`.
- Módulos API (`src/js/api/`):
  - `anilist.js`: fuente primaria. Caché propia de 10 min. `parseJsonResponse`
    (`httpUtils.js`) valida `response.ok` y Content-Type antes de `.json()`, para no
    propagar errores crudos de `JSON.parse` cuando el servidor devuelve HTML.
  - `mangadex.js`: fallback si AniList falla. Busca en `api.mangadex.org`, elige el mejor
    candidato por similitud de título (`scoreCandidate`) y mapea a la misma forma de datos:
    `{ chapters, genres, coverImage: { large }, status }`.
  - `background.js`: orquesta ambas, con caché global de 10 min y un **circuit breaker**
    (`src/js/utils/circuitBreaker.js`): se abre tras **3 fallos consecutivos** de AniList y
    queda abierto **15 minutos** (después vuelve a intentar AniList). Si ambas fuentes
    fallan responde `{ success: false, error: "AniList: <motivo>; MangaDex: <motivo>" }`.
- Respuesta esperada: `{ success: true, data, source: "anilist" | "mangadex" }` o
  `{ success: false, error }`.

## Sitios soportados

Hay una **lista explícita de patrones** en `src/js/utils/sitePatterns.js`
(`SITE_PATTERNS`, matcheada por host con `matchSitePattern(hostname, pathname)`):

| Host(es) | Estructura de URL | Título | Capítulo |
| --- | --- | --- | --- |
| `comix.to` | `/title/<prefijo-aleatorio>-<slug>/<id>-chapter-<n>` | slug sin todo lo anterior al primer guion | n (acepta decimales) |
| `asurascans.com` | `/comics/<slug>-<id-hex>/chapter/<n>` | slug sin el sufijo hex `-fXXXXXX` | n (acepta decimales) |
| `roliascan.com` | `/read/<slug>/ch<n>-<id-numérico>` | slug | n (acepta decimales) |
| `toongod.org`, `manhwatop.com`, `dragontea.ink`, `kunmanga.com`, `manhuatop.org` | `/{categoria}/{slug}/chapter-<n>/` | slug (se conservan sufijos del sitio como `-series-manhwa`) | n (acepta decimales) |

- El sufijo hex de asurascans y el prefijo aleatorio de comix.to son **convenciones
  confirmadas por el maintainer** (no verificables desde el código).
- El contenido del slug registrado NO pasa por la heurística anti-hash de `cleanTitle`
  (se llama con `stripHashSuffix = false`) para no perder la última palabra legítima.

### Fallback genérico (sitios no registrados)

Para cualquier otro sitio sigue la lógica previa de `src/js/utils/utils.js`:
título en `pathname.split("/")[2]` (+ heurística anti-hash de `cleanTitle`) y capítulo
con `extractChapterFromUrl` (`/chapter-<n>` o `/chapter/<n>`, con decimales).
**PENDIENTE DE CONFIRMAR:** comportamiento frente a sitios no registrados no verificado
en navegador.

## Manejo de errores

- **Content script:** si AniList falla o no devuelve datos, hace `console.warn` y responde
  igualmente con `site`/`manhwa` (parcialmente vacíos).
- **Background:** `try/catch` con `.catch`; en error hace `console.error` y responde
  `{success:false}`.
- **Módulos API:** ante respuesta no-JSON (HTML, cuerpo vacío, HTTP 4xx/5xx) devuelven
  errores descriptivos (`HTTP 403`, `HTTP 429 (rate limited)`,
  `Non-JSON response (content-type: ...)`) en lugar de crashear en `.json()`.
- **Portadas:** el componente `CoverImage` (`src/components/CoverImage.jsx`) muestra un
  placeholder "Sin portada" cuando `imgUrl` es `null`, cuando el proxy de MangaDex falla
  o cuando el `<img>` dispara `onError` (evita tiles negros/rotos en biblioteca).
- **Popup:** en la inyección/mensajería comprueba `chrome.runtime.lastError` y hace
  `console.log`; en el guardado usa `alert("Error saving")` y `console.log`.
- **Utilidades:** `extractChapterFromUrl` devuelve `null` cuando no hay coincidencia.

## Observaciones (hechos del código, sin corregir)

- La extracción depende de la posición del título en el path y del regex de capítulo, por
  lo que en sitios con otras estructuras de URL el resultado puede ser incorrecto o `null`.
- La llamada a AniList está **duplicada** (content script y popup).
- MangaDex puede devolver `coverImage.large: null` (sin relación `cover_art`); ese registro
  se guarda con portada vacía y la biblioteca muestra el placeholder.

## PENDIENTE DE CONFIRMAR

- Comportamiento real de las heurísticas frente a sitios concretos (no verificado en navegador).
- Cualquier intención de soportar sitios específicos con selectores: no hay indicios en el código.
