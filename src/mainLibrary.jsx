import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Library from "./components/Library";
import { DbProvider } from "./db/DbContext";
import "./css/general.css";
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <DbProvider>
      <Library />
    </DbProvider>
  </StrictMode>
);
