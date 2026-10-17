// Данные сайта: только локальный JSON, собранный при сборке.
//
// Раньше здесь была живая сверка с Google Таблицей каждые 15 минут. Убрана 17.10.2026:
// таблица отдаёт гиперссылки текстом, поэтому свежие данные всегда были беднее сборки,
// а каждый визит тянул 250+ КБ с docs.google.com. Свежесть теперь обеспечивает
// пересборка по расписанию (см. .github/workflows/deploy.yml).
import localGames from "../data/games.json";
import localCollections from "../data/collections.json";
import localSchedule from "../data/schedule.json";
import { steamHeaderUrl } from "./normalize";
import { parseRuDate, formatRuDate } from "./date";

// ─── Обогащение игр данными из локального JSON ───────────────────────────────
// Нужно, если в данных окажется игра без обложки или ссылки: подставляем из того же файла
// по slug или названию. Ничего не перезаписывает, только заполняет пустое.
export function enrichWithLocal(games) {
  const bySlug = {};
  const byTitle = {};
  (Array.isArray(localGames) ? localGames : []).forEach((lg) => {
    if (lg?.slug) bySlug[lg.slug] = lg;
    if (lg?.title) byTitle[String(lg.title).toLowerCase()] = lg;
  });
  return (games || []).map((g) => {
    const local = bySlug[g.slug] || byTitle[String(g.title).toLowerCase()];
    if (!local) return g;
    const appId = g.steamAppId || local.steamAppId;
    const next = { ...g };
    if (appId) {
      next.steamAppId = appId;
      next.image = g.image || steamHeaderUrl(appId);
      next.steamUrl = g.steamUrl || `https://store.steampowered.com/app/${appId}/`;
    }
    if (!next.image && local.image) next.image = local.image;
    if (!next.youtube && local.youtube) next.youtube = local.youtube;
    if (!next.miVideo && local.miVideo) next.miVideo = local.miVideo;
    return next;
  });
}

// ─── Расписание: нормализация строк (YYYY-MM-DD → DD.MM.YYYY) ────────────────
export function normalizeScheduleRows(rows) {
  const out = [];
  (rows || []).forEach((r) => {
    if (!r) return;
    const rawDate = String(r.date || "").trim();
    const game = String(r.game || "").trim();
    if (!rawDate || !game) return;
    const d = parseRuDate(rawDate);
    if (!d) return;
    out.push({
      date: formatRuDate(d),
      time: String(r.time || "").trim(),
      game,
      streamLink: String(r.streamLink || "").trim(),
    });
  });
  out.sort(
    (a, b) => (parseRuDate(a.date)?.getTime() || 0) - (parseRuDate(b.date)?.getTime() || 0)
  );
  return out;
}

// ─── Данные для страниц ──────────────────────────────────────────────────────
export function getInitialData() {
  return {
    games: enrichWithLocal(Array.isArray(localGames) ? localGames : []),
    collections: Array.isArray(localCollections) ? localCollections : [],
    schedule: Array.isArray(localSchedule) ? localSchedule : [],
  };
}

// Дата сборки данных — её показывает подвал вместо кнопки «Обновить данные».
export function buildDate() {
  if (typeof __BUILD_DATE__ === "undefined") return "";
  const [y, m, d] = String(__BUILD_DATE__).split("-");
  return d && m && y ? `${d}.${m}.${y}` : "";
}
