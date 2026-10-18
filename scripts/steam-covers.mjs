// Обложки Steam для игр, которым в таблице картинки нет.
// Важно: старый путь header.jpg на CDN у свежих игр отдаёт 404 (проверено
// 18.10.2026 на The Looper и Tower Tactics 2) — обложку берём из appdetails,
// где лежит полный адрес текущей картинки.
import { titlesClose } from "../src/utils/steam.js";

const APPDETAILS = "https://store.steampowered.com/api/appdetails";
const SEARCH = "https://store.steampowered.com/api/storesearch";

async function getJson(url, tries = 2) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 600 * (i + 1)));
    }
  }
  throw lastErr;
}

/** Заголовок и обложка по номеру приложения. */
export async function appDetails(appId) {
  const json = await getJson(`${APPDETAILS}?appids=${appId}&l=russian&filters=basic`);
  return json?.[String(appId)]?.data || null;
}

/** Найденные страницы Steam по названию. */
export async function searchSteam(name) {
  const json = await getJson(`${SEARCH}/?term=${encodeURIComponent(name)}&l=russian&cc=us`);
  return json?.items || [];
}

/**
 * Обложка для игры: сначала appId (если он есть), потом поиск по названию.
 * Точное совпадение ищется раньше «похожего», чтобы «Hades» не получила обложку
 * «Hades II». Возвращает null, если Steam не знает игру или она другая.
 * @param aliases {Record<string,string>} — псевдонимы названий из таблицы:
 *   «The Baazar» → «The Bazaar» (опечатка в таблице, в Steam под другим именем).
 */
export async function steamCover(game, aliases = {}) {
  const appId = game.steamAppId ? String(game.steamAppId).trim() : "";
  if (appId) {
    const data = await appDetails(appId);
    if (data?.header_image) return { image: data.header_image, appId, name: data.name || "" };
  }

  const alias = aliases[game.title];
  const queries = [];
  if (alias) queries.push(alias);
  for (const part of String(game.title || "")
    .split(/[/|,;]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 2)) {
    if (!queries.includes(part)) queries.push(part);
  }

  const candidates = [];
  for (const query of queries) {
    for (const item of (await searchSteam(query)).slice(0, 5)) {
      const exact =
        titlesClose(game.title, item.name) ||
        titlesClose(query, item.name) ||
        partsClose(game.title, item.name);
      if (exact) candidates.push(item);
    }
  }

  const exactFirst = [...candidates].sort((a, b) => {
    const da = titlesClose(a.name, game.title) ? 0 : 1;
    const db = titlesClose(b.name, game.title) ? 0 : 1;
    return da - db;
  });

  for (const item of exactFirst) {
    const data = await appDetails(item.id);
    if (data?.header_image) {
      return { image: data.header_image, appId: String(item.id), name: data.name || item.name };
    }
  }
  return null;
}

function partsClose(a, b) {
  const pa = String(a).split(/[/|,;]/).map((s) => s.trim()).filter(Boolean);
  const pb = String(b).split(/[/|,;]/).map((s) => s.trim()).filter(Boolean);
  return pa.some((x) => pb.some((y) => titlesClose(x, y)));
}

/**
 * Добивает обложки играм, у которых её нет. Не трогает игры с обложкой:
 * если ссылка из таблицы битая — это лечится в overrides, а не здесь.
 * @param aliases псевдонимы названий (файл src/data/steam-name-aliases.json).
 */
export async function fillMissingCovers(games, { aliases, onFound, onMiss } = {}) {
  const missing = (games || []).filter((g) => !g.image);
  for (const g of missing) {
    try {
      const cover = await steamCover(g, aliases);
      if (cover) {
        g.image = cover.image;
        if (!g.steamAppId) g.steamAppId = cover.appId;
        if (!g.steamUrl) g.steamUrl = `https://store.steampowered.com/app/${cover.appId}/`;
        onFound?.(g, cover);
        continue;
      }
    } catch (e) {
      onMiss?.(g, e);
      continue;
    }
    onMiss?.(g, null);
  }
  return missing.length;
}
