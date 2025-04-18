import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Library from "./components/Library";
import "./css/general.css";
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Library />
  </StrictMode>
);
