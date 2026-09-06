import { slugify, uniqueSlug } from "./slugify.js";

// ─── Статусы: единый справочник синонимов ────────────────────────────────────
const STATUS_ALIASES = {
  "жду релиз": "Жду релиза",
  "жду": "Жду релиза",
  "не начал": "Не начал",
  "в паузе": "В паузе",
  пройдено: "Пройдено",
  дропнуто: "Дропнуто",
  обзор: "Обзор",
  "в процессе": "В процессе",
};

export function normalizeStatus(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  const normalized = STATUS_ALIASES[s.toLowerCase()];
  if (normalized) return normalized;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Нормализация строки игры по индексам колонок ────────────────────────────
export function normalizeGameRow(row, colIndex) {
  if (!row) return null;
  const get = (i) => (i >= 0 && row[i] != null ? String(row[i]).trim() : "");
  const title = get(colIndex.title);
  if (!title) return null;
  return {
    title,
    image: get(colIndex.image),
    genre: get(colIndex.genre),
    features: get(colIndex.features),
    setting: get(colIndex.setting),
    complexity: get(colIndex.complexity),
    hours: get(colIndex.hours),
    status: normalizeStatus(row[colIndex.status]),
    progress: get(colIndex.progress),
    rating: get(colIndex.rating),
    releaseDate: get(colIndex.releaseDate),
    playedDate: get(colIndex.playedDate),
    notes: get(colIndex.notes),
    youtube: get(colIndex.youtube),
    hasMI: get(colIndex.hasMI),
    miVideo: get(colIndex.miVideo),
  };
}

// ─── Поиск индексов колонок из строки заголовков ─────────────────────────────
export function buildColIndex(headerRow, firstDataRow) {
  const idx = {};
  headerRow.forEach((cell, i) => {
    const key = String(cell || "").trim();
    if (key) idx[key] = i;
  });

  // Название: сначала явный заголовок, потом эвристика
  let titleIdx = -1;
  let titleWasShifted = false;
  if (idx["Название"] !== undefined) {
    titleIdx = idx["Название"];
    // merged cells: заголовок в B, данные в C → если в колонке заголовка данных нет, +1
    if (
      firstDataRow &&
      firstDataRow[titleIdx] !== undefined &&
      !String(firstDataRow[titleIdx]).trim()
    ) {
      titleIdx++;
      titleWasShifted = true;
    }
  } else {
    // Эвристика: пустой заголовок + есть данные; пропускаем картинку (URL/=IMAGE)
    for (let i = 0; i < headerRow.length; i++) {
      const headerEmpty = !headerRow[i] || !String(headerRow[i]).trim();
      const dataExists =
        firstDataRow && firstDataRow[i] && String(firstDataRow[i]).trim() !== "";
      if (headerEmpty && dataExists) {
        const firstData = String(firstDataRow[i]).trim();
        if (/^https?:\/\//i.test(firstData) || /^=IMAGE/i.test(firstData)) continue;
        titleIdx = i;
        break;
      }
    }
  }
  if (titleIdx === -1) titleIdx = 2; // fallback

  const imageIdx =
    titleWasShifted && titleIdx > 1
      ? titleIdx - 2
      : titleIdx > 0
        ? titleIdx - 1
        : -1;

  return {
    title: titleIdx,
    image: imageIdx,
    genre: idx["Жанр"] ?? -1,
    features: idx["Особенности"] ?? -1,
    setting: idx["Сеттинг"] ?? -1,
    complexity: idx["Сложность"] ?? -1,
    hours: idx["Наиграно (часы)"] ?? -1,
    status: idx["Статус"] ?? -1,
    progress: idx["Прогресс (%)"] ?? -1,
    rating: idx["Оценка (?/10)"] ?? -1,
    releaseDate: idx["Дата выхода"] ?? -1,
    playedDate: idx["Когда играл"] ?? -1,
    notes: idx["Примечания"] ?? -1,
    youtube: idx["YouTube прохождение"] ?? -1,
    hasMI: idx["Проводил МИ"] ?? -1,
    miVideo: idx["Выпуск МИ"] ?? -1,
  };
}

// ─── Нормализация всех игр (сортировка + уникальные слаги) ───────────────────
export function normalizeGames(rows) {
  if (!rows || rows.length < 2) return [];
  const headerRow = rows[0];
  const colIndex = buildColIndex(headerRow, rows[1]);
  const games = [];
  for (let i = 1; i < rows.length; i++) {
    const game = normalizeGameRow(rows[i], colIndex);
    if (game) games.push(game);
  }
  games.sort((a, b) => a.title.localeCompare(b.title, "ru"));
  const usedSlugs = new Set();
  return games.map((game) => {
    const baseSlug = slugify(game.title);
    const slug = uniqueSlug(baseSlug || "game", usedSlugs);
    usedSlugs.add(slug);
    return { ...game, slug };
  });
}

// ─── Подборки — ПОСТРОЧНЫЙ парсер (колонки «гуляют», не переписывать!) ────────
export function normalizeCollections(rows) {
  if (!rows || rows.length < 2) return [];
  const headerRow = rows[0];
  const isNumeric = (s) => /^\d+([.,]\d+)?$/.test(String(s || "").trim());
  const WINDOW_SIZE = 5; // ширина окна подборки
  const RANK_RANGE = 4; // поиск ранга правее игры
  const titleIndices = [];
  headerRow.forEach((cell, idx) => {
    if (cell && String(cell).trim() !== "") titleIndices.push(idx);
  });
  const collections = [];
  const usedSlugs = new Set();
  titleIndices.forEach((titleIdx) => {
    const name = String(headerRow[titleIdx]).trim();
    if (!name) return;
    const minCol = titleIdx;
    const maxCol = titleIdx + WINDOW_SIZE;
    let description = "";
    const underTitle = String(((rows[1] || [])[titleIdx] || "")).trim();
    if (underTitle && !isNumeric(underTitle)) description = underTitle;
    const games = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] || [];
      let gameCol = -1;
      for (let c = minCol; c <= maxCol; c++) {
        const v = String(row[c] || "").trim();
        if (!v || isNumeric(v)) continue;
        if (i === 1 && c === titleIdx) continue; // описание под заголовком
        gameCol = c;
        break;
      }
      if (gameCol === -1) continue;
      let rank = "";
      for (let c = gameCol + 1; c <= gameCol + RANK_RANGE; c++) {
        const v = String(row[c] || "").trim();
        if (v && isNumeric(v)) {
          rank = v;
          break;
        }
      }
      games.push({ name: String(row[gameCol] || "").trim(), rank });
    }
    if (games.length === 0) return;
    if (/золотой список/i.test(name)) {
      games.forEach((g) => (g.rank = "")); // ЗОЛОТОЙ СПИСОК без рангов
    }
    const baseSlug = slugify(name);
    const slug = uniqueSlug(baseSlug || "collection", usedSlugs);
    usedSlugs.add(slug);
    collections.push({ name, slug, description, games });
  });
  return collections;
}

