import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Library from "./components/Library";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Library />
  </StrictMode>
);
