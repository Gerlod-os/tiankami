// AI-сфера: рекомендации. Приоритет: особенности → жанр → сеттинг.
import { parseNum } from "./normalize.js";

const splitList = (s) =>
  String(s || "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);

function intersectSize(a, b) {
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return n;
}

export function recommendSimilar(game, games, n = 4) {
  const feat = new Set(splitList(game.features));
  const genres = new Set(splitList(game.genre));
  return games
    .filter((g) => g.slug !== game.slug)
    .map((g) => {
      let score =
        intersectSize(feat, new Set(splitList(g.features))) * 3 +
        intersectSize(genres, new Set(splitList(g.genre))) * 2 +
        (g.setting && g.setting === game.setting ? 1 : 0);
      return { g, score };
    })
    .filter((x) => x.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || parseNum(b.g.rating) - parseNum(a.g.rating)
    )
    .slice(0, n)
    .map((x) => x.g);
}

// Настроение (AI-теги): 5 уровней — chill / intense / mindfuck / casual / hardcore
export const MOODS = {
  chill: { key: "chill", emoji: "🧘", label: "Chill", desc: "расслабляющая" },
  intense: { key: "intense", emoji: "⚡", label: "Intense", desc: "напряжённая" },
  mindfuck: { key: "mindfuck", emoji: "🧠", label: "Mindfuck", desc: "сложная" },
  casual: { key: "casual", emoji: "🎯", label: "Casual", desc: "казуальная" },
  hardcore: { key: "hardcore", emoji: "🔥", label: "Hardcore", desc: "хардкорная" },
};

export function moodOf(game) {
  const cx = parseNum(game.complexity);
  const h = parseNum(game.hours);
  const text = `${game.genre} ${game.features}`.toLowerCase();
  if (cx >= 9) return MOODS.hardcore;
  if (cx >= 8 || h >= 100) return MOODS.mindfuck;
  if (/экшен|босс|шутер|bullet/.test(text) || cx >= 6) return MOODS.intense;
  if (/автобатлер|карточн|казуал|расслаб/.test(text) || cx <= 3) return MOODS.chill;
  if (cx <= 4) return MOODS.casual;
  return MOODS.chill;
}