// ─── Ссылки и метаданные ─────────────────────────────────────────────────────
export function isUrl(value) {
  return /^https?:\/\//i.test(String(value || "").trim());
}

export function extractSteamAppId(url) {
  const m = String(url || "").match(/store\.steampowered\.com\/app\/(\d+)/i);
  return m ? m[1] : null;
}

export function extractUrlFromCell(cell) {
  const s = String(cell || "").trim();
  if (!s) return null;
  const m = s.match(/^=HYPERLINK\(\s*"([^"]+)"\s*[;,]/i);
  if (m) return m[1];
  const m2 = s.match(/^=HYPERLINK\(\s*'([^']+)'\s*[;,]/i);
  if (m2) return m2[1];
  if (isUrl(s)) return s;
  return null;
}

// Копия, колонки C:W → C=0, U=18 (Steam), V=19 (YouTube), W=20 (МИ)
export function extractLinksFromCopyRow(row) {
  const title = String(row?.[0] || "").trim();
  if (!title) return null;
  const entry = {};
  const steamUrl = extractUrlFromCell(row[18]);
  if (steamUrl) {
    const appId = extractSteamAppId(steamUrl);
    if (appId) entry.steamAppId = appId;
  }
  const ytUrl = extractUrlFromCell(row[19]);
  if (ytUrl) entry.youtube = ytUrl;
  const miUrl = extractUrlFromCell(row[20]);
  if (miUrl) entry.miVideo = miUrl;
  return entry.steamAppId || entry.youtube || entry.miVideo
    ? { title, entry }
    : null;
}

// Обложки Steam — только CDN, БЕЗ запросов к Steam API!
export function steamHeaderUrl(appId) {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
}
export function steamCoverUrl(appId) {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`;
}

// Жанры и годы для фильтров
export function getGameMetadata(games) {
  const genres = new Set();
  const years = new Set();
  games.forEach((game) => {
    String(game.genre || "")
      .split(",")
      .forEach((g) => {
        const t = g.trim();
        if (t) genres.add(t);
      });
    const match = String(game.releaseDate || "").match(/\d{4}/);
    if (match) years.add(match[0]);
  });
  return { genres: [...genres].sort((a, b) => a.localeCompare(b, "ru")), years: [...years].sort() };
}

// ─── Числовые парсеры для сортировок/шкал ────────────────────────────────────
export function parseNum(value) {
  const n = parseFloat(String(value || "").replace(",", "."));
  return isNaN(n) ? 0 : n;
}

export function hasMI(game) {
  return /^true$/i.test(String(game.hasMI || "").trim()) || isUrl(game.miVideo);
}
