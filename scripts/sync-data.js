// Синхронизация: Google Sheets → src/data/*.json
// Запуск: npm run sync (Node, .env читается вручную — import.meta.env тут нет)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Papa from "papaparse";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "src", "data");

// ── ручная загрузка .env ─────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}
loadEnv();

const DS = await import("../src/config/dataSources.js");
const { normalizeGames, normalizeCollections, extractLinksFromCopyRow, steamHeaderUrl } =
  await import("../src/utils/normalize.js");
const { parseRuDate, formatRuDate } = await import("../src/utils/date.js");

const SERVER_KEY =
  process.env.SHEETS_API_KEY_SERVER || process.env.VITE_SHEETS_API_KEY || "";

async function fetchText(url, tries = 3, timeoutMs = 15000) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(t);
      if (!res.ok) throw new Error(`HTTP ${res.status} для ${url}`);
      return await res.text();
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 800 * (i + 1)));
    }
  }
  throw lastErr;
}

function writeJson(name, data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const file = path.join(DATA_DIR, name);
  // Сеть недоступна — источник вернул пусто. Прежние данные не трогаем:
  // иначе сборка на хостинге задеплоит каталог без игр.
  if (Array.isArray(data) && data.length === 0 && fs.existsSync(file)) {
    try {
      const prev = JSON.parse(fs.readFileSync(file, "utf8"));
      if (Array.isArray(prev) && prev.length > 0) {
        console.warn(
          `  ⚠ src/data/${name}: свежих данных нет, оставляю прежние (${prev.length})`
        );
        return;
      }
    } catch {
      /* файл битый — перезапишем */
    }
  }
  fs.writeFileSync(file, JSON.stringify(data));
  console.log(`  ✔ src/data/${name} (${(fs.statSync(file).size / 1024).toFixed(0)} KB)`);
}

// ── 1. Игры (TSV) ────────────────────────────────────────────────────────────
let games = [];
try {
  console.log("▸ Скачиваю «Все рогалики» (TSV)…");
  const tsv = await fetchText(DS.GAMES_URL);
  const rows = Papa.parse(tsv, { skipEmptyLines: "greedy" }).data;
  games = normalizeGames(rows);
  console.log(`  ✔ игр: ${games.length}`);
} catch (e) {
  console.warn("  ⚠ Игры не скачались:", e.message);
}

// ── 2. Обогащение ссылками из Копии (Sheets API, серверный ключ) ─────────────
if (games.length && SERVER_KEY) {
  try {
    console.log("▸ Скачиваю гиперссылки из Копии (C:W)…");
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${DS.COPY_SPREADSHEET_ID}/values/${encodeURIComponent(`${DS.GAMES_SHEET_NAME}!C:W`)}?key=${SERVER_KEY}&valueRenderOption=FORMULA`;
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      const map = {};
      (json.values || []).forEach((row) => {
        const got = extractLinksFromCopyRow(row);
        if (got) map[got.title.toLowerCase()] = got.entry;
      });
      let linked = 0;
      games = games.map((g) => {
        const entry = map[String(g.title).toLowerCase()];
        if (!entry) return g;
        linked++;
        const next = { ...g };
        if (entry.steamAppId) {
          next.steamAppId = entry.steamAppId;
          next.image = next.image || steamHeaderUrl(entry.steamAppId);
          next.steamUrl = `https://store.steampowered.com/app/${entry.steamAppId}/`;
        }
        if (entry.youtube) next.youtube = entry.youtube;
        if (entry.miVideo) next.miVideo = entry.miVideo;
        return next;
      });
      console.log(`  ✔ игр со ссылками: ${linked}`);
    } else {
      console.warn(`  ⚠ Sheets API: HTTP ${res.status}`);
    }
  } catch (e) {
    console.warn("  ⚠ Ссылки из Копии не скачались:", e.message);
  }
} else if (games.length) {
  console.warn("  ⚠ Нет серверного ключа — пропускаю гиперссылки.");
}

// ── 3. Подборки (CSV) ────────────────────────────────────────────────────────
let collections = [];
try {
  console.log("▸ Скачиваю «Подборки от Тиана»…");
  const csv = await fetchText(DS.COLLECTIONS_URL);
  collections = normalizeCollections(
    Papa.parse(csv, { skipEmptyLines: "greedy" }).data
  );
  console.log(`  ✔ подборок: ${collections.length}`);
} catch (e) {
  console.warn("  ⚠ Подборки не скачались:", e.message);
}

// ── 4. Расписание (CSV с заголовками) ────────────────────────────────────────
let schedule = [];
try {
  console.log("▸ Скачиваю «Расписание»…");
  const csv = await fetchText(DS.SCHEDULE_URL);
  const rows = Papa.parse(csv, { header: true, skipEmptyLines: "greedy" }).data;
  schedule = rows
    .map((r) => {
      const rawDate = String(r?.date || "").trim();
      const game = String(r?.game || "").trim();
      const d = parseRuDate(rawDate);
      if (!d || !game) return null;
      return {
        date: formatRuDate(d),
        time: String(r.time || "").trim(),
        game,
        streamLink: String(r.streamLink || "").trim(),
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        (parseRuDate(a.date)?.getTime() || 0) - (parseRuDate(b.date)?.getTime() || 0)
    );
  console.log(`  ✔ стримов в расписании: ${schedule.length}`);
} catch (e) {
  console.warn("  ⚠ Расписание не скачалось:", e.message);
}

// ── 5. Пишем JSON ────────────────────────────────────────────────────────────
// Обложки Steam и ссылки добавляет только шаг «Копия» с ключом Sheets API.
// Без ключа (сборка на GitHub) свежие данные вышли бы без картинок, поэтому
// переносим их из уже сохранённого файла — иначе страницы теряют обложки и og:image.
writeJson("games.json", withRichFields(games));
writeJson("collections.json", collections);
writeJson("schedule.json", schedule);
console.log("✅ Синхронизация завершена.");

function withRichFields(games) {
  const file = path.join(DATA_DIR, "games.json");
  if (!fs.existsSync(file)) return games;
  let prev;
  try {
    prev = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return games;
  }
  if (!Array.isArray(prev) || !prev.length) return games;
  const bySlug = new Map(prev.map((g) => [g.slug, g]));
  let restored = 0;
  for (const g of games) {
    const old = bySlug.get(g.slug);
    if (!old) continue;
    for (const f of ["image", "steamAppId", "steamUrl", "youtube", "miVideo"]) {
      if (!g[f] && old[f]) {
        g[f] = old[f];
        restored++;
      }
    }
  }
  if (restored) {
    console.log(`  ↺ обложки и ссылки перенесены из прежнего файла: ${restored} полей`);
  }
  return games;
}
