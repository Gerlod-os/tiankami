// Синхронизация: Google Sheets → src/data/*.json
// Запуск: npm run sync. Ключей не нужно: и TSV, и xlsx таблицы публичные.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Papa from "papaparse";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "src", "data");

const DS = await import("../src/config/dataSources.js");
const {
  normalizeGames,
  normalizeCollections,
  extractSteamAppId,
  isUrl,
} = await import("../src/utils/normalize.js");
const { linksFromSheetXlsx } = await import("../src/utils/xlsx.js");
const { twitchSchedule, SCHEDULE_DAYS } = await import("./twitch-schedule.mjs");
const { parseRuDate, formatRuDate } = await import("../src/utils/date.js");

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

// Выгрузка таблицы в xlsx весит ~25 МБ, поэтому таймаут и число попыток свои.
async function fetchBuffer(url, tries = 2, timeoutMs = 120000) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(t);
      if (!res.ok) throw new Error(`HTTP ${res.status} для ${url}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
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

// ── 2. Ссылки Steam/YouTube/МИ из таблицы (xlsx, без ключа) ──────────────────
// Экспорт в TSV теряет гиперссылки: ячейка приходит текстом «Ссылка на плейлист».
// В xlsx адрес лежит в <hyperlink r:id=…>, а сам файл скачивается без ключа.
// Раньше здесь был Sheets API с серверным ключом — в Actions он получал 403.
// Обложку из appId здесь НЕ собираем: старый путь header.jpg у новых игр Steam
// отдаёт 404 (проверено 18.10.2026 на The Looper и Tower Tactics 2). Обложки
// ставит таблица, а спорные — scripts/fix-covers.mjs после проверки адреса.
if (games.length) {
  try {
    console.log("▸ Скачиваю таблицу в xlsx (ссылки Steam/YouTube/МИ)…");
    const buf = await fetchBuffer(DS.GAMES_XLSX_URL);
    const links = linksFromSheetXlsx(buf, DS.GAMES_SHEET_NAME);
    let steam = 0;
    let youtube = 0;
    let mi = 0;
    games = games.map((g) => {
      const row = links.get(String(g.title).trim().toLowerCase());
      if (!row) return g;
      const next = { ...g };
      const appId = extractSteamAppId(row.steam);
      if (appId) {
        next.steamAppId = appId;
        next.steamUrl = `https://store.steampowered.com/app/${appId}/`;
        steam += 1;
      }
      if (isUrl(row.youtube)) {
        next.youtube = row.youtube;
        youtube += 1;
      }
      if (isUrl(row.mi)) {
        next.miVideo = row.mi;
        mi += 1;
      }
      return next;
    });
    console.log(
      `  ✔ xlsx: строк ${links.size}, Steam ${steam}, YouTube ${youtube}, МИ ${mi}`
    );
  } catch (e) {
    console.warn("  ⚠ Ссылки из xlsx не скачались:", e.message);
  }
}

// ── 2.5. Обложки из overrides — функция ниже, применяется после withRichFields ──
// В таблице бывают неверные appId и старые адреса обложек. Файл overrides собирается
// скриптом fix-covers.mjs и применяется последним, чтобы правка не терялась при синке.
const OVERRIDES = path.join(DATA_DIR, "steam-overrides.json");
function applyOverrides(games) {
  if (!games.length || !fs.existsSync(OVERRIDES)) return games;
  let ov;
  try {
    ov = JSON.parse(fs.readFileSync(OVERRIDES, "utf8"));
  } catch (e) {
    console.warn("  ⚠ overrides не прочитались:", e.message);
    return games;
  }
  let fixed = 0;
  const out = games.map((g) => {
    const o = ov[g.slug];
    if (!o) return g;
    // hide: true — обложки нет ни в таблице, ни в Steam. Убираем битый адрес,
    // чтобы карточка показала заглушку, а не сломанную картинку.
    if (o.hide) {
      fixed += 1;
      return { ...g, image: "", steamAppId: "", steamUrl: "" };
    }
    if (!o.appId || !o.image) return g;
    fixed += 1;
    return {
      ...g,
      steamAppId: String(o.appId),
      image: o.image,
      steamUrl: `https://store.steampowered.com/app/${o.appId}/`,
    };
  });
  console.log(`  ✔ обложки из overrides: ${fixed}`);
  return out;
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

// ── 4. Расписание: сначала календарь Twitch, таблица — запасной вариант ─────
// Таблицу расписания никто не заполняет (слово владельца 18.10.2026), поэтому
// основной источник — публичный календарь канала. Он отдаёт недельную сетку,
// её разворачиваем в даты на неделю вперёд.
let schedule = [];
try {
  console.log("▸ Беру расписание из календаря Twitch…");
  schedule = await twitchSchedule(fetchText, DS.TWITCH_ICS_URL);
  console.log(`  ✔ стримов на ${SCHEDULE_DAYS} дней вперёд: ${schedule.length}`);
} catch (e) {
  console.warn("  ⚠ Календарь Twitch не сработал:", e.message);
  try {
    console.log("▸ Запасной вариант: «Расписание» из таблицы…");
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
    console.log(`  ✔ стримов из таблицы: ${schedule.length}`);
  } catch (e2) {
    console.warn("  ⚠ Расписание из таблицы тоже не скачалось:", e2.message);
  }
}

// ── 5. Пишем JSON ────────────────────────────────────────────────────────────
// Обложки Steam и ссылки добавляет только шаг «Копия» с ключом Sheets API.
// Без ключа (сборка на GitHub) свежие данные вышли бы без картинок, поэтому
// переносим их из уже сохранённого файла — иначе страницы теряют обложки и og:image.
writeJson("games.json", applyOverrides(withRichFields(games)));
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
  // Переносим только годное: адрес должен быть адресом, appId — числом.
  // Иначе текст из таблицы («Ссылка на плейлист») вернётся в данные и убьёт плеер.
  const usable = (f, v) =>
    f === "steamAppId" ? /^\d+$/.test(String(v).trim()) : isUrl(v);
  let restored = 0;
  for (const g of games) {
    const old = bySlug.get(g.slug);
    if (!old) continue;
    for (const f of ["image", "steamAppId", "steamUrl", "youtube", "miVideo"]) {
      if (!g[f] && old[f] && usable(f, old[f])) {
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
