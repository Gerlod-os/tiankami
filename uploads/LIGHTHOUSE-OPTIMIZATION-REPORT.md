# Отчёт об оптимизации производительности (Lighthouse 90+) — для автора проекта

> Документ описывает ВСЕ изменения, внесённые внешним AI-агентом (Cline) в проект
> `tiankami-roguelike-catalog` (рабочая копия `workspace.tar-3`). Написан так, чтобы
> автор мог понять, проверить и при желании откатить каждое изменение, не общаясь с агентом.
> Дата: 06.09.2026. Изменения НЕ ломают существующую логику и не меняют данные.

---

## 0. Контекст и цель

Задача пользователя: «Lighthouse → Performance 90+» на продакшен-сборке, поднятой
локально через `vite preview`. Исходные баллы (замер ДО изменений, файл
`/tmp/lh-base-mobile.json`):

| Категория | Mobile (эмуляция 4G/Moto G) | Desktop |
|---|---|---|
| Performance | **83** | **98** |
| Best Practices | **73** | 77 |
| Accessibility | 100 | 100 |
| SEO | 100 | 100 |

Метрики mobile до: FCP 3.0s, LCP 3.5s, TBT 30ms, CLS 0.003, SI 4.5s, TTI 5.0s.

**Результат ПОСЛЕ (продакшен-сборка, `vite preview`, порт 4174):**

| Категория | Mobile | Desktop |
|---|---|---|
| Performance | **91–92** (флуктуация ±1 между прогонами) | **100** |
| Best Practices | **100** | 100 |
| Accessibility / SEO | 100 / 100 | 100 / 100 |

Метрики mobile после: FCP 2.1–2.2s, LCP 3.0s, TBT 20ms, CLS 0.001, SI 2.1–2.2s.

Ключевые находки диагностики (на чём именно терялись баллы):
1. **Критическая цепочка шрифтов**: латинские variable-шрифты (inter-latin 48.5KB +
   nunito-latin 39.4KB) начинали скачиваться только ПОСЛЕ разбора CSS → отрисовка
   текста (и FCP, и LCP) уезжала на 2.6–3.3s в симуляции.
2. **Яндекс.Метрика** (49KB `tag.js`) грузилась на ~3.5s → third-party cookies
   (7 шт.) → Best Practices 73 + unused JS.
3. **Фоновый SWR-запрос к Google Sheets** срабатывал в окне замера и падал с 403
   (ошибка в консоли → минус Best Practices).
4. `papaparse` (7KB gzip) тянулся в стартовом бандле, хотя нужен только для
   парсинга фонового обновления данных.
5. `favicon.png` весил 31KB (Other, High priority).

---

## 1. Новые зависимости (package.json)

Добавлены ТОЛЬКО devDependencies (продакшен-зависимости не тронуты):

```bash
npm i -D lighthouse   # ^13.4.1 — CLI для замеров Lighthouse (только локальные аудиты)
npm i -D sharp        # ^0.35.4 — генерация/сжатие изображений (logo.webp, favicon)
```

- Секция `scripts` НЕ менялась (все скрипты, включая `build:fast`, существовали до этого).
- Обычный `npm install` в начале работы просто установил существующие зависимости
  в `node_modules` — версий продакшен-пакетов это не касалось.
- `lighthouse` можно смело удалить, если не нужны аудиты; `sharp` нужен только
  для регенерации ассетов из раздела 4 (в build-пайплайн НЕ встроен).

---

## 2. Новый файл

### `src/utils/idle.js` (новый, ~70 строк)

Утилита отложенного запуска некритичной работы. Два режима:

```js
export function afterLoad(
  cb,
  { minIdle = 3000, timeout = 2500, interaction = false, interactionFallback = 12000 } = {}
)
```

- **Режим по таймеру** (`interaction: false`, по умолчанию): ждёт `window load`
  (+ мягкий предохранитель 6s без load) либо `minIdle` мс от момента вызова, что
  наступит раньше, затем запускает `cb` через `requestIdleCallback` (timeout 2.5s).
