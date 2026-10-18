# 🥐 TianKami — каталог рогаликов

Уютный хардкор: сайт-каталог рогаликов Twitch-канала **Tiankami** — база более чем из 400 игр с оценками, часами, статусами прохождений, подборками от Тиана и расписанием стримов.

**Боевой сайт (продакшен):** https://gerlod-os.github.io/tiankami — собирается и выкладывается автоматически из ветки `main` через GitHub Actions (см. «Деплой»).

Домен tiankami.vercel.app — бывший хостинг, с него ушли 17–18.10.2026; выкладка туда больше не идёт, версия на нём устаревшая.

---

## 📚 Документация

| Файл | Для чего |
| --- | --- |
| `README.md` | Этот файл: быстрый старт, стек, деплой, правила |
| `CHANGELOG.md` | Дневник изменений |
| `../ОПИСАНИЕ-ПРОЕКТА.md` | Полный справочник по проекту (лежит рядом с папкой сайта) |
| `../ПЛАН-ДОРАБОТОК.md` | Журнал работ: что сделано, чем проверено |
| `../документы/` | Списки дел владельца (например, игры без ссылок YouTube) |

---

## Стек

- **React 19 + Vite 8 (rolldown) + Tailwind CSS v3**
- react-router-dom v7 (SPA + StaticRouter для пререндера)
- PapaParse — только в `scripts/sync-data.js` (разбор TSV таблицы); в браузерный бандл не попадает
- react-icons — иконки интерфейса (вместо эмодзи)
- vitest (больше сотни тестов), oxlint
- **GitHub Pages** — хостинг; GitHub Actions — сборка и выкладка

---

## Быстрый старт

```bash
npm install
npm run dev          # http://localhost:5173
```

Полный прогон проверок перед сдачей:

```bash
npm run lint         # oxlint — должен быть чистым
npm test             # vitest
npm run test:data    # гейт: формат и полнота src/data
npm run test:links   # гейт: битые внутренние ссылки по собранному dist/
npm run audit        # замер 8 страниц × 2 ширины; по умолчанию меряет ЖИВОЙ сайт
npm run audit -- --base http://localhost:4173/tiankami   # меряет локальную сборку
```

---

## Продакшен-сборка

```bash
npm run build
# = npm run sync      → Google Sheets → src/data/*.json (+ обложки, авторство YouTube)
# + vite build        → dist/
# + prerender.mjs     → статичные SEO-страницы + sitemap.xml + robots.txt
npm run preview      # локальная проверка dist/
```

**Локальная оговорка.** Защита среды от массового удаления (сторож: больше 50 удалённых файлов за сессию) останавливает локальную сборку в двух местах — на чистке `dist/catalog` (сотни файлов) и `dist-server` (68 файлов). Убирать в сторону нужно **оба** каталога, не «или»: если оставить `dist-server`, `prerender.mjs` падает на его чистке с `errors: [Getter/Setter]`.

```bash
mv dist dist-old
mv dist-server dist-server-old
npm run build:fast        # vite build
node scripts/prerender.mjs
```

На GitHub сторожа нет, `npm run build` проходит одной командой.

## Деплой

`.github/workflows/deploy.yml`:

- **push в `main`** → `npm ci` → `npm run build` → артефакт `dist` → `actions/deploy-pages@v4`.
- Ветки `gh-pages` нет: Pages работает через окружение `github-pages`, источник — сам workflow.
- Расписание `03:17 UTC` — суточная пересборка, чтобы данные из таблицы подтягивались без пуша. В публичном репозитории расписание само выключается после 60 дней без активности — если сайт перестал обновляться, запустить вручную (workflow_dispatch).
- Автодеплой тянет ключи только из публичной таблицы: всё, что нужно синку, открыто без ключей.

---

## Скрипты

