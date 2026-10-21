# Modelo de datos

Describe el almacenamiento, el esquema y el tratamiento del progreso de lectura, según la
implementación actual (`src/db/DbContext.jsx` y `src/db/useDexie.js`).

## Almacenamiento

- Motor: **IndexedDB**, a través de **Dexie** (`dexie`).
- Base de datos: **`ManhwaDB`**, creada en `src/db/DbContext.jsx`.
- Versión de esquema Dexie: **`version(1)`**.
- Se expone a React mediante `DbProvider` / `useDb()`; el acceso se hace a través de
  `useDexie()`.
- Es una base **local** (del origen de la extensión). Popup y biblioteca comparten la misma
  base. **No hay sincronización remota** en el código.

## Esquema (`version(1)`)

### Tabla `site`
```
++idSite, name, baseUrl, isActive, language, lastChecked, imgUrl
```
- Clave primaria autoincremental: `idSite`.
- `baseUrl` se usa para evitar duplicar sitios (búsqueda por `.where("baseUrl").equals(...)`).
- `isActive`: `1` para sitios activos (valor inicial al crear).
- `lastChecked`, `imgUrl`, `language`, `name`: metadatos del sitio.

### Tabla `manhwa`
```
++idManhwa, &[title+idSite], title, chapters, currentChapterUrl, lastReadChapter,
isFavorite, status, lastTimeRead, imgUrl, idSite, genre, note, [status+title]
```
- Clave primaria autoincremental: `idManhwa`.
- `&[title+idSite]`: **clave única compuesta** → evita el mismo título duplicado en el mismo sitio.
- `[status+title]`: índice compuesto usado para orden/filtrado por estado.
- `idSite`: referencia al `site` correspondiente (relación lógica; se resuelve con
  `db.site.get(manhwa.idSite)`).
- `isFavorite`: `1`/`0`.

### Relación entre tablas

`manhwa.idSite` → `site.idSite`. No hay índice foráneo declarado; la unión se hace en
memoria en `useDexie` (`Promise.all` con `db.site.get`).

## Progreso de lectura

Se representa con tres campos de `manhwa`:

| Campo | Significado en el código |
| --- | --- |
| `lastReadChapter` | Número de capítulo leído (de `extractChapterFromUrl` o editado). |
| `currentChapterUrl` | URL del capítulo actual (`window.location.href`). |
| `lastTimeRead` | Fecha ISO de la última lectura/actualización. |

Al guardar un manhwa que **ya existe** (misma `[title+idSite]`), `addManhwaWithSite`
actualiza `lastReadChapter`, `lastTimeRead` y `currentChapterUrl` previa confirmación del
usuario; si no existe, lo crea.

## Operaciones de datos (`src/db/useDexie.js`)

| Función | Comportamiento |
| --- | --- |
| `addManhwaWithSite(siteData, manhwaData, confirmUpdateCb)` | Crea o reutiliza el `site` (por `baseUrl`). Si el manhwa ya existe en ese sitio, llama a `confirmUpdateCb`; si confirma, actualiza `lastReadChapter`/`lastTimeRead`/`currentChapterUrl` dentro de una transacción; si no, lo crea. |
| `getManhwas(page, pageSize, sortBy)` | Pagina. Sin `sortBy`: orden por `title`. Con `sortBy`: rango sobre `[status+title]`. Devuelve `{manhwasAndSite, total}`. |
| `searchByName(name, page, pageSize)` | Carga **todos** los manhwas (`orderBy("title").toArray()`), filtra en memoria con `toLowerCase().includes(...)` y pagina con `slice`. Lanza error si el término está vacío. |
| `getFavoriteManhwas(page, pageSize)` | Filtra por `isFavorite === 1` y pagina. |
| `updateMahwa(id, newInfo)` | Actualiza campos de un manhwa (nota: el nombre de la función está escrito así en el código). |
| `updateSite(id, newInfo)` | Actualiza campos de un site. |
| `updateFavorite(idManhwa, fav)` | Fija `isFavorite` a `1`/`0`. |
| `deleteManhwa(id)` | Borra el manhwa y, si el `site` asociado queda sin manhwas referenciados, elimina también el `site` (limpieza de huérfanos). |
| `exportDataBase()` | Ver formato de export. |
| `importDatabase(file)` | Valida la estructura del JSON (`manhwas` y `sites` como arrays). Ejecuta `clear()` + `bulkAdd()` **dentro de una transacción** para atomicidad; si falla, no deja datos parciales. |

## Formato de export / import (JSON)

`exportDataBase()` genera y descarga un JSON con esta forma:

```json
{
  "metadata": { "exportedAt": "<ISO>", "dbversion": 1 },
  "manhwas": [ /* filas de la tabla manhwa */ ],
  "sites":   [ /* filas de la tabla site */ ]
}
```

- Nombre de archivo: `manhwa_backup_<fecha ISO con : y . reemplazados por ->.json`.
- `importDatabase(file)`:
  1. `JSON.parse` del contenido,
  2. si existe `manhwas`: `db.manhwa.clear()` + `db.manhwa.bulkAdd(...)`,
  3. si existe `sites`: `db.site.clear()` + `db.site.bulkAdd(...)`.

## Hechos conocidos (estado actual)

- `metadata.dbversion` se toma de `db.verno` (versión real de la base; actualmente `1`).
- El import **valida** la estructura y ejecuta `clear()` + `bulkAdd()` **en transacción**; ya no deja datos parciales.
- La búsqueda no usa índices (carga toda la tabla en memoria).
- `deleteManhwa` limpia `site` huérfanos automáticamente.
- El enum `ManhwaStatus` incluye `NOT_YET_RELEASED` y `DISCONTINUED` (valores de AniList).

## PENDIENTE DE CONFIRMAR

- No hay documentación en el código sobre compatibilidad entre versiones del backup.
- No se ha verificado el comportamiento del import con archivos grandes o malformados.
