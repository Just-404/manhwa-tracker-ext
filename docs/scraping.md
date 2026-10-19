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

## Metadatos desde AniList (`src/js/background.js`)

- Endpoint: `POST https://graphql.anilist.co`.
- Query GraphQL (`Media(search: "<titulo>", type: MANGA)`) que pide: `chapters`, `genres`,
  `coverImage { large }`, `status`.
- El título se **interpola directamente** en el string de la query (no usa variables GraphQL
  ni escapado). Ver notas abajo.
- Respuesta esperada: `{ success: true, data: <Media> }` o `{ success: false, error }`.

## Sitios soportados

**No hay una lista explícita de sitios.** No existen adaptadores, mapas de selectores ni
configuración por dominio. El funcionamiento es implícito: sirve para páginas cuya URL
encaje con las heurísticas anteriores (título en el `split("/")[2]` y capítulo detectable
por el regex). **PENDIENTE DE CONFIRMAR:** no hay forma de enumerar sitios soportados a
partir del código.

## Manejo de errores

- **Content script:** si AniList falla o no devuelve datos, hace `console.warn` y responde
  igualmente con `site`/`manhwa` (parcialmente vacíos).
- **Background:** `try/catch` con `.catch`; en error hace `console.error` y responde
  `{success:false}`.
- **Popup:** en la inyección/mensajería comprueba `chrome.runtime.lastError` y hace
  `console.log`; en el guardado usa `alert("Error saving")` y `console.log`.
- **Utilidades:** `extractChapterFromUrl` devuelve `null` cuando no hay coincidencia.

## Observaciones (hechos del código, sin corregir)

- La query de AniList se construye por **interpolación de string**; un título que contenga
  comillas puede romper o alterar la query.
- La extracción depende de la posición del título en el path y del regex de capítulo, por
  lo que en sitios con otras estructuras de URL el resultado puede ser incorrecto o `null`.
- La llamada a AniList está **duplicada** (content script y popup).

## PENDIENTE DE CONFIRMAR

- Comportamiento real de las heurísticas frente a sitios concretos (no verificado en navegador).
- Cualquier intención de soportar sitios específicos con selectores: no hay indicios en el código.