| Команда | Что делает |
| --- | --- |
| `npm run sync` | Таблица → `src/data/*.json`: игры (TSV), ссылки Steam/YouTube/МИ (xlsx-гиперссылки), плейлисты канала, обложки Steam, проверка авторства YouTube |
| `npm run build` | sync → vite build → SEO-пререндер |
| `npm run build:fast` | Быстрая сборка без sync (если данные уже есть) |
| `npm run lint` | oxlint |
| `npm test` | vitest |
| `npm run test:data` | Гейт данных: заполненность полей, ссылки, форматы |
| `npm run test:links` | Гейт ссылок: обход 473 HTML в `dist/`, битые внутренние адреса → код 1 |
| `npm run audit` | Браузерный аудит 8 страниц × 2 ширины: LCP/CLS, битые картинки, тап-таргеты, консоль. По умолчанию меряет живой сайт, локальную сборку — через `--base` |

---

## Ключевые правила

- **Steam API не дёргаем ради обложек** — картинки берёт таблица; для игр без обложки `scripts/steam-covers.mjs` ищет страницу в Steam и **сверяет название** («Against the Dark Moon» не подставляется к «Against the Moon»). Псевдонимы — `src/data/steam-name-aliases.json`, споры решает `src/data/steam-overrides.json`.
- **Авторство YouTube проверяется на сборке** (`youtubeOwners.js`, один раз, ответы кэшируются в `youtube-owners.json`); в браузере запрос к noembed не уходит. Плейер грузится **по клику**, а не автозагрузкой.
- Twitch-статус — кэш 5 мин, аватар — 24 ч (decapi, без ключей).
- Подборки парсяются **построчно** (колонки «гуляют»).
- Даты — только `parseRuDate` (DD.MM.YYYY / YYYY-MM-DD).
- `manualChunks` — только функцией (Vite 8 = rolldown).
- Google Fonts не используем: Nunito/Inter/Unbounded самохостятся через `@fontsource-variable` (работает в РФ).
- **SSR детерминирован** — рандом только после mount на клиенте.
- Ссылки Steam/YouTube/МИ не зашиты в TSV (текст «Ссылка на плейлист»): выгрузка в TSV теряет гиперссылки, их берём из xlsx там же, без ключей.

---

## Структура

```
src/
  components/  Layout, GameCard, GameDetails, GameModal, FxPanel,
               TwitchHeaderWidget, TwitchWidgetInHero, LiveBanner,
               YandexMetrika, ErrorBoundary, DataProvider, CatchOfDay,
               RarityEgg, MITrophy, CollectionIcon, CoverFan, Highlight
  config/      branding.js, dataSources.js, mascots.js, site.js
  data/        games.json, collections.json, schedule.json (генерирует sync) +
               steam-overrides.json, steam-name-aliases.json,
               youtube-owners.json, youtube-playlists.json
  pages/       Home, Catalog, Game, Collections, Collection, About, Schedule, MI
  utils/       loadData (SWR), normalize, date, slugify, storage, youtube,
               youtubeOwners, useCounter, usePageMeta, stats, recommend,
               statusMeta, rarity, xlsx, playlists, ics, pagination,
               schedule, steam, streams, idle, jsonld
scripts/       sync-data.js, prerender.mjs, steam-covers.mjs, fix-covers.mjs,
               twitch-recent.mjs, twitch-schedule.mjs, yt-playlists.mjs,
               yt-videos.mjs (видео канала для игр без плейлиста),
               cut-white-bg.mjs (вырезание светлого фона из маскотов, флаг --cream),
               check-data.mjs, check-links.mjs, audit.mjs
```

Формы расписания на сайте нет: таблицу-приёмник расписания владелец не заполняет, расписание собирается из календаря и истории трансляций Twitch.

---

## Дизайн-система «уютный хардкор»

Единый пастельный язык темы: общие классы `.card/.chip/.btn-*`, одна spring-кривая `cubic-bezier(0.34,1.56,0.64,1)` для «живого», stagger 0.05s для сеток, всё отключается при `prefers-reduced-motion` и кнопкой ✨.

