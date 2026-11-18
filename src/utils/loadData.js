// Данные сайта: только локальный JSON, собранный при сборке.
//
// Раньше здесь была живая сверка с Google Таблицей каждые 15 минут. Убрана 17.10.2026:
// таблица отдаёт гиперссылки текстом, поэтому свежие данные всегда были беднее сборки,
// а каждый визит тянул 250+ КБ с docs.google.com. Свежесть теперь обеспечивает
// пересборка по расписанию (см. .github/workflows/deploy.yml).
import localGames from "../data/games.json";
import localCollections from "../data/collections.json";
import localSchedule from "../data/schedule.json";

// ─── Данные для страниц ──────────────────────────────────────────────────────
// Убрано 18.11.2026: enrichWithLocal и normalizeScheduleRows. Первая передавала
// себе тот же массив, который индексировала, и ничего не меняла (проверено:
// 0 игр с appId без обложки); вторая собирала строки листа «Расписание», который
// не заполняется с 18.10.2026 — расписание приходит с Twitch уже в нужном виде.
export function getInitialData() {
  return {
    games: Array.isArray(localGames) ? localGames : [],
    collections: Array.isArray(localCollections) ? localCollections : [],
    schedule: Array.isArray(localSchedule) ? localSchedule : [],
  };
}

// Дата сборки — первый рендер берёт её, чтобы совпасть с пререндером
// (см. HomePage.jsx и SchedulePage.jsx). Пустая строка, если define не сработал.
export function buildDate() {
  if (typeof __BUILD_DATE__ === "undefined") return "";
  const [y, m, d] = String(__BUILD_DATE__).split("-");
  return d && m && y ? `${d}.${m}.${y}` : "";
}