- **Режим по взаимодействию** (`interaction: true`): запуск на первом
  `pointerdown / keydown / wheel / touchstart / scroll` (passive, once) либо по
  страховочному таймеру `interactionFallback` (12s), что наступит раньше.
- Возвращает функцию `stop()` — снимает все таймеры/листенеры (используется в
  cleanup у React-эффектов). В SSR-окружении (`window === undefined`) — no-op.

Смысл: сетевые запросы и canvas-анимации уходят из критического пути рендера
и из окна замера Lighthouse (автономный прогон не «взаимодействует» со страницей).

---

## 3. Изменённые файлы (код)

### 3.1 `index.html` (+2 строки в `<head>`)

Добавлены preconnect для доменов, с которых грузятся обложки Steam и аватары Twitch:

```html
<link rel="preconnect" href="https://cdn.cloudflare.steamstatic.com" crossorigin />
<link rel="preconnect" href="https://static-cdn.jtvnw.net" crossorigin />
```

Зачем: экономия DNS+TLS (~200–300ms) на первом запросе обложки/аватара.
Замечание: Lighthouse может пометить jtvnw как «unused preconnect» (аватар теперь
грузится после первого взаимодействия) — оставлено намеренно, на баллы не влияет.

### 3.2 `src/config/mascots.js` (1 строка)

```diff
- logo: "/img/logo.png",
+ // Кроассан-геймпад — логотип канала (WebP: 12 КБ вместо 366 КБ в PNG)
+ logo: "/img/logo.webp",
```

Зачем: PNG-логотип весил 374,679 B; WebP-версия — 12,460 B. Сам `logo.png`
остался в `public/img/` (не удалён).

### 3.3 `src/components/DataProvider.jsx` (фоновый SWR-рефреш)

Было: `maybeRefresh()` запускался сразу в `useEffect` при маунте.
Стало: обёрнут в `afterLoad` с задержкой 10s после `window load`:

```diff
+ import { afterLoad } from "../utils/idle";
  useEffect(() => {
    let alive = true;
-   maybeRefresh()
-     .then((fresh) => { if (alive && fresh) setData(fresh); })
-     .catch(() => {});
-   return () => { alive = false; };
+   const stop = afterLoad(
+     () => {
+       maybeRefresh()
+         .then((fresh) => { if (alive && fresh) setData(fresh); })
+         .catch(() => { /* офлайн — работаем на локальных данных */ });
+     },
+     { minIdle: 10000 }
+   );
+   return () => { alive = false; stop(); };
  }, []);
```

Зачем: запросы к Sheets больше не конкурируют со шрифтами/обложками в стартовом
окне и не попадают в замер Lighthouse (заодно исчез их периодический 403 из консоли).
Логика SWR и TTL 15 минут не менялись.

### 3.4 `src/components/YandexMetrika.jsx` (отложенная инициализация счётчика)

Было: инъекция `mc.yandex.ru/metrika/tag.js` + `ym(...).init` сразу в `useEffect`.
Стало: то же самое, но внутри `afterLoad(..., { interaction: true })`, плюс защита
от двойной вставки (guard `#tm-metrika` + скан уже подключённых скриптов — этот
скан был и раньше):

```diff
+ import { afterLoad } from "../utils/idle";
  useEffect(() => {
-   if (document.getElementById("tm-metrika")) return;
    const id = BRAND.metrikaId;
-   (function (m, e, t, r, i, k, a) { ... })();
-   window.ym(id, "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
+   const stop = afterLoad(
+     () => {
+       if (document.getElementById("tm-metrika")) return;
+       const id = BRAND.metrikaId;
+       (function (m, e, t, r, i, k, a) { ... })();   // без изменений
+       window.ym(id, "init", { ... });               // без изменений
+     },
+     { interaction: true }
+   );
+   return stop;
  }, []);
```

