# Arquitectura

Documento descriptivo de la arquitectura **actual**. Basado en el código del repositorio.
Todo lo no verificable se marca como **PENDIENTE DE CONFIRMAR**.

## Visión general

Extensión de Firefox (Manifest V2) construida con React 19 y empaquetada con Vite.
Tiene dos interfaces, un background script y un content script inyectado, y persiste en
IndexedDB mediante Dexie.

- **Popup** (`index.html`): se abre desde el botón de la extensión sobre la pestaña activa.
- **Biblioteca** (`library.html`): se abre en una pestaña nueva.
- **Background** (`src/js/background.js`): proxy hacia AniList.
- **Content script** (`src/js/contentScript.js`): extrae datos de la página activa.

Ambas interfaces comparten la misma base de datos `ManhwaDB`.

## Estructura de directorios

```
manhwa-tracker-ext/
├─ index.html              # popup (browser_action.default_popup)
├─ library.html            # biblioteca (abierta en pestaña)
├─ vite.config.js          # build principal (popup, biblioteca, background)
├─ vite.content.config.js  # build del content script (archivo único, IIFE)
├─ eslint.config.js        # flat config de ESLint
├─ public/
│  ├─ manifest.json        # Manifest V2 (se copia a dist/)
│  └─ icons/               # icon16.png, icon48.png, icon128.png
├─ src/
│  ├─ mainPopup.jsx        # entry React del popup
│  ├─ mainLibrary.jsx      # entry React de la biblioteca
│  ├─ components/          # componentes React
│  ├─ db/                  # capa Dexie
│  ├─ js/                  # background, content script y utilidades
│  └─ css/                 # CSS Modules + reset
└─ dist/                   # salida de build (gitignored)
```

## Entradas del build

Hay **dos builds** encadenados por `npm run build`:

- **Build principal** (`vite.config.js`, `build.rollupOptions.input`):
  - `popup` → `index.html`
  - `library` → `library.html`
  - `background` → `src/js/background.js`
- **Build del content script** (`vite.content.config.js`):
  - `contentScript` → `src/js/contentScript.js`

`background.js` y `contentScript.js` se emiten en la raíz de `dist/` (nombres sin hash,
necesarios para el manifiesto); el resto se emite en `dist/assets/`.

El build principal incluye el plugin `inline-entry-css` (`vite.config.js`), que
reemplaza los `<link rel="stylesheet">` de cada HTML por su contenido en un `<style>`
dentro del `<head>`. De este modo el CSS queda disponible antes de que el `<script
type="module">` monte React, evitando el aviso de Gecko "Layout was forced before the
page was fully loaded" y el destello de contenido sin estilo en el popup. Los `.css`
de `dist/assets/` siguen emitiéndose pero ya no se referencian.

## Puntos de entrada de la UI

- `src/mainPopup.jsx` / `src/mainLibrary.jsx`: montan React en `DOMContentLoaded` (o
  `requestAnimationFrame` si ya está listo), dentro de `flushSync`. Con CSS inlineado
  se evitan las lecturas de layout durante la carga inicial; el placeholder
  `<div class="boot">Loading…</div>` mantiene el panel visible. Esto evita que el
  popup se quede en blanco en Firefox.
- `index.html` y `library.html` incluyen un CSS crítico mínimo y un placeholder
  `<div class="boot">Loading…</div>` dentro de `#root`, que React reemplaza al montar.
  Así el popup nunca se muestra vacío mientras se cargan los estilos/JS.

## Responsabilidad por módulo

### Interfaz

| Módulo | Responsabilidad |
| --- | --- |
| `components/Popup.jsx` | Al montar: consulta la pestaña activa, inyecta el content script, pide la extracción y muestra un formulario editable. Guarda con `addManhwaWithSite`. Botón "Go to library". |
| `components/Library.jsx` | Lista paginada, búsqueda por nombre, orden por estado, filtro de favoritos, y orquesta editar/borrar. |
| `components/ComicsContainer.jsx` | Renderiza la cuadrícula de tarjetas y la paginación (`react-paginate`). Muestra "Data not Found" si no hay datos. |
| `components/ManhwaCard.jsx` | Tarjeta de un manhwa: enlaces, imagen, sitio, capítulos, progreso, géneros, nota, y acciones favorito/editar/borrar. |
| `components/EditModal.jsx` | Modal con dos formularios: editar manhwa y editar site. Confirma con `confirmModal`. |
| `components/ConfirmModal.jsx` | Componente de confirmación usado por `react-confirm` (sí/no). |
| `components/SidebarMenu.jsx` | Menú lateral con Import y Export (JSON). |

### Datos

