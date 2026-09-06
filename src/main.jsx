// Клиентская точка входа
import "@fontsource-variable/nunito";
import "@fontsource-variable/inter";
import "@fontsource/cinzel/700.css";
import "./index.css";
import { StrictMode } from "react";
import { hydrateRoot, createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";

const container = document.getElementById("root");
const app = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

// Пререндеренные страницы гидрируем, пустые — рендерим с нуля
if (container.hasChildNodes()) {
  hydrateRoot(container, app);
} else {
  createRoot(container).render(app);
}
