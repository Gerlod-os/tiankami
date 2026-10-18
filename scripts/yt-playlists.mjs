// Обновление списка плейлистов канала YouTube → src/data/youtube-playlists.json.
// Запуск: node scripts/yt-playlists.mjs (в папке tiankami-site).
//
// Как собираем: открываем вкладку «Плейлисты» в браузере (страница сама тянет
// скрипт, обычный запрос отдаёт пустую заготовку) и дальше ходим во внутренний
// API YouTube (`youtubei/v1/browse`) по continuation-токену из `ytInitialData`.
//
// Почему так, а не прокрутка: прокрутка DOM показывала только первые 30
// плейлистов — продолжение YouTube подгружает через внутренний API, и с паузой
// 1.2 с оно не успевало. Замер 18.10.2026: в DOM 30 плейлистов, через API — 612.
// Разница для сайта огромная: у большинства игр ссылка не подставлялась, потому что
// плейлиста просто не было в собранном списке.
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
await page.waitForTimeout(4000);

const collected = await page.evaluate(async () => {
  const key = window.ytcfg?.data_?.INNERTUBE_API_KEY;
  const ver = window.ytcfg?.data_?.INNERTUBE_CONTEXT?.client?.clientVersion;
  const ctx = { context: { client: { clientName: "WEB", clientVersion: ver, hl: "ru" } } };
  const items = new Map();

  const add = (lv) => {
    if (!lv?.contentId) return;
    const title =
      lv.metadata?.lockupMetadataViewModel?.title?.content ||
      lv.title?.simpleText ||
      "";
    if (title) items.set(lv.contentId, title);
  };

  // Первая страница: элементы лежат в разметке ответа, ещё без lockupViewModel.
  const fromDom = () => {
    for (const a of document.querySelectorAll('a[href*="/playlist?list="]')) {
      const m = /list=([\w-]+)/.exec(a.getAttribute("href") || "");
      const card = a.closest("yt-lockup-view-model, ytd-grid-playlist-renderer, ytd-playlist-renderer");
      const txt = (card?.innerText || "").replace(/\s+/g, " ");
      const title = txt.split("|")[1]?.trim();
      if (m && title) items.set(m[1], title);
    }
  };
  fromDom();

  const firstToken = () => {
    let t = null;
    const walk = (o) => {
      if (!o || typeof o !== "object" || t) return;
      if (o.continuationCommand?.token) t = o.continuationCommand.token;
      else for (const k in o) walk(o[k]);
    };
    walk(window.ytInitialData);
    return t;
  };

  let next = firstToken();
  let calls = 0;
  while (next && calls < 200) {
    calls += 1;
    const r = await fetch("/youtubei/v1/browse?key=" + key, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...ctx, continuation: next }),
    });
    const j = await r.json();
    const list = j.onResponseReceivedActions?.[0]?.appendContinuationItemsAction?.continuationItems || [];
    for (const it of list) add(it.lockupViewModel);
    let t = null;
    const walk = (o) => {
      if (!o || typeof o !== "object" || t) return;
      if (o.continuationCommand?.token) t = o.continuationCommand.token;
      else for (const k in o) walk(o[k]);
    };
    walk(j);
    next = t;
    if (!list.length) break;
  }

  return { playlists: [...items.entries()].map(([id, title]) => ({ id, title })), calls };
});

const playlists = collected.playlists
  .filter((p) => p.id && p.title)
  .sort((a, b) => a.title.localeCompare(b.title, "ru"));
fs.writeFileSync(OUT, JSON.stringify(playlists, null, 1));
console.log(
  `✔ плейлистов: ${playlists.length} (вызовов API: ${collected.calls}) → ${path.relative(process.cwd(), OUT)}`,
);
console.log(`  MINOS: ${playlists.find((p) => /^minos$/i.test(p.title))?.id || "нет"}`);

await browser.close();
