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
- PapaParse (TSV/CSV из Google Sheets)
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
npm run audit        # браузерный аудит 16 страниц (собирает preview сам)
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

**Локальная оговорка.** Защита среды от массового удаления (сторож: больше 50 удалённых файлов за сессию) останавливает локальный `npm run build` в двух местах — на чистке `dist/catalog` (сотни файлов) и `dist-server`. Обход: убрать старый каталог в сторону и брать оставшиеся шаги по отдельности:

```bash
mv dist dist-old          # или: mv dist-server dist-server-old
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
| `npm run audit` | Браузерный аудит: LCP/CLS, битые картинки, тап-таргеты, консоль |

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
               check-data.mjs, audit.mjs
```

Формы расписания на сайте нет: таблицу-приёмник расписания владелец не заполняет, расписание собирается из календаря и истории трансляций Twitch.

---

## Дизайн-система «уютный хардкор»

Единый пастельный язык темы: общие классы `.card/.chip/.btn-*`, одна spring-кривая `cubic-bezier(0.34,1.56,0.64,1)` для «живого», stagger 0.05s для сеток, всё отключается при `prefers-reduced-motion` и кнопкой ✨.

- **Редкость**: 5 драконьих яиц (common→mythic) на карточках, в подборках и на странице игры; «ЗОЛОТОЙ СПИСОК» — gold-card с тёплым градиентом.
- **Смерть**: черепа сложности 💀/💀💀/💀💀💀; красное свечение в заголовке у хардкора (8+).
- **Рыбалка**: «Улов дня» — кнопка подсечки, spring-анимация, SVG-волны.
- **ИИ**: рекомендации «похожих» по особенностям→жанру→сеттингу, mood-теги, поиск с подсветкой и категориями.
- **Страница игры**: hero с обложкой, шкалы оценок/сложности/прогресса, блок «Впечатления Тиана» (колонка «Примечания» из таблицы), плеер YouTube по клику.
- **Каталог**: фильтры и поиск живут в адресе страницы (ссылку на выборку можно переслать), номера страниц — настоящие ссылки.

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
