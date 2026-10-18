// Обновление списка плейлистов канала YouTube → src/data/youtube-playlists.json.
// Нужен браузер: вкладка «Плейлисты» подгружается скриптом, обычный запрос отдаёт
// пустую заготовку. Запуск: node scripts/yt-playlists.mjs (в папке tiankami-site).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "..", "src", "data", "youtube-playlists.json");

const CHANNEL = process.env.YT_CHANNEL || "https://www.youtube.com/@tiankami/playlists";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

await page.goto(CHANNEL, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(5000);
for (let i = 0; i < 5; i++) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1200);
}

// Сначала пробуем вытащить названия из данных страницы — так быстрее всего.
let ids = await page.evaluate(() => {
  const out = [];
  const seen = new Set();
  for (const a of document.querySelectorAll('a[href*="/playlist?list="]')) {
    const m = /list=([\w-]+)/.exec(a.getAttribute("href") || "");
    if (m && !seen.has(m[1])) { seen.add(m[1]); out.push(m[1]); }
  }
  return out;
});

const playlists = [];
for (const id of ids) {
  await page.goto(`https://www.youtube.com/playlist?list=${id}`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForTimeout(1500);
  const title = await page.evaluate(() =>
    document.title.replace(/\s-\s*YouTube$/i, "").trim()
  );
  if (title) playlists.push({ id, title });
  console.log(`  ${id} :: ${title}`);
}

playlists.sort((a, b) => a.title.localeCompare(b.title, "ru"));
fs.writeFileSync(OUT, JSON.stringify(playlists, null, 1));
console.log(`\n✔ плейлистов: ${playlists.length} → ${path.relative(process.cwd(), OUT)}`);

await browser.close();
