// SWR-поток данных: мгновенно из памяти/localStorage/локального JSON,
// в фоне — сверка с Google Таблицей (не чаще раза в 15 минут).
// PapaParse грузится динамически — нужен только для парсинга фонового рефреша
// (−7KB gzip из критического пути, см. Lighthouse-отчёт).
import localGames from "../data/games.json";
import localCollections from "../data/collections.json";
import localSchedule from "../data/schedule.json";
import {
  GAMES_URL,
  COLLECTIONS_URL,
  SCHEDULE_URL,
  COPY_SHEETS_API_VALUES_URL,
  SHEETS_API_KEY,
} from "../config/dataSources";
import {
  normalizeGames,
  normalizeCollections,
  extractLinksFromCopyRow,
  steamHeaderUrl,
} from "./normalize";
import { parseRuDate, formatRuDate } from "./date";
import { safeGet, safeSet, safeRemove, hashStr } from "./storage";

const REFRESH_MS = 15 * 60 * 1000; // сверка с таблицей не чаще 1 раза в 15 минут
const V = "v5";

const memory = { games: null, collections: null, schedule: null };

const cacheKeys = {
  games: `tiankami_games_${V}_${hashStr(GAMES_URL)}`,
  collections: `tiankami_collections_${V}_${hashStr(COLLECTIONS_URL)}`,
  schedule: `tiankami_schedule_${V}_${hashStr(SCHEDULE_URL)}`,
  lastCheck: "tiankami_last_check",
};

async function fetchText(url, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} для ${url}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

// ─── Обогащение игр данными из локального JSON ───────────────────────────────
// Живая сверка с таблицей приносит текст вместо гиперссылок («Ссылка на плейлист»),
// поэтому ссылки, обложки и appId берём из локального файла, если в свежих данных их нет.
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

// Гиперссылки из Копии (Sheets API, колонки C:W)
async function fetchCopyLinks() {
  if (!SHEETS_API_KEY) return null;
  try {
    const res = await fetch(COPY_SHEETS_API_VALUES_URL("C:W"));
    if (!res.ok) return null;
    const json = await res.json();
    const map = {};
    (json.values || []).forEach((row) => {
      const got = extractLinksFromCopyRow(row);
      if (got) map[got.title.toLowerCase()] = got.entry;
    });
    return map;
  } catch {
    return null;
  }
}

function mergeLinks(games, linkMap) {
  if (!linkMap) return games;
  return games.map((g) => {
    const entry = linkMap[String(g.title).toLowerCase()];
    if (!entry) return g;
    const next = { ...g };
    if (entry.steamAppId && !next.steamAppId) {
      next.steamAppId = entry.steamAppId;
      next.image = next.image || steamHeaderUrl(entry.steamAppId);
      next.steamUrl = `https://store.steampowered.com/app/${entry.steamAppId}/`;
    }
    if (entry.youtube && (!next.youtube || !/^https?:/i.test(next.youtube)))
      next.youtube = entry.youtube;
    if (entry.miVideo && (!next.miVideo || !/^https?:/i.test(next.miVideo)))
      next.miVideo = entry.miVideo;
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

// ─── Мгновенные данные: память → localStorage → локальный JSON ───────────────
export function getInitialData() {
  const games =
    memory.games ||
    safeGet(cacheKeys.games) ||
    enrichWithLocal(Array.isArray(localGames) ? localGames : []);
  const collections =
    memory.collections ||
    safeGet(cacheKeys.collections) ||
    (Array.isArray(localCollections) ? localCollections : []);
  const schedule =
    memory.schedule ||
    safeGet(cacheKeys.schedule) ||
    (Array.isArray(localSchedule) ? localSchedule : []);
  return { games, collections, schedule };
}

// ─── Фоновая сверка с таблицами ──────────────────────────────────────────────
export async function maybeRefresh() {
  const last = safeGet(cacheKeys.lastCheck) || 0;
  if (Date.now() - last < REFRESH_MS) return null;
  return forceRefresh();
}

export async function forceRefresh() {
  safeSet(cacheKeys.lastCheck, Date.now());
  const { default: Papa } = await import("papaparse");
  const [gamesTsv, collectionsCsv, scheduleCsv] = await Promise.all([
    fetchText(GAMES_URL),
    fetchText(COLLECTIONS_URL),
    fetchText(SCHEDULE_URL),
  ]);

  const gameRows = Papa.parse(gamesTsv, { skipEmptyLines: "greedy" }).data;
  let games = normalizeGames(gameRows);

  const linkMap = await fetchCopyLinks();
  games = linkMap ? mergeLinks(games, linkMap) : enrichWithLocal(games);

  const collections = normalizeCollections(
    Papa.parse(collectionsCsv, { skipEmptyLines: "greedy" }).data
  );
  const schedule = normalizeScheduleRows(
    Papa.parse(scheduleCsv, { header: true, skipEmptyLines: "greedy" }).data
  );

  const changed =
    hashStr(JSON.stringify(games)) !== hashStr(JSON.stringify(getInitialData().games)) ||
    hashStr(JSON.stringify(collections)) !==
      hashStr(JSON.stringify(getInitialData().collections)) ||
    hashStr(JSON.stringify(schedule)) !==
      hashStr(JSON.stringify(getInitialData().schedule));

  memory.games = games;
  memory.collections = collections;
  memory.schedule = schedule;
  safeSet(cacheKeys.games, games);
  safeSet(cacheKeys.collections, collections);
  safeSet(cacheKeys.schedule, schedule);
  return changed ? { games, collections, schedule } : { games, collections, schedule };
}

// ─── Полный сброс кэшей («Обновить данные») ──────────────────────────────────
export function clearCache() {
  memory.games = null;
  memory.collections = null;
  memory.schedule = null;
  Object.values(cacheKeys).forEach((k) => safeRemove(k));
}
