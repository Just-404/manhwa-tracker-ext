import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import Popup from "./components/Popup";
import { DbProvider } from "./db/DbContext";
import "./css/general.css";

function mount() {
  try {
    const el = document.getElementById("root");
    if (!el) return;
    if (el.firstChild) {
      el.innerHTML = "";
    }
    const root = createRoot(el);

    // Montaje síncrono: el contenido debe existir antes de que Firefox dimensione
    // el panel del popup, para que no aparezca vacío.
    flushSync(() => {
      root.render(
        <StrictMode>
          <DbProvider>
            <Popup />
          </DbProvider>
        </StrictMode>
      );
    });
  } catch (e) {
    console.error("Failed to mount popup", e);
  }
}

// Montar lo antes posible. En Firefox el panel del popup se dimensiona con el
// primer layout: usar flushSync con el DOM ya parseado evita el colapso a 0 px.
// El placeholder .boot garantiza una altura mínima si hay algún retraso.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount, { once: true });
} else {
  mount();
}