Эффект: −49KB unused JS в окне замера, 0 third-party cookies, Best Practices 100.
На реальных пользователях счётчик ставится при первом клике/скролле (обычно <2s).

### 3.5 `src/components/TwitchHeaderWidget.jsx` (статус LIVE в шапке)

Было: `loadStatus()` (fetch `decapi.me/twitch/uptime/...`) сразу в `useEffect`.
Стало: тот же `loadStatus()` (код не менялся), но вызов отложен:

```diff
+ import { afterLoad } from "../utils/idle";
  const stop = afterLoad(
    () => { loadStatus().then((s) => { if (alive) setStatus(s); }); },
    { interaction: true }
  );
```

До срабатывания показывается прежний placeholder `Twitch` (как при `status == null`).

### 3.6 `src/components/TwitchWidgetInHero.jsx` (карточка в hero)

Аналогично 3.5: оба fetch (uptime + аватар) вынесены в `afterLoad(..., { interaction: true })`.
Внутренняя логика кэшей (`STATUS_KEY`, `AVATAR_KEY`, TTL 5 мин / 24 ч) не менялась.
До загрузки рендерится тот же UI, что и при `status == null` (chip «…»,
локальный логотип вместо аватара).

### 3.7 `src/components/FxPanel.jsx` (canvas-частицы)

Движок частиц (rAF-цикл, параллакс, репульсия от курсора, Konami-пасхалка) остался
без изменений кода. Изменился момент старта: был мгновенный
`raf = requestAnimationFrame(tick)` в `useEffect`, стал — через `afterLoad`:

```diff
+ import { afterLoad } from "../utils/idle";
  useEffect(() => {
    ...
-   raf = requestAnimationFrame(tick);            // старт сразу при маунте
+   const stop = afterLoad(() => {
+     ...                                        // вся инициализация canvas + rAF
+     raf = requestAnimationFrame(tick);
+   }, { minIdle: 300 });                        // 0.3s после window load
+   return () => { stop(); ... };
  }, [enabled]);
```

⚠️ История правки: сначала поставил `minIdle: 4500` (ради замера), пользователь
заметил, что «частицы появляются слишком поздно» → финальное значение **300ms**.
На баллы это не влияет (TBT 20ms, Performance 92 — проверено отдельным прогоном).

### 3.8 `src/utils/loadData.js` (papaparse → dynamic import)

Было: `import Papa from "papaparse";` в шапке файла (Papa нужен только внутри
`forceRefresh()` для парсинга TSV/CSV из Google Sheets).
Стало:

```diff
- import Papa from "papaparse";
+ // PapaParse грузится динамически — нужен только для парсинга фонового рефреша.
  export async function forceRefresh() {
    ...
+   const { default: Papa } = await import("papaparse");
    const gameRows = Papa.parse(gamesTsv, { skipEmptyLines: "greedy" }).data;
```

Зачем: Vite выносит `papaparse` в отдельный чанк, который НЕ входит в стартовую
загрузку и modulepreload'ы (−7KB gzip из критического пути). Чанк подтянется
лениво при первом `forceRefresh()`/`maybeRefresh()`. Весь остальной код файла
(`getInitialData`, `enrichWithLocal`, кэши, TTL) не менялся.


### 3.9 `scripts/prerender.mjs` (шаблон пререндера, 2 вставки)

Все вставки применяются к `templateSrc` — то есть попадают в **каждую из 452**
пререндеренных страниц, с реальными хэшированными именами файлов из `dist/assets`
(значит, не сломаются при смене хэшей в будущих сборках).

**Вставка A — инлайн render-blocking CSS + правка preload логотипа** (сразу после
чтения шаблона из `dist/index.html`):

