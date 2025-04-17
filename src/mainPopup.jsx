import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Popup from "./components/Popup";
import { DbProvider } from "./db/DbContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <DbProvider>
      <Popup />
    </DbProvider>
  </StrictMode>
);
