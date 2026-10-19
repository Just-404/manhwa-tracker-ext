# Pruebas y verificación

Estado real de las comprobaciones del proyecto. **No se describen pruebas que no existan.**

## Tests automatizados

- **No hay tests.** No existe framework de pruebas, ni archivos `*.test.*`/`*.spec.*`, ni
  script de test en `package.json`.
- **No hay type-check:** el proyecto no usa TypeScript (no hay `tsconfig.json`) ni chequeo
  de tipos configurado.
- **No hay CI:** no existe `.github/` ni otra configuración de integración continua.

## Comandos disponibles (`package.json`)

| Comando | Qué hace | Estado |
| --- | --- | --- |
| `npm run dev` | Servidor de desarrollo Vite. | Definido. No verificado en navegador aquí. |
| `npm run build` | Build de producción en `dist/`. | Definido. |
| `npm run lint` | `eslint .` (ESLint 9, flat config `eslint.config.js`). | **Falla actualmente** (ver abajo). |
| `npm run preview` | Vista previa del build de Vite. | Definido. |

> `npm install` es necesario antes de build/lint (dependencias en `package.json`).

## Resultado actual del lint

Ejecutado con `npm run lint` / `npx eslint .`:

```
✖ 4 problems (0 errors, 4 warnings)
```

Código de salida 0 (sin errores). **4 warnings** pendientes:

- `src/components/ConfirmModal.jsx` — `react-refresh/only-export-components` (×2).
- `src/db/DbContext.jsx` — `react-refresh/only-export-components`.
- `src/components/Library.jsx` — `react-hooks/exhaustive-deps` en el `useEffect`.

> Los 13 errores `no-undef` previos (`chrome`/`browser` sin declarar) se resolvieron
> declarando los globales del entorno WebExtension (`globals.webextensions`). **No se
> desactivó ninguna regla.**

## Configuración de lint

`eslint.config.js` (flat config) aplica a `**/*.{js,jsx}` con:
- `@eslint/js` (`js.configs.recommended`),
- `eslint-plugin-react-hooks` (`recommended`),
- `eslint-plugin-react-refresh`,
- regla `no-unused-vars` con `varsIgnorePattern: '^[A-Z_]'`,
- `languageOptions.globals: { ...globals.browser, ...globals.webextensions }` (declara
  `browser`, `chrome`, etc.),
- `ignores: ['dist']`.

## Verificación manual (no automatizada)

Para probar la extensión hay que construir y cargarla como extensión temporal en Firefox
(no hay script que lo automatice). **PENDIENTE DE CONFIRMAR:** pasos exactos y soporte en
Firefox móvil no verificados en el repositorio.

## Recomendación de uso al hacer cambios

1. Ejecutar `npm run lint` y comprobar que sigue en 0 errores (estado base: 0 errores /
   4 warnings) para no introducir errores nuevos.
2. Ejecutar `npm run build` para confirmar que el empaquetado (`dist/`) se genera.
3. Verificar manualmente en Firefox el flujo afectado (popup, biblioteca, guardado).
