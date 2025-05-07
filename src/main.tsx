import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App3D from "./App3D";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App3D />
  </StrictMode>,
);
