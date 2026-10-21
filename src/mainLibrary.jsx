import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import Library from "./components/Library";
import { DbProvider } from "./db/DbContext";
import "./css/general.css";

function mount() {
  try {
    const el = document.getElementById("root");
    if (!el) return;
    const root = createRoot(el);

    // Montaje síncrono por consistencia con el popup.
    flushSync(() => {
      root.render(
        <StrictMode>
          <DbProvider>
            <Library />
          </DbProvider>
        </StrictMode>
      );
    });
  } catch (e) {
    console.error("Failed to mount library", e);
  }
}

// Igual que en el popup: se espera a que el DOM esté listo y los estilos
// inlineados ya se hayan aplicado.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount, { once: true });
} else {
  requestAnimationFrame(() => {
    requestAnimationFrame(mount);
  });
}

