// Клиентская точка входа
import "@fontsource-variable/nunito";
import "@fontsource-variable/inter";
import "@fontsource-variable/unbounded";
// Cinzel убран 18.10.2026: латиница без кириллицы — на русских заголовках он не рисовался,
// браузер брал Georgia из стека. Файл грузился и ничего не менял.
import "./index.css";
import { StrictMode } from "react";
import { hydrateRoot, createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { BASE_PATH } from "./config/site.js";

const container = document.getElementById("root");
// На GitHub Pages сайт живёт в подпапке: /tiankami/. Роутер должен знать префикс,
// иначе внутренние ссылки уведут в корень домена.
const app = (
  <StrictMode>
    <BrowserRouter basename={BASE_PATH}>
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
