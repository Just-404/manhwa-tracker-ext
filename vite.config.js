import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Inlinea el CSS de cada HTML dentro de un <style> en el <head>.
//
// En una extensión de Firefox, un `<link rel="stylesheet">` se carga en
// paralelo al `<script type="module">` que monta React. Si React fuerza el
// layout antes de que la hoja termine de cargar, Gecko avisa de FOUC ("Layout
// was forced before the page was fully loaded") y, en el popup, el panel puede
// mostrarse vacío hasta que el recurso ya está en caché. Inlinearlo elimina esa
// carrera y además ahorra una petición.
function inlineEntryCss() {
  return {
    name: "inline-entry-css",
    apply: "build",
    enforce: "post",
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        if (!ctx.bundle) return html;

        // Se inlinea exactamente el CSS al que apunta cada <link>, respetando
        // su orden. Vite puede emitir el CSS compartido (design tokens) como un
        // asset aparte que no aparece en `importedCss` del entry, así que se
        // resuelve desde los propios enlaces del HTML.
        const linkRe = /<link[^>]*rel="stylesheet"[^>]*>\s*/g;
        const hrefRe = /href="([^"]+)"/;
        const styles = [];
        const seen = new Set();

        let match;
        while ((match = linkRe.exec(html))) {
          const href = hrefRe.exec(match[0])?.[1];
          if (!href) continue;
          const fileName = href.replace(/^\.?\//, "");
          if (seen.has(fileName)) continue;
          seen.add(fileName);
          const asset = ctx.bundle[fileName];
          if (asset && asset.type === "asset") {
            styles.push(`<style>${asset.source}</style>`);
          }
        }

        if (!styles.length) return html;

        linkRe.lastIndex = 0;
        return html
          .replace(linkRe, "")
          .replace("</head>", `${styles.join("")}</head>`);
      },
    },
  };
}

// Build principal: popup + biblioteca + background. Los HTML cargan los JS
// como módulos ES (`<script type="module">`), así que el code-splitting
// (chunks compartidos en `assets/`) es correcto aquí.
export default defineConfig({
  // Rutas relativas: los HTML de la extensión (popup y biblioteca) resuelven sus
  // assets sin depender de la raíz del origen `moz-extension://`.
  base: "./",
  plugins: [react(), inlineEntryCss()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "index.html"),
        library: resolve(__dirname, "library.html"),
        background: resolve(__dirname, "src/js/background.js"),
      },
      output: {
        entryFileNames: (chunkInfo) =>
          chunkInfo.name === "background" ? "[name].js" : "assets/[name].js",
      },
    },
  },
});
