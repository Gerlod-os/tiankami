# 📋 PROJECT BRIEF — Tiankami

## Что это

Сайт-каталог рогаликов Twitch-канала **Tiankami** (~441 игра).
Данные из Google Таблиц, деплой на Vercel.

## Цель

Уютный, быстрый, SEO-оптимизированный каталог с оценками, статусами, подборками и расписанием стримов.

---

## Стек

| Слой | Технология |
|------|-----------|
| Фреймворк | React 19 + Vite 8 (rolldown) |
| Стили | Tailwind CSS v3 (кастомные токены) |
| Роутинг | react-router-dom v7 (SPA + StaticRouter) |
| Данные | Google Sheets (TSV) → JSON → React Context |
| Сборка | Prerender 450+ SEO-страниц |
| Тесты | vitest (49 тестов) |
| Линтер | oxlint |
| Хостинг | Vercel (free tier) |

---

## Архитектура

```
Google Sheets (TSV)
    ↓ npm run sync
src/data/*.json (games, collections, schedule)
    ↓ import
DataProvider (React Context)
    ↓ useData()
Страницы → Компоненты
```

### Страницы (7)

| Страница | Путь | Описание |
|----------|------|----------|
| Главная | `/` | Hero, статистика, улов дня, подборки, топ игр |
| Каталог | `/catalog` | Поиск, фильтры, пагинация |
| Игра | `/catalog/:slug` | Hero, детали, похожие игры |
| Подборки | `/collections` | Список всех подборок |
| Подборка | `/collections/:slug` | Игры с рангами |
| Обо мне | `/about` | Био, поддержка, MEME ALERTS |
| Расписание | `/schedule` | Ближайшие/прошедшие стримы |
| МИ | `/mi` | Мастер Игорей: игры, выпуски |

---

## Данные

### Источники

1. **Оригинал** — TSV «Все рогалики» + «Подборки»
2. **Копия** — гиперссылки через Sheets API
3. **Расписание** — отдельный лист

### Ключевые правила

- **Steam API не дёргаем** — обложки только с CDN
- **noembed ≤ 20 запросов/сессия** — проверка YouTube
- **Twitch-статус** — кэш 5 мин
- **Подборки парсятся построчно** — колонки «гуляют»
- **Даты** — только `parseRuDate` (DD.MM.YYYY / YYYY-MM-DD)
- **manualChunks** — только функцией (Vite 8 = rolldown)
- **Google Fonts не используем** — шрифты через @fontsource
- **SSR детерминирован** — рандом только после mount

---

## Дизайн-система

### 5 сфер

| Сфера | Палитра | Выражение |
|-------|---------|-----------|
| 🔥 Антиматерия | pink/purple/blue | Частицы FxPanel, вспышки |
| 🔥 Драконы | amber | Редкость 5 уровней, gold-card |
| ⭐ Рыбалка | blue | Улов дня, волны, брызги |
| 💀 Смерть | rose | Черепа сложности, Cinzel |
| 💡 ИИ | mint | Рекомендации, mood-теги |

### Правила

- Единые классы: `.card`, `.chip`, `.btn-*`
- Spring-кривая: `cubic-bezier(0.34,1.56,0.64,1)`
- Stagger: 0.05s для сеток
- Отключается при `prefers-reduced-motion`

---

## Быстрый старт

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # sync + vite + prerender
npm run lint         # oxlint
npm test             # vitest
```

---

## Деплой

- **Платформа:** Vercel
- **URL:** https://tiankami.vercel.app
- **Конфиг:** `vercel.json` (serverless functions, redirects)
- **Build:** `npm run build`

---

## Ключевые файлы

| Файл | Назначение |
|------|-----------|
| `src/App.jsx` | Роутинг (7 страниц + 404) |
| `src/components/Layout.jsx` | Хедер + навигация + футер |
| `src/components/DataProvider.jsx` | Context API: games, collections, schedule |
| `src/utils/normalize.js` | Парсинг TSV, слоган, хелперы |
| `src/utils/rarity.js` | Система редкости 5 уровней |
| `scripts/sync-data.js` | Загрузка из Google Sheets |
| `scripts/prerender.mjs` | SEO-пререндер 450+ страниц |

---

## Документация проекта

| Файл | Содержание |
|------|-----------|
| `README.md` | Полный readme: стек, архитектура, дизайн-система |
| `ПОЛНОЕ_ОПИСАНИЕ_ПРОЕКТА.md` | Техническое описание: все страницы, компоненты, утилиты |
| `PLAN.md` | План задач с прогрессом |
| `CHANGELOG.md` | Дневник изменений |
| `дизайн.md` | Заметки дизайнера (базовый чек-лист) |

---

**Автор:** Сергей (Тиан)  
**Twitch:** https://twitch.tv/tiankami  
**Обновлено:** 2025-09-06
