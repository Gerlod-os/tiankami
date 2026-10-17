// Серверная точка входа для SEO-пререндера
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import App from "./App.jsx";
import { BASE_PATH } from "./config/site.js";

export function render(url) {
  // url приходит без префикса ("/catalog"), а роутер с basename ждёт полный путь.
  const location = BASE_PATH + (url === "/" ? "/" : url);
  return renderToString(
    <StaticRouter location={location} basename={BASE_PATH}>
      <App />
    </StaticRouter>
  );
}
