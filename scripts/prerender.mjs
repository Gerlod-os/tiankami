// SEO-пререндер всех страниц (~440+): игры, подборки, статические.
// + sitemap.xml + robots.txt. Запускается после `vite build`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const SITE = "https://tiankami.vercel.app";

if (!fs.existsSync(path.join(DIST, "index.html"))) {
  console.error("❌ dist/index.html не найден — сначала выполни `vite build`.");
  process.exit(1);
}

console.log("▸ Собираю SSR-бандл…");
await build({
  configFile: path.join(ROOT, "vite.config.js"),
  logLevel: "warn",
  build: { ssr: "src/entry-server.jsx", outDir: "dist-server", emptyOutDir: true },
});

const { render } = await import(
  pathToFileURL(path.join(ROOT, "dist-server", "entry-server.js")).href +
    `?t=${Date.now()}`
);

const games = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src/data/games.json"), "utf8")
);
const collections = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src/data/collections.json"), "utf8")
);

// «Чистый» шаблон из свежего клиентского билда (копируем ДО перезаписи страниц)
let templateSrc = fs.readFileSync(path.join(DIST, "index.html"), "utf8");

// Вставка A: render-blocking CSS вшиваем в <head> инлайном
templateSrc = templateSrc.replace(
  /<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g,
  (m, href) => {
    const css = fs.readFileSync(path.join(DIST, href), "utf8");
    return `<style data-build="${href.replace(/^\//, "")}">${css}</style>`;
  }
);

// Вставка B: preload критичных вебшрифтов (кириллица+латиница, без -ext)
const FONT_PRELOAD_PREFIXES = [
  "nunito-cyrillic-wght-",
  "inter-cyrillic-wght-",
  "unbounded-cyrillic-wght-",
  "nunito-latin-wght-",
  "inter-latin-wght-",
  "unbounded-latin-wght-",
  "cinzel-latin-700-",
];
const fontPreloads = fs
  .readdirSync(path.join(DIST, "assets"))
  .filter((f) => f.endsWith(".woff2") && FONT_PRELOAD_PREFIXES.some((p) => f.startsWith(p)))
  .map((f) => `<link rel="preload" as="font" type="font/woff2" crossorigin href="/assets/${f}"/>`)
  .join("");
if (fontPreloads) {
  templateSrc = templateSrc.replace("<!--ssr-head-->", `${fontPreloads}\n    <!--ssr-head-->`);
}

const TEMPLATE_FILE = path.join(ROOT, ".prerender-template.html");
fs.writeFileSync(TEMPLATE_FILE, templateSrc);
const template = templateSrc;

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function setMetaTag(page, selector, replacement) {
  const re = new RegExp(selector, "i");
  if (re.test(page)) return page.replace(re, replacement);
  return page.replace("<!--ssr-head-->", replacement + "\n    <!--ssr-head-->");
}

function headFor(pathname) {
  const base = {
    title: "Tiankami — каталог рогаликов",
    description:
      "Уютный хардкор: каталог рогаликов стримера Tiankami — оценки, часы, статусы прохождений, подборки и расписание стримов.",
    image: "/img/og.png",
    type: "website",
  };
  if (pathname === "/catalog")
    return { ...base, title: "Каталог рогаликов — Tiankami" };
  if (pathname === "/collections")
    return { ...base, title: "Подборки от Тиана — Tiankami" };
  if (pathname === "/about") return { ...base, title: "Обо мне — Tiankami" };
  if (pathname === "/mi")
    return { ...base, title: "Мастер Игорей — Tiankami", description: "Мастер Игорей: соревнование стримеров по рогаликам. Игры-участники, выпуски и кубки." };
  if (pathname === "/schedule")
    return { ...base, title: "Расписание стримов — Tiankami" };
  if (pathname.startsWith("/collections/")) {
    const c = collections.find((x) => x.slug === pathname.slice("/collections/".length));
    if (c)
      return {
        ...base,
        title: `${c.name} — подборка от Тиана | Tiankami`,
        description: c.description || `Подборка «${c.name}»: ${c.games.length} игр от стримера Tiankami.`,
      };
  }
  if (pathname.startsWith("/catalog/")) {
    const g = games.find((x) => x.slug === pathname.slice("/catalog/".length));
    if (g)
      return {
        title: `${g.title} — ${g.status || "рогалик"} | Tiankami`,
        description: `${g.genre || "Рогалик"}${g.setting ? ` · ${g.setting}` : ""}. Оценка Тиана: ${g.rating || "—"}/10, наиграно ${g.hours || "—"} ч. ${String(g.notes || "").slice(0, 140)}`,
        image: g.image || "/img/og.png",
        type: "article",
      };
  }
  return base;
}