| Módulo | Responsabilidad |
| --- | --- |
| `db/DbContext.jsx` | Crea `new Dexie("ManhwaDB")`, define `version(1)` con las tablas `site` y `manhwa`, y expone la instancia por React Context (`DbProvider`/`useDb`). |
| `db/useDexie.js` | Hook con toda la lógica de datos: `addManhwaWithSite`, `getManhwas`, `searchByName`, `getFavoriteManhwas`, `getStaleManhwas`, `getLibraryStats`, `updateMahwa`, `updateFavorite`, `updateSite`, `deleteManhwa`, `importDatabase`, `exportDataBase`. |
| `js/utils/settings.js` | Umbrales del filtro "Unread for" (tramos por días), persistencia en `localStorage`, migración desde la clave antigua, y helper `getStaleWindow` para traducir la opción a su ventana `[minDays, maxDays)`. |

Ver el modelo de datos en [`data-model.md`](data-model.md).

### Extensión / extracción

| Módulo | Responsabilidad |
| --- | --- |
| `js/background.js` | Escucha `{action:"fetchComicData"}` y consulta la API GraphQL de AniList. Devuelve `chapters`, `genres`, `coverImage.large`, `status`. |
| `js/contentScript.js` | Escucha `{action:"extractInfo"}`. Construye `site` y `manhwa` desde la URL y delega los metadatos a background. Se protege contra doble inyección con `window.__MY_CONTENT_SCRIPT_INJECTED__`. |
| `js/utils/utils.js` | `cleanTitle`, `extractChapterFromUrl`, `getDomainName`. |
| `js/utils/enums.js` | `ManhwaStatus` (enum congelado). |
| `js/utils/toastify.js` | `addToastMessage(type, msg, ...)`. |
| `js/utils/confirmModal.js` | Envuelve `react-confirm` y `ConfirmModal`. |

Ver estrategia de extracción en [`scraping.md`](scraping.md).

## Flujo de datos (popup → guardado)

1. `Popup.jsx` (`useEffect`) ejecuta `chrome.tabs.query({active:true, currentWindow:true})`.
2. `chrome.tabs.executeScript(tabId, {file:"contentScript.js"})` inyecta el content script.
3. `chrome.tabs.sendMessage(tabId, {action:"extractInfo"})`.
4. El content script arma `site` y `manhwa` desde la URL (ver `scraping.md`).
5. El content script envía `{action:"fetchComicData", title}` al background.
6. El background consulta AniList y responde `{success, data}`.
7. El content script completa `chapters/genre/imgUrl/status` y responde al popup con
   `{site, manhwa}`.
8. El popup muestra el formulario; al enviar, `addManhwaWithSite(site, manhwa, cb)`:
   - crea el `site` si no existe (por `baseUrl`),
   - si existe un manhwa con la misma clave `[title+idSite]`, pide confirmación y
     actualiza `lastReadChapter`, `lastTimeRead`, `currentChapterUrl`,
   - si no, inserta el manhwa.
9. Feedback con `react-toastify`.

> El popup también puede pedir metadatos manualmente con el botón de búsqueda
> (`fetchComicInfo` → `runtime.sendMessage({action:"fetchComicData"})`), lo que **duplica**
> la llamada que hace el content script.

## Flujo de datos (biblioteca)

`Library.jsx` decide la consulta según su estado:

- término de búsqueda activo → `searchByName`,
- filtro de favoritos → `getFavoriteManhwas`,
- por defecto → `getManhwas(page, limit, sortBy)`.

Obtiene `{manhwa, site}[]` y lo pasa a `ComicsContainer` → `ManhwaCard`.

Otras acciones: `updateMahwa`, `updateSite`, `updateFavorite`, `deleteManhwa`, y
import/export desde `SidebarMenu`.

## Comunicación entre contextos

- **Popup → content script:** `tabs.sendMessage` / `contentScript.onMessage`.
- **Content script → background:** `runtime.sendMessage("fetchComicData")`.
- **Popup → background:** `runtime.sendMessage("fetchComicData")` (búsqueda manual).
- **Popup → pestaña de biblioteca:** `tabs.create(runtime.getURL("library.html"))`.

Patrón de acceso a APIs: `browser.runtime || chrome.runtime`. `Popup.jsx` también usa
`chrome.*` de forma directa.

## Empaquetado de los scripts de extensión

El `contentScript.js` se inyecta con `tabs.executeScript`, que lo ejecuta como **script
clásico** (no como módulo ES). Por eso se compila en un **build separado**
(`vite.content.config.js`) con formato **IIFE** y una sola entrada: así Vite no genera
chunks compartidos y todas las dependencias (incluido `js/utils/utils.js`) quedan inline en
un único `dist/contentScript.js`, sin `import`/`export`. Por el mismo motivo `contentScript`
no participa del build principal: si compartiera build con la app, Vite lo partiría en
chunks (`assets/utils-*.js`) y conservaría un `import`.

`dist/background.js` tampoco importa módulos en tiempo de ejecución (contenido aplanado).

## PENDIENTE DE CONFIRMAR

- No se ha verificado en un navegador real el flujo completo (requiere cargar la extensión).
- No hay información sobre otros navegadores objetivo distintos de Firefox.
