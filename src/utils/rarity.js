// Система редкости в стиле Monster Train: драконьи яйца 5 уровней.
import { parseNum } from "./normalize.js";

export const RARITY_ORDER = ["common", "normal", "rare", "epic", "legendary", "perfect", "mythic"];

// Свечение карточки цветом редкости (hover)
export const RARITY_GLOW = {
  common: "rgba(154,160,174,0.25)",
  // normal — белое яйцо за оценку 5–6 (слово владельца 12.11.2026)
  normal: "rgba(255,255,255,0.42)",
  rare: "rgba(160,196,255,0.40)",
  epic: "rgba(201,160,220,0.45)",
  legendary: "rgba(255,217,160,0.50)",
  // perfect — золотое яйцо за максимальную оценку (10/10), владелец 11.11.2026
  perfect: "rgba(255,217,160,0.62)",
  mythic: "rgba(159,226,185,0.55)",
};

export const RARITY_META = {
  common: {
    ru: "Обычное",
    desc: "Оценка ниже 5 — рогалик на вечер. Тиан попробовал, но звать не станет.",
    color: "#9aa0ae",
  },
  // Белое яйцо за оценку 5–6 (слово владельца 12.11.2026: «игра норм»).
  // С этого дня серое яйцо осталось только у игр ниже 5, поэтому в подписи
  // common число поменялось с 7 на 5 — иначе подсказка врала бы.
  // Формулировку владелец поменял 13.11.2026: «игра хорошая, можно играть».
  normal: {
    ru: "Хорошая",
    desc: "Оценка 5–6: игра хорошая, можно играть.",
    color: "#FFFFFF",
  },
  rare: {
    ru: "Редкое",
    desc: "Оценка 7–8: крепкая игра, свои часы отрабатывает.",
    color: "#A0C4FF",
  },
  epic: {
    ru: "Эпическое",
    desc: "Оценка 9: почти максимум, такие Тиан проходит до конца.",
    color: "#C9A0DC",
  },
  legendary: {
    ru: "Легендарное",
    desc: "Золотой список: игры, которые Тиан называет легендами канала.",
    color: "#FFD9A0",
  },
  // Отдельный уровень для 10/10: владелец 11.11.2026 попросил золотое яйцо
  // всем играм с максимальной оценкой и свою подпись при наведении.
  // Раньше такие игры уходили в epic (фиолетовое), если не попадали в топ-3 по часам.
  perfect: {
    ru: "Максимальная оценка",
    desc: "Игры, которые заслужили максимальную оценку.",
    color: "#FFD9A0",
  },
  mythic: {
    ru: "Мифическое",
    desc: "10 из 10 и больше всех часов — три игры, в которые вложено больше всего времени.",
    color: "#9FE2B9",
  },
};

// Правила:
//  perfect   — оценка 10: золотое яйцо «заслужили максимальную оценку»
//  mythic    — топ-3 по часам среди 10/10 (радужное, выше золота)
//  legendary — игры из «ЗОЛОТОЙ СПИСОК»
//  epic      — оценка >= 9
//  rare      — оценка >= 7
//  normal    — оценка 5–6: белое яйцо «норм» (слово владельца 12.11.2026)
//  common    — остальные, ниже 5
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
    // Порядок важен: радужное (топ-3 по часам) старше золота, а золото
    // за 10/10 старше «золотого списка» — у них разные подписи.
    if (mythicSlugs.has(g.slug)) r = "mythic";
    else if (rating === 10) r = "perfect";
    else if (goldenTitles.has(String(g.title).toLowerCase())) r = "legendary";
    else if (rating >= 9) r = "epic";
    else if (rating >= 7) r = "rare";
    else if (rating >= 5) r = "normal";
    bySlug[g.slug] = r;
  }
  return { bySlug, goldenTitles, mythicSlugs };
}
