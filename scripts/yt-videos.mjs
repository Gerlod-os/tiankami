// Сбор ссылок на видео канала для игр без плейлиста → src/data/youtube-videos.json
//
// Зачем: плейлистов на канале 30, а игр без ссылки 49. Плейлиста может не быть
// вовсе (MINOS — пять отдельных видео), поэтому второй проход ищет видео по
// названию игры в поиске по каналу.
//
// Правило совпадения: нормализованное название игры должно целиком входить в
// название видео. Обратное (видео входит в игру) не годится — так «Grail»
// цепляет «Holy Grail».
//
// Запуск (нужен браузер): node scripts/yt-videos.mjs [--dry]
//   --dry — только показать найденное, файл не перезаписывать.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const GAMES = path.join(ROOT, "src", "data", "games.json");
const OUT = path.join(ROOT, "src", "data", "youtube-videos.json");
const CHANNEL = process.env.YT_CHANNEL || "https://www.youtube.com/@tiankami";
const DRY = process.argv.includes("--dry");

const norm = (s) => String(s || "").toLowerCase().replace(/[^0-9a-zа-яё]+/gi, "");

// Названия видео у канала собраны как «описание | Название игры #N».
// Берём часть после последней черты, снимаем номер выпуска и сравниваем:
//   сильное совпадение — равно названию игры;
//   слабое — название игры плюс слово-наполнитель («обзор», «игры»).
// Так «Lost Castle 2» не приклеивается к «Lost Castle», а «Cinderia #13» и
// «Gridlords обзор» остаются. Замер 18.10.2026: без правила «Crimsonland»
// получал чужое видео про Vampire Survivors.
const FILLER = /^(обзор|обзоры|обзоригры|игры|игра|прохождение|стрим|забег|полныйзабег)$/;

function titleScore(videoTitle, gameTitle) {
  const seg = String(videoTitle).split("|").pop().replace(/#\s*\d+\s*$/i, "").trim();
  const a = norm(seg);
  const b = norm(gameTitle);
  if (!a || !b) return 0;
  if (a === b) return 2;
  if (a.startsWith(b)) {
    const rest = a.slice(b.length);
    if (FILLER.test(rest)) return 1;
  }
  return 0;
}

const games = JSON.parse(fs.readFileSync(GAMES, "utf8"));
const targets = games.filter((g) => !g.youtube).map((g) => g.title);
console.log(`Игр без ссылки: ${targets.length}`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const found = [];

for (const title of targets) {
  const url = `${CHANNEL}/search?query=${encodeURIComponent(title)}`;
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    // Ждём именно карточки: на 2.2 с страница ещё пустая и всё выглядело как
    // «не нашлось» (проверено 18.10.2026).
    await page.waitForSelector("yt-lockup-view-model, ytd-video-renderer", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1200);
    const items = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll("yt-lockup-view-model, ytd-video-renderer")) {
        const a = el.querySelector('a[href*="/watch?v="]');
        const t = (el.querySelector("h3, .yt-lockup-metadata-view-model-wiz__title")?.textContent || "").trim();
        if (!a || !t) continue;
        const href = a.getAttribute("href").split("&")[0];
        if (!href.startsWith("/watch")) continue;
        out.push({ href, t });
      }
      return out;
    });
    const key = norm(title);
    // Сначала сильные совпадения, потом слабые: так обзор с подписью
    // «… | Игра обзор» не перебивает точное «… | Игра».
    let hit = items.find((x) => titleScore(x.t, title) === 2);
    if (!hit) hit = items.find((x) => titleScore(x.t, title) === 1 && norm(x.t).includes(key));
    if (hit) {
      found.push({ game: title, video: hit.t, url: `https://www.youtube.com${hit.href}` });
      console.log(`  ✔ ${title} → ${hit.t}`);
    } else {
      console.log(`  · ${title} — не нашлось (карточек: ${items.length})`);
    }
  } catch (e) {
    console.log(`  ! ${title} — ошибка: ${e.message.split("\n")[0]}`);
  }
}

await browser.close();
console.log(`\nНайдено: ${found.length} из ${targets.length}`);
if (DRY) {
  console.log("--dry: файл не тронут");
} else {
  found.sort((a, b) => a.game.localeCompare(b.game, "ru"));
  fs.writeFileSync(OUT, JSON.stringify(found, null, 1));
  console.log(`→ ${path.relative(ROOT, OUT)}`);
}
