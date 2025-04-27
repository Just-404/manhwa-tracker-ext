import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "index.html"),
        library: resolve(__dirname, "library.html"),
        background: resolve(__dirname, "src/js/background.js"),
        contentScript: resolve(__dirname, "src/js/contentScript.js"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (["background", "contentScript"].includes(chunkInfo.name)) {
            return "[name].js";
          }
          return "assets/[name].js";
        },
      },
    },
  },
});
