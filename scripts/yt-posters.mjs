// Карта «плейлист → ID первого ролика» для постеров плеера.
// Запуск: node scripts/yt-posters.mjs (в папке tiankami-site).
//
// Зачем: у игры со ссылкой на плейлист нет отдельного videoId, поэтому постером
// раньше служила обложка игры. YouTube не отдаёт кадр по ID плейлиста
// (i.ytimg.com/pl/<id>/... → 404), но публичный RSS плейлиста даёт yt:videoId
// первого ролика, а по нему уже есть i.ytimg.com/vi/<videoId>/maxresdefault.jpg.
//
// Ключей и токенов не нужно. Собираем только плейлисты, реально используемые
// в games.json (не все 612): меньше запросов и компактнее карта. Карта лежит
// в git и обновляется этим скриптом, поэтому сборка сайта сетью не платит.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, "..", "src", "data");
const OUT = path.join(DATA, "youtube-posters.json");
const RSS = "https://www.youtube.com/feeds/videos.xml?playlist_id=";
const PARALLEL = 8;

const games = JSON.parse(fs.readFileSync(path.join(DATA, "games.json"), "utf8"));
const playlists = JSON.parse(
  fs.readFileSync(path.join(DATA, "youtube-playlists.json"), "utf8"),
);
const known = new Set(playlists.map((p) => p.id));
const used = new Set();
for (const g of games) {
  const m = /[?&]list=([\w-]+)/.exec(String(g.youtube || ""));
  if (m && known.has(m[1]) && !/[?&]v=/.test(String(g.youtube || ""))) used.add(m[1]);
}

// Уже собранные ID не запрашиваем повторно: скрипт можно гонять сколько угодно.
const prev = fs.existsSync(OUT)
  ? JSON.parse(fs.readFileSync(OUT, "utf8"))
  : {};
const result = { ...prev };
const todo = [...used].filter((id) => !result[id]);

async function firstVideo(id) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(RSS + id, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const xml = await res.text();
    const m = /<yt:videoId>([\w-]{11})<\/yt:videoId>/.exec(xml);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

let done = 0;
const failed = [];
for (let i = 0; i < todo.length; i += PARALLEL) {
  const batch = todo.slice(i, i + PARALLEL);
  const ids = await Promise.all(batch.map(firstVideo));
  batch.forEach((playlistId, j) => {
    done += 1;
    if (ids[j]) result[playlistId] = ids[j];
    else failed.push(playlistId);
  });
  if ((i / PARALLEL) % 5 === 0) {
    console.log(`  обработано ${done}/${todo.length}`);
  }
}

// Пишем отсортированную карту: стабильный diff в гите.
const sorted = Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync(OUT, JSON.stringify(sorted, null, 1) + "\n");
console.log(`✔ постеров в карте: ${Object.keys(sorted).length} (новых ${todo.length - failed.length}, не удалось ${failed.length})`);
console.log(`  использовалось плейлистов: ${used.size} из ${playlists.length}`);
if (failed.length) console.log(`  без RSS: ${failed.slice(0, 5).join(", ")}`);
