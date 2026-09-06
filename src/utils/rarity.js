// Система редкости в стиле Monster Train: драконьи яйца 5 уровней.
import { parseNum } from "./normalize.js";

export const RARITY_ORDER = ["common", "rare", "epic", "legendary", "mythic"];

// Свечение карточки цветом редкости (hover)
export const RARITY_GLOW = {
  common: "rgba(154,160,174,0.25)",
  rare: "rgba(160,196,255,0.40)",
  epic: "rgba(201,160,220,0.45)",
  legendary: "rgba(255,217,160,0.50)",
  mythic: "rgba(159,226,185,0.55)",
};

export const RARITY_META = {
  common: {
    ru: "Обычное",
    desc: "Базовый рогалик. Яйцо серое, матовое — но вдруг вылупится сюрприз?",
    color: "#9aa0ae",
  },
  rare: {
    ru: "Редкое",
    desc: "Хорошая игра, стоит попробовать. Кристаллическое голубое яйцо.",
    color: "#A0C4FF",
  },
  epic: {
    ru: "Эпическое",
    desc: "Топ-уровень. Фиолетовое яйцо с чешуёй дракона.",
    color: "#C9A0DC",
  },
  legendary: {
    ru: "Легендарное",
    desc: "ЗОЛОТОЙ СПИСОК. Золотое яйцо с рубинами.",
    color: "#FFD9A0",
  },
  mythic: {
    ru: "Мифическое",
    desc: "Топ-3 по часам с оценкой 10/10. Радужное яйцо — внутри дракон!",
    color: "#9FE2B9",
  },
};

// Правила:
//  mythic    — топ-3 по часам среди игр с оценкой 10
//  legendary — игры из «ЗОЛОТОЙ СПИСОК»
//  epic      — оценка >= 9
//  rare      — оценка >= 7
//  common    — остальные
export function computeRarities(games, collections) {
  const goldenTitles = new Set();
  const gold = (collections || []).find((c) => /золотой список/i.test(c.name));
  gold?.games.forEach((g) => goldenTitles.add(String(g.name).toLowerCase()));

  const mythicSlugs = new Set(
    [...games]
      .filter((g) => parseNum(g.rating) === 10)
      .sort((a, b) => parseNum(b.hours) - parseNum(a.hours))
      .slice(0, 3)
      .map((g) => g.slug)
  );

  const bySlug = {};
  for (const g of games) {
    const rating = parseNum(g.rating);
    let r = "common";
    if (mythicSlugs.has(g.slug)) r = "mythic";
    else if (goldenTitles.has(String(g.title).toLowerCase())) r = "legendary";
    else if (rating >= 9) r = "epic";
    else if (rating >= 7) r = "rare";
    bySlug[g.slug] = r;
  }
  return { bySlug, goldenTitles, mythicSlugs };
}
