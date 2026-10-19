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
├─ vite.config.js          # build con varias entradas
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

Definidas en `vite.config.js` (`build.rollupOptions.input`):

- `popup` → `index.html`
- `library` → `library.html`
- `background` → `src/js/background.js`
- `contentScript` → `src/js/contentScript.js`

`background.js` y `contentScript.js` se emiten en la raíz de `dist/` (nombres sin hash,
necesarios para el manifiesto); el resto se emite en `dist/assets/`.

## Puntos de entrada de la UI

- `src/mainPopup.jsx`: `createRoot(...).render(<StrictMode><DbProvider><Popup/></DbProvider></StrictMode>)`
  e importa `src/css/general.css`.
- `src/mainLibrary.jsx`: igual pero con `<Library/>`.

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
| `db/useDexie.js` | Hook con toda la lógica de datos: `addManhwaWithSite`, `getManhwas`, `searchByName`, `getFavoriteManhwas`, `updateMahwa`, `updateFavorite`, `updateSite`, `deleteManhwa`, `importDatabase`, `exportDataBase`. |

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

El build inlinea las utilidades dentro de cada bundle de extensión: `dist/contentScript.js`
y `dist/background.js` no importan módulos en tiempo de ejecución (contenido aplanado).
`contentScript.js` importa `js/utils/utils.js`, que queda incluido en el bundle final.

## PENDIENTE DE CONFIRMAR

- No se ha verificado en un navegador real el flujo completo (requiere cargar la extensión).
- No hay información sobre otros navegadores objetivo distintos de Firefox.
