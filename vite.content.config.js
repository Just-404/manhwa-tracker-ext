import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Build del content script.
//
// Se compila en un build separado porque `tabs.executeScript` lo inyecta como
// script clásico (no como módulo ES). Si compartiera el build principal, Vite
// lo partiría en chunks con `import` (porque `src/js/utils/utils.js` también lo
// usa la app) y fallaría con: "import declarations may only appear at top level
// of a module".
//
// Con una sola entrada y formato IIFE, todas las dependencias quedan inline en
// un único archivo sin sintaxis de módulo.
export default {
  publicDir: false,
  build: {
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      input: {
        contentScript: resolve(__dirname, "src/js/contentScript.js"),
      },
      output: {
        entryFileNames: "[name].js",
        format: "iife",
      },
    },
  },
};