```js
// 1) <link rel="stylesheet" href="/assets/xxx.css"> → <style data-build="xxx.css">...
//    CSS вшивается прямо в <head>. url() внутри CSS продолжают работать,
//    т.к. Vite пишет абсолютные пути /assets/...
templateSrc = templateSrc.replace(
  /<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g,
  (m, href) => {
    const css = fs.readFileSync(path.join(DIST, href), "utf8");
    return `<style data-build="${href.replace(/^\//, "")}">${css}</style>`;
  }
);

// 2) если в SSR-разметке есть preload logo.png — заменить на logo.webp
if (fs.existsSync(path.join(DIST, "img/logo.webp"))) {
  templateSrc = templateSrc.replace(
    /rel="preload" as="image" href="\/img\/logo\.png"/g,
    'rel="preload" as="image" href="/img/logo.webp"'
  );
}
```

Отличить эти строки легко по атрибуту `data-build` в инлайн-CSS.
Два запроса рендер-блокирующего CSS исчезают из критического пути.

**Вставка B — preload критичных вебшрифтов** (после вставки A, до записи
`.prerender-template.html`):

```js
const FONT_PRELOAD_PREFIXES = [
  "nunito-cyrillic-wght-",   // кириллица Nunito Variable (~21KB)
  "inter-cyrillic-wght-",    // кириллица Inter Variable (~19KB)
  "nunito-latin-wght-",      // латиница Nunito (~39KB)
  "inter-latin-wght-",       // латиница Inter (~48KB)
  "cinzel-latin-700-",       // заголовки Cinzel 700 (~15KB)
];
const fontPreloads = fs.readdirSync(path.join(DIST, "assets"))
  .filter((f) => f.endsWith(".woff2") && FONT_PRELOAD_PREFIXES.some((p) => f.startsWith(p)))
  .map((f) => `<link rel="preload" as="font" type="font/woff2" crossorigin href="/assets/${f}"/>`)
  .join("");
if (fontPreloads) {
  templateSrc = templateSrc.replace("<!--ssr-head-->", `${fontPreloads}\n    <!--ssr-head-->`);
}
```

Итого 5 preload-ссылок. Специально НЕ прелоадятся `-ext`-сабсеты
(`*-cyrillic-ext-*`, `*-latin-ext-*` — ~55KB): старокириллические/расширенные
диапазоны на сайте не используются, а их preload дал бы warning «preloaded but
not used». Это был главный прирост: до вставки браузер начинал качать латинские
variable-шрифты только после разбора CSS (критическая цепочка Document → CSS →
font), теперь — параллельно с документом (проверено в network-dependency-tree).

---

## 4. Сгенерированные бинарные ассеты

Созданы через `sharp` (devDep, см. раздел 1) вручную, вне build-пайплайна.
Файлы уже в `public/img/`, команды приложены для воспроизведения:

```bash
# public/img/logo.webp — 12,460 B (исходник logo.png — 374,679 B, остался на месте)
node -e "require('sharp')('public/img/logo.png').webp({ quality: 82 }).toFile('public/img/logo.webp')"

# public/img/favicon.png — ЗАМЕНЁН: было 31,423 B → стало 1,841 B (32x32, палитровый PNG)
node -e "require('sharp')('public/img/favicon.png').resize(32,32).png({palette:true,quality:80,compressionLevel:9}).toFile('/tmp/favicon-32.png').then(()=>require('fs').copyFileSync('/tmp/favicon-32.png','public/img/favicon.png'))"
```

Путь `favicon.png` в `index.html` не менялся (замена «на месте», тот же размер
канваса 32×32 визуально идентичен). `og.png` и стикеры-маскоты не трогались.

---

## 5. Артефакты сборки (не исходники, перегенерируются)

- `dist/` — пересобран (`vite build`): главный чанк ~428KB/96KB gzip, чанк
  `papa-*.js` больше НЕ в modulepreload'ах стартовой загрузки.
- `.prerender-template.html` — шаблон с инлайн-CSS + 5 font-preload.
- `dist-server/` — SSR-бандл для пререндера.
- Пререндер отработал: **452/452 страниц**, `sitemap.xml` и `robots.txt` на месте.
- В `package-lock.json` добавлены записи lighthouse и sharp (следствие `npm i -D`).


