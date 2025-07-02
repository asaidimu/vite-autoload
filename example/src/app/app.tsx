import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../assets/app.css";
import ApplicationLayout from "./layout";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ApplicationLayout />
  </StrictMode>,
);