- **Редкость**: 5 драконьих яиц (common→mythic) на карточках, в подборках и на странице игры; «ЗОЛОТОЙ СПИСОК» — gold-card с тёплым градиентом.
- **Смерть**: черепа сложности (иконки FaSkull ×1–3); тёплое свечение в заголовке у хардкора (8+).
- **Рыбалка**: «Улов дня» — один заброс в сутки на браузер (ключ `tiankami_catch_YYYY-MM-DD`,
  дата местная), поплавок на леске, брызги, карточка пружиной. При `prefers-reduced-motion`
  улов показывается сразу.
- **Похожие игры**: веса жанр (5) → сеттинг (3) → тег (1, не больше трёх совпадений),
  перемешивания нет. Порядок проверен на 55 вампир-рогаликах: карточных в топ-6 было 10,
  стало 0.
- **Карточка игры**: яйцо редкости слева от названия, кубок МИ — под обложкой, над «Обзором».
- **Подборки и каталог**: подборка показывает превью игр карточками (у золотой — веер
  обложек); поиск, фильтры и сортировка стоят одной строкой, подсказки — одна непрозрачная
  панель без заголовков, совпадение подсвечено жёлтым.
- **Настроение**: `moodOf` даёт 5 меток (hardcore/mindfuck/intense/chill/casual) по оценке,
  сложности и часам — блок на странице игры.
- **Страница игры**: обложка слева + текст справа (steam-стиль), оценка крупно в правом
  углу с 1280, шкалы в колонке 448 px, мета сеткой 132px/1fr с одной иконкой,
  блок «Впечатления Тиана» над шкалами, постер YouTube из `i.ytimg.com`, плеер по клику.
- **Каталог**: фильтры и поиск живут в адресе страницы (ссылку на выборку можно
  переслать), свои выпадающие списки и направление сортировки `?dir=asc|desc`,
  номера страниц — настоящие ссылки, 24 карточки на страницу.
- **Иконки**: `react-icons`, цвет из палитры. Эмодзи в интерфейсе не осталось — проверено
  обходом DOM 18.10.2026; держатся только копирайтные 🥐 (заглушка обложки, экран сбоя,
  «режим кроассана» по Konami, текст расписания) и 🐱 в тексте про мемас.
  Эмоуты канала (14 штук по BTTV) в коде как иконки **не используются**: файлов в
  `public/img/emotes/` нет, подключение — отдельный шаг.

---

## SEO

Пререндер генерирует статичный HTML для каждой игры (`/catalog/:slug`), подборок и статических страниц: уникальные `<title>`, `description`, `og:image` (обложка), `canonical`. Плюс `sitemap.xml` (более 400 адресов, `lastmod` у страниц игр — дата прохождения) и `robots.txt`. F5 на любом адресе работает: все страницы — файлы на диске, не только SPA-роуты.

---

## Данные и ключи

- **`.env` не нужен и ключи не требуются.** Ссылки Steam/YouTube/МИ приезжают из xlsx-выгрузки таблицы (она публичная), обложки — из таблицы + поиск Steam по названию. Ключи `VITE_SHEETS_API_KEY` / `SHEETS_API_KEY_SERVER` мертвы, из workflow удалены; в локальном `.env` (который в git не попадает) можно подчистить.
- Источник данных — Google Таблица. Если ссылка сломается, sync не трогает прежние `src/data/*.json`, сайт продолжает работать на последнем удачном слепке.

## Как сменить Google Таблицу

1. Открой свою таблицу → «Файл» → «Сведения» → скопируй ID из URL (часть между `/d/` и `/edit`).
2. В `src/config/dataSources.js` замени `SPREADSHEET_ID` (основная таблица: TSV игр + xlsx-ссылки).
3. Проверь `GAMES_SHEET_NAME` и `COLLECTIONS_SHEET_NAME` (точные имена листов).
4. Сделай `npm run sync` и проверь `src/data/*.json` — они и есть точка правды.

## Яндекс.Метрика

Счётчик `112105255` подключается компонентом `YandexMetrika` (только в браузере).