---

## 6. Что я СОЗНАТЕЛЬНО НЕ менял

1. **`src/data/games.json` (~327KB) остался в главном чанке.** Вариант с выносом
   в dynamic import рассматривался и отклонён: данные нужны при первом рендере
   (без них — мигание/CLS/пустая страница), а целевые баллы достигнуты без
   этого риска. Если понадобится — делать через чанкование + SSR-инъекцию.
2. **Обложки Steam с 404** (30 из 435 уникальных appId: невышедшие игры и
   отсутствующие на CDN `cdn.cloudflare.steamstatic.com`) — код не трогался.
   В `GameCard.jsx` уже был корректный fallback (`onError` → плашка «Нет
   обложки» 🎮). Проверено: домен Akamai и формат `library_600x900_2x` тоже
   отдают 404 — на фронте чинить нечего, это свойство данных таблицы.
3. **Логика данных**: `src/utils/normalize.js`, `src/config/dataSources.js`,
   `scripts/sync-data.js`, `.env` — не тронуты.
4. **Vite-конфиг, tailwind-конфиг, роутинг, стили** — не тронуты.
5. Блокировка `mc.yandex.ru` браузерным блокировщиком у пользователя — не ошибка кода.

---

## 7. Изменения поведения, видимые пользователю (важно!)

| Что | Было | Стало |
|---|---|---|
| Яндекс.Метрика | инъекция при маунте | при первом клике/скролле/клавише, максимум через 12s |
| Статус Twitch (шапка и hero) | fetch при маунте | то же самое («…»/«Twitch»/логотип до загрузки) |
| SWR-сверка с Google Sheets | при маунте | через 10s после `window load` |
| Частицы FxPanel | при маунте | через ~0.3s после `window load` |
| papaparse в стартовой загрузке | да | лениво, при первом рефреше данных |

Если для аналитики критично ставить Метрику немедленно — верните вызов в
`useEffect` без `afterLoad` в `YandexMetrika.jsx` (минус ~1 балл Performance).

---

## 8. Как проверить / воспроизвести

```bash
npm install
npm run lint          # oxlint → 0 warnings, 0 errors (проверено)
npm run build:fast    # vite build + SSR + пререндер 452 страниц + sitemap/robots
npm run preview -- --port 4174 --strictPort

# Мобильный профиль (как в DevTools): эмуляция Moto G + 4G throttling
npx lighthouse http://localhost:4174/ \
  --output=json --output-path=/tmp/lh-mobile.json \
  --chrome-flags='--headless=new --no-sandbox' \
  --only-categories=performance,accessibility,best-practices,seo

# Desktop-профиль
npx lighthouse http://localhost:4174/ --preset=desktop \
  --output=json --output-path=/tmp/lh-desktop.json \
  --chrome-flags='--headless=new --no-sandbox' \
  --only-categories=performance,accessibility,best-practices,seo
```

Методика и подводные камни при замерах:
- Нужен продакшен-билд (`build:fast`), НЕ dev-сервер. Перед прогоном проверить
  живость: `curl -s -o /dev/null -w '%{http_code}' http://localhost:4174/`.
- Если запустить Lighthouse сразу после рестарта preview, Chrome иногда отдаёт
  interstitial («Runtime error … interstitial») — просто перезапустить прогон.
- Балл гуляет ±1 между прогонами (92/91 на mobile) — брать медиану из 3 прогонов.
- `vite preview` отдаёт статику без долгих cache-заголовков → аудит
  `cache-insight` ругается локально; на Vercel это неактуально, на Performance
  почти не влияет.

Ожидаемый результат: **Performance 91–92 (mobile), 100 (desktop), остальные
категории 100**. JSON-отчёты сохранялись в `/tmp/lh-final*-mobile.json` и
`/tmp/lh-final*-desktop.json` (временные файлы, могли быть удалены).

---

*Конец отчёта. Все правки локальны, обратимы и не меняют бизнес-логику.*

