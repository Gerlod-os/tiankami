// Обновление списка плейлистов канала YouTube → src/data/youtube-playlists.json.
// Запуск: node scripts/yt-playlists.mjs (или npm run playlists).
//
// Раньше скрипт открывал вкладку «Плейлисты» через Playwright: обычный запрос
// отдавал пустую заготовку, а браузер доставал ключ и continuation-токен из
// ytInitialData. Проверено 18.11.2026: тот же ключ, версия клиента и токен
// лежат в обычном HTML страницы, поэтому браузер в CI не нужен. За 21 вызов
// внутреннего API собираются все 647 плейлистов — столько же, сколько через
// браузер и через yt-dlp.
//
// На провал сети/формата скрипт не роняет сборку: старый список остаётся,
// сайт продолжает работать с уже собранными ссылками.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "..", "src", "data", "youtube-playlists.json");
const CHANNEL = process.env.YT_CHANNEL || "https://www.youtube.com/@tiankami/playlists";
const MIN_PLAYLISTS = 100;
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  "Accept-Language": "ru-RU,ru;q=0.9",
};

function addPlaylist(node, items) {
  if (!node || typeof node !== "object") return;
  const lv = node.lockupViewModel;
  if (lv?.contentId) {
    const title =
      lv.metadata?.lockupMetadataViewModel?.title?.content ||
      lv.title?.simpleText ||
      "";
    if (title) items.set(lv.contentId, title);
  }
  for (const key in node) addPlaylist(node[key], items);
}

function findContinuation(node, seen) {
  if (!node || typeof node !== "object") return null;
  const token = node.continuationEndpoint?.continuationCommand?.token;
  if (token && !seen.has(token)) {
    seen.add(token);
    return token;
  }
  for (const key in node) {
    const nested = findContinuation(node[key], seen);
    if (nested) return nested;
  }
  return null;
}

async function collect() {
  const res = await fetch(CHANNEL, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} для ${CHANNEL}`);
  const html = await res.text();

  const marker = "ytInitialData = ";
  const start = html.indexOf(marker);
  const end = html.indexOf(";</script>", start + marker.length);
  if (start < 0 || end < 0) throw new Error("ytInitialData не найден в HTML");
  const initial = JSON.parse(html.slice(start + marker.length, end));

  const key = /"INNERTUBE_API_KEY":"([^"]+)"/.exec(html)?.[1];
  const version = /"INNERTUBE_CLIENT_VERSION":"([^"]+)"/.exec(html)?.[1];
  if (!key || !version) throw new Error("ключ или версия клиента YouTube не найдены");

  const items = new Map();
  addPlaylist(initial, items);

  const ctx = {
    context: {
      client: { clientName: "WEB", clientVersion: version, hl: "ru", gl: "RU" },
    },
  };
  const seen = new Set();
  let token = findContinuation(initial, seen);
  let calls = 0;
  while (token && calls < 200) {
    calls += 1;
    const r = await fetch(`https://www.youtube.com/youtubei/v1/browse?key=${key}`, {
      method: "POST",
      headers: { ...HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ ...ctx, continuation: token }),
    });
    if (!r.ok) throw new Error(`browse HTTP ${r.status}`);
    const json = await r.json();
    const list =
      json.onResponseReceivedActions?.[0]?.appendContinuationItemsAction
        ?.continuationItems || [];
    for (const item of list) addPlaylist(item, items);
    token = findContinuation(json, seen);
    if (!list.length) break;
  }

  const playlists = [...items.entries()]
    .filter(([id, title]) => id && title)
    .map(([id, title]) => ({ id, title }))
    .sort((a, b) => a.title.localeCompare(b.title, "ru"));
  return { playlists, calls };
}

try {
  const { playlists, calls } = await collect();
  if (playlists.length < MIN_PLAYLISTS) {
    throw new Error(
      `получено ${playlists.length} плейлистов, порог ${MIN_PLAYLISTS} — похоже на сбой выгрузки`,
    );
  }
  const previous = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : [];
  if (previous.length && playlists.length < previous.length) {
    console.warn(
      `ВНИМАНИЕ: плейлистов стало ${playlists.length}, было ${previous.length} — оставляю прежний список`,
    );
  } else {
    fs.writeFileSync(OUT, JSON.stringify(playlists, null, 1));
    console.log(
      `Плейлистов: ${playlists.length} (было ${previous.length}, вызовов API: ${calls}) → ${path.relative(process.cwd(), OUT)}`,
    );
    console.log(
      `  MINOS: ${playlists.find((p) => /^minos$/i.test(p.title))?.id || "нет"}`,
    );
  }
} catch (e) {
  console.warn(`ВНИМАНИЕ: список плейлистов не обновлён: ${e.message}. Остаётся прежний файл.`);
}
