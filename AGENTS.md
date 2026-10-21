# AGENTS.md

Instrucciones permanentes para trabajar en este repositorio. Este documento describe el
estado **actual** del proyecto tal como está implementado. Si algo no se puede verificar en el código, se marca como
**PENDIENTE DE CONFIRMAR**.

## Qué es este proyecto

Extensión de **Firefox** (Manifest V2) que sirve como tracker de lectura de
manhwas/mangas. Al abrir el popup en una página de lectura, deriva información desde la
URL de la pestaña, la completa con metadatos de la API de AniList y permite guardarla en
una base local (IndexedDB vía Dexie). La biblioteca permite listar, buscar, ordenar,
filtrar, editar, borrar e importar/exportar esos registros.

> Alcance confirmado: el proyecto se plantea como extensión de **Firefox** y contempla
> explícitamente el uso en **Firefox móvil** (ver la comprobación de `Fennec|Android.*Firefox`
> en `src/components/Popup.jsx`). Preservar ese enfoque en los cambios.

## Reglas permanentes para cambios

1. **No reescribir funcionalidad existente de forma innecesaria.** Se desarrolla sobre la
   implementación actual. Los cambios deben ser incrementales y de alcance mínimo. Antes
   de reemplazar un módulo, preferir extenderlo o envolverlo.
2. **Preservar la compatibilidad con Firefox.** El manifiesto es **MV2**
   (`public/manifest.json`) y usa APIs de MV2 como `chrome.tabs.executeScript`. No
   introducir APIs incompatibles con el Firefox objetivo sin justificarlo y planificarlo.
3. **Enfoque en Firefox (incluido móvil).** Mantener los patrones existentes de detección
   de móvil y de apertura/cierre de vistas (p. ej. `window.close()` en Firefox móvil).
4. **Validar los cambios.** Ejecutar las comprobaciones disponibles antes de dar un cambio
   por terminado (ver "Comandos reales"). El lint pasa con 4 warnings (ver `docs/testing.md`).
5. **Revisar efectos secundarios.** Considerar el impacto en: popup, biblioteca, background,
   content script, esquema de datos Dexie y formato de import/export. Hay una única base
   `ManhwaDB` compartida por popup y biblioteca.
6. **No cambiar la lógica ni corregir bugs al documentar.** La documentación debe describir
   el comportamiento real, incluidos los defectos conocidos, sin "arreglarlos" por la vía
   de los hechos.
7. **Datos no verificables** = marcar como **PENDIENTE DE CONFIRMAR**. No inventar sitios
   soportados, selectores, comandos ni pruebas.
8. Consultar la documentación oficial de Mozilla cuando modifique APIs de extensiones y verificar la compatibilidad con la versión de Firefox objetivo.

## Comandos reales

Definidos en `package.json` (no hay otros):

| Comando | Descripción |
| --- | --- |
| `npm install` | Instala dependencias. |
| `npm run dev` | Servidor de desarrollo Vite. |
| `npm run build` | Build de producción en `dist/`. |
| `npm run lint` | `eslint .` — 0 errores / 3 warnings (ver `docs/testing.md`). |
| `npm run preview` | Vista previa del build de Vite. |
| `npm test` | Tests unitarios con Vitest (lógica pura: settings, utils). |

- **Existe** script de tests unitarios (`npm test` con Vitest, 28 tests pasando).
- No hay type-check (no hay `tsconfig.json`) ni CI.
- Entorno verificado en este repo: Node `v24.21.0`, npm `11.19.0` (puede variar).
- El build de la extensión se carga desde `dist/` (que copia `public/manifest.json` e
  iconos y compila las entradas).

## Mapa de arquitectura (resumen)

Detalle completo en [`docs/architecture.md`](docs/architecture.md).

- **Entradas del build** (`vite.config.js`): `index.html` (popup), `library.html`
  (biblioteca), `src/js/background.js`, `src/js/contentScript.js`.
- **`src/mainPopup.jsx`** → renderiza `components/Popup.jsx` dentro de `DbProvider`.
- **`src/mainLibrary.jsx`** → renderiza `components/Library.jsx` dentro de `DbProvider`.
- **`src/db/DbContext.jsx`** → instancia Dexie `ManhwaDB` y la expone por contexto.
- **`src/db/useDexie.js`** → capa única de acceso a datos (CRUD, búsqueda, import/export).
- **`src/js/background.js`** → proxy hacia la API GraphQL de AniList.
- **`src/js/contentScript.js`** → extracción de datos de la pestaña activa (por URL).
- **`src/js/utils/`** → utilidades (`utils.js`, `enums.js`, `toastify.js`, `confirmModal.js`).
- **`src/components/`** → UI (Popup, Library, ComicsContainer, ManhwaCard, EditModal,
  ConfirmModal, SidebarMenu).
- **`src/css/`** → CSS Modules por componente + `general.css` (reset).

## Convenciones actuales

- **UI:** React 19 con JSX y **CSS Modules** (`*.module.css`) importados como `styles`.
- **Datos:** todo acceso a Dexie pasa por `useDexie()`; no usar Dexie directamente en
  componentes.
- **Estado global de datos:** `DbProvider` envuelve ambas apps.
- **Notificaciones:** usar `addToastMessage` (`src/js/utils/toastify.js`) y `confirmModal`
  (`src/js/utils/confirmModal.js`).
- **APIs de extensión:** patrón `browser.runtime || chrome.runtime`. Nota: `Popup.jsx`
  también usa `chrome.*` directamente.
- **Nombres de estado:** usar el enum `ManhwaStatus` (`src/js/utils/enums.js`).

## Defectos y hechos conocidos (estado actual)

- `src/db/useDexie.js`: `searchByName` carga toda la tabla en memoria (filtrado en cliente).
- El lint pasa con **3 warnings** (no errores): `react-refresh/only-export-components`
  (ConfirmModal, DbContext). Ver `docs/testing.md`.
- `src/components/Popup.jsx` usa `alert("Error saving")` para errores de guardado (el resto
  usa `react-toastify`).

## PENDIENTE DE CONFIRMAR

- No hay información verificable sobre **sitios soportados** explícitos: el código no
  define una lista ni selectores (ver `docs/scraping.md`).
- No se ha verificado el comportamiento en el navegador (carga de la extensión, ejecución
  real de popup/biblioteca/AniList). Solo se ha analizado el código y ejecutado el lint.