function buildPage(pathname) {
  const html = render(pathname);
  const head = headFor(pathname);
  const ogImage = /^https?:/i.test(head.image) ? head.image : SITE + head.image;

  let page = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(head.title)}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
      `<meta name="description" content="${esc(head.description)}" />
    `
    );
  page = setMetaTag(page, '<meta\\s+property="og:title"[^>]*\\/?>', `<meta property="og:title" content="${esc(head.title)}" />`);
  page = setMetaTag(page, '<meta\\s+property="og:description"[^>]*\\/?>', `<meta property="og:description" content="${esc(head.description)}" />`);
  page = setMetaTag(page, '<meta\\s+property="og:url"[^>]*\\/?>', `<meta property="og:url" content="${SITE}${pathname === "/" ? "/" : pathname}" />`);
  page = setMetaTag(page, '<meta\\s+property="og:type"[^>]*\\/?>', `<meta property="og:type" content="${head.type}" />`);
  page = setMetaTag(page, '<meta\\s+property="og:image"[^>]*\\/?>', `<meta property="og:image" content="${esc(ogImage)}" />`);
  page = page.replace(
    "<!--ssr-head-->",
    `<link rel="canonical" href="${SITE}${pathname === "/" ? "/" : pathname}" />`
  );
  // Vite 8 инжектит preload-ссылки внутрь #root — вырезаем их (иначе hydration
  // mismatch), в «чистом» шаблоне внутри #root нет вложенных div, первое </div> — корневое.
  page = page.replace(
    /<div id="root">[\s\S]*?<\/div>/,
    () => `<div id="root">${html}</div>`
  );
  return page;
}

function fileFor(pathname) {
  if (pathname === "/") return path.join(DIST, "index.html");
  return path.join(DIST, `${pathname.slice(1)}.html`);
}

const routes = [
  "/",
  "/catalog",
  "/collections",
  "/about",
  "/schedule",
  "/mi",
  ...collections.map((c) => `/collections/${c.slug}`),
  ...games.map((g) => `/catalog/${g.slug}`),
];

console.log(`▸ Пререндер ${routes.length} страниц…`);
const t0 = Date.now();
let done = 0;
for (const route of routes) {
  try {
    const page = buildPage(route);
    const file = fileFor(route);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, page);
    done++;
  } catch (e) {
    console.warn(`  ⚠ ${route}: ${e.message}`);
  }
}
console.log(`  ✔ страниц: ${done}/${routes.length} за ${((Date.now() - t0) / 1000).toFixed(1)}s`);

// ── sitemap.xml + robots.txt ─────────────────────────────────────────────────
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...routes.map(
    (r) =>
      `  <url><loc>${SITE}${r === "/" ? "/" : r}</loc><changefreq>${r.startsWith("/catalog/") ? "weekly" : "daily"}</changefreq></url>`
  ),
  "</urlset>",
].join("\n");
fs.writeFileSync(path.join(DIST, "sitemap.xml"), sitemap);
fs.writeFileSync(
  path.join(DIST, "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`
);
console.log("✅ sitemap.xml и robots.txt готовы.");
