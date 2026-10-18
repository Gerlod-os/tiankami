# 🥐 TianKami — каталог рогаликов

Уютный хардкор: сайт-каталог рогаликов Twitch-канала **Tiankami** — база из ~441 игры
с оценками, часами, статусами прохождений, подборками от Тиана и расписанием стримов.

Действующий оригинал: https://tiankami.vercel.app

---

## 📚 Документация

| Файл                         | Для чего                                                            |
| ---------------------------- | ------------------------------------------------------------------- |
| `README.md`                  | Этот файл: быстрый старт, стек, архитектура, дизайн-система         |
| `ПОЛНОЕ_ОПИСАНИЕ_ПРОЕКТА.md` | Полное техническое описание: все страницы, компоненты, утилиты, API |
| `PLAN.md`                    | План задач с прогрессом (что сделано, что отложено)                 |
| `CHANGELOG.md`               | Дневник изменений                                                   |
| `дизайн.md`                  | Заметки дизайнера: базовый чек-лист улучшений                       |
| `PROJECT_BRIEF.md`           | Сжатый бриф проекта на 1 страницу                                   |

---

## Стек

- **React 19 + Vite 8 (rolldown) + Tailwind CSS v3**
- react-router-dom v7 (SPA + StaticRouter для пререндера)
- PapaParse (TSV/CSV из Google Sheets)
- vitest (49 тестов), oxlint
- Vercel (хостинг + serverless `/api/schedule`)

## Быстрый старт

```bash
npm install
npm run dev          # http://localhost:5173
```

## Продакшен-сборка

```bash
npm run build
# = npm run sync      → Google Sheets → src/data/*.json
# + vite build        → dist/
# + prerender.mjs     → 450+ статичных SEO-страниц + sitemap.xml + robots.txt
npm run preview      # локальная проверка dist/
```

## Скрипты

| Команда              | Что делает                                                                                                      |
| -------------------- | --------------------------------------------------------------------------------------------------------------- |
| `npm run sync`       | Скачивает «Все рогалики» (TSV), гиперссылки из Копии (Sheets API), «Подборки», «Расписание» → `src/data/*.json` |
| `npm run build`      | sync → vite build → SEO-пререндер                                                                               |
| `npm run build:fast` | Быстрая сборка без sync (если данные уже есть)                                                                  |
| `npm run lint`       | oxlint                                                                                                          |
| `npm test`           | vitest, 49 тестов                                                                                               |

## Ключевые правила

- **Steam API не дёргаем** — обложки только с CDN: `cdn.cloudflare.steamstatic.com/steam/apps/{appId}/header.jpg`.
- **noembed ≤ 20 запросов за сессию** (проверка авторства YouTube), кэш бессрочный.
- Twitch-статус — кэш 5 мин, аватар — 24 ч (decapi, без ключей).
- Подборки парсятся **построчно** (колонки «гуляют»).
- Даты — только `parseRuDate` (DD.MM.YYYY / YYYY-MM-DD).
- `manualChunks` — только функцией (Vite 8 = rolldown).
- Google Fonts не используем: Nunito/Inter самохостятся через `@fontsource-variable` (работает в РФ).
- **SSR детерминирован** — рандом только после mount на клиенте.

## Структура

```
src/
  components/  Layout, GameCard, GameDetails, GameModal, FxPanel,
               TwitchHeaderWidget, TwitchWidgetInHero, YandexMetrika,
               ScheduleForm, ErrorBoundary, DataProvider,
               CatchOfDay, RarityEgg, MITrophy, CollectionIcon, CoverFan, Highlight
  config/      branding.js, dataSources.js, mascots.js
  data/        games.json, collections.json, schedule.json (генерируются sync)
  pages/       Home, Catalog, Collections, Collection, Game, About, Schedule, MI
  utils/       loadData (SWR), normalize, date, slugify, storage, youtube,
               useCounter, usePageMeta, stats, recommend, statusMeta, youtubeSafe
api/           schedule.js — Vercel serverless-прокси формы расписания
scripts/       sync-data.js, prerender.mjs
```

## Дизайн-система v2 «5 сфер» (единый стиль)

Все «сферы» говорят на одном пастельном языке темы «уютный хардкор»:

| Сфера          | Выражение                                                                                                                               | Палитра             |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| 🔥 Антиматерия | частицы FxPanel: столкновение → вспышка → возрождение через 2с; репульсия от курсора; звёздная пыль с параллаксом                       | pink/purple/blue    |
| 🔥 Драконы     | система редкости: 5 драконьих яиц (common→mythic) на карточках, в подборках и на странице игры; «ЗОЛОТОЙ СПИСОК» — gold-card с тёплым градиентом | amber (золото)      |
| ⭐ Рыбалка     | «Улов дня»: кнопка подсечки, spring-анимация карточки, брызги, SVG-волны                                                                | blue                |
| 💀 Смерть      | черепа сложности 💀/💀💀/💀💀💀; Cinzel + красное свечение только у хардкора (8+)                                                       | rose (семантически) |
| 💡 ИИ          | рекомендации по особенностям→жанру→сеттингу; mood-теги 🧘/⚡/🧠; мгновенный поиск с категориями и подсветкой                            | mint                |

Единые правила: общие классы `.card/.chip/.btn-*`, одна spring-кривая
`cubic-bezier(0.34,1.56,0.64,1)` для «живого», stagger 0.05s для сеток,
всё отключается при `prefers-reduced-motion` и кнопкой ✨.

Фичи: чат-заметки «После забега | (типо чат)», кубок МИ 🏆 (только у
участников), countdown до стрима,
клавиша `/` — поиск, `Esc` — модалка, Konami code → 🥐 режим кроассана.
Аватар в Twitch-виджете — точная копия с Twitch (decapi, кэш 24ч).

## Редизайн v3 (филигранный)

- **Аватар** — точная копия с Twitch (webp 14КБ): шапка, hero 320px с белой
  обводкой 4px, футер, favicon, og.
- **Hero**: обложка последней игры справа на фоне, без blur, opacity 50%,
  mask-gradient вправо; статистика — градиентные цифры с glow (4 палитры), glass.
- **Карточки**: яйцо редкости 40px сверху справа над карточкой, hover поднимает
  всю карточку и светится цветом редкости; обложка не зумится.
- **Каталог**: поиск 64px glass, iOS-switch «кубок МИ», кастомные селекты с
  иконками, жанры ≤2 в ряд, панель сворачивается по Esc/клику вне/скроллу,
  пустое состояние — грустный чиби-Сайтама + рандомная фраза (client-only).
- **Страница игры**: hero 70% — обложка в окне 80% + фон 120% с mask вниз;
  Steam-кнопка во всю ширину (градиент #667eea→#764ba2); метаданные кликабельны
  (жанр → `/catalog?genre=`, сеттинг → `/catalog?q=`); шкалы с shine и иконками
  уровней (⭐🌟💫 / 😌😐💀 / 🌱🌿🌳); чат «После забега» в цвете редкости со
  скроллом; карусель похожих со стрелками/клавиатурой и глубиной.
- **Подборки**: веер реальных обложек (hover расходятся), SVG-иконки по типу,
  золотой список — Cinzel + шиммер.
- **/mi**: страница «Мастер Игорей» — CSS-3D кубок, игры с МИ из таблицы,
  выпуски по ссылкам `miVideo`; состав участников не выдумывается.
- **Motion**: warp-вспышка при переходах (не блокирует), domino-stagger секций,
  кнопки 4 hover-эффекта, логотип-кроассан флипается по клику (Backpack Battles),
  Konami → режим кроассана. Всё гаснет при `prefers-reduced-motion`.
- **Мобайл**: бургер-меню slide-in, адаптивный hero, touch-friendly 44px.

### Lighthouse-оптимизации (из отчёта, применены)

`idle.js` (afterLoad): Метрика/Twitch/SWR/FxPanel вне критического пути;
papaparse — dynamic import; preconnect steamstatic/jtvnw; пререндер вшивает CSS
инлайном + preload 5 кириллических/латинских шрифтов; logo.webp + favicon 32px.

### 10 рисков редизайна и 3 закрытых (см. историю разработки)

Закрыты: (1) SSR-детерминизм — весь рандом только в эффектах; (2) перф-гард —
адаптивные частицы, без 3D-библиотек, idle-запуск; (3) touch/a11y — hover-модалки
убраны в пользу клика, бургер, aria-атрибуты, фокус-стили, overflow-x-clip.

## SEO

Пререндер генерирует статичный HTML для каждой игры (`/catalog/:slug`),
подборки и статических страниц: уникальные `<title>`, `description`,
`og:image` (обложка Steam), `canonical`. Плюс `sitemap.xml` (~452 URL) и `robots.txt`.
На Vercel `cleanUrls: true` отдаёт эти файлы по «красивым» путям,
а SPA-rewrite ловит всё остальное.

## .env

**Не нужен.** Ни сборке, ни синхронизации ключи Google больше не требуются:
ссылки Steam/YouTube/МИ приезжают из xlsx-выгрузки таблицы (она публичная),
обложки — из самой таблицы и `src/data/steam-overrides.json`.
Старые ключи `VITE_SHEETS_API_KEY` и `SHEETS_API_KEY_SERVER` можно удалить из `.env`
и из секретов репозитория.

## Как сменить Google Таблицу

1. Открой свою таблицу → «Файл» → «Сведения» → скопируй ID из URL (часть между `/d/` и `/edit`).
2. В `src/config/dataSources.js` замени `SPREADSHEET_ID` (ID оригинала, откуда сайт берёт TSV).
3. Создай **копию** таблицы и в `scripts/sync-data.js` замени `COPY_SPREADSHEET_ID`.
4. Проверь `GAMES_SHEET_NAME` и `COLLECTIONS_SHEET_NAME` (точные имена листов).
5. Сделай `npm run sync` и проверь `src/data/*.json`.
6. Старый кэш у посетителей сбросится сам — ключи кэша привязаны к ссылке таблицы.

## API-ключ Google

**Не требуется.** Ссылки Steam/YouTube/МИ синхронизация забирает из xlsx-выгрузки
таблицы (`format=xlsx`), где они лежат в `<hyperlink>`; выгрузка публичная.
Ключ Sheets API пробовали раньше — браузерный получал 403 по referrer и лежал
в публичном бандле, серверный в Actions тоже не срабатывал. Убрано 17–18.10.2026.

## Как передать сайт другому человеку

Все личные данные — в **`src/config/branding.js`**:

1. Поменять значения на свои.
2. Заменить `SPREADSHEET_ID` в `dataSources.js` на свою таблицу.
3. Создать копию, установить Apps Script, заменить `COPY_SPREADSHEET_ID` в `scripts/sync-data.js`.
4. Создать API-ключ (см. раздел выше).
5. Обновить `src/data/*.json` через `npm run sync`.

## Яндекс.Метрика

Счётчик `112105255` подключается компонентом `YandexMetrika` (только в браузере).
