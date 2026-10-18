// AI-сфера: рекомендации. Веса по решению владельца 18.10.2026:
// жанр 5 → сеттинг 3 → теги 1 (не больше трёх). Общий жанр обязан весить больше
// трёх общих тегов, иначе карточная игра с теми же тегами выигрывает у игры того же
// жанра (так и было: теги ×3 против жанра ×2 — на Vampyr выдавало карточную игру).
import { parseNum } from "./normalize.js";
import { FaFire } from "react-icons/fa";
import { FiCoffee, FiZap, FiLayers, FiTarget } from "react-icons/fi";

const GENRE_W = 5;
const SETTING_W = 3;
const TAG_W = 1;
const TAG_CAP = 3;

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
  const tags = new Set(splitList(game.features));
  const genres = new Set(splitList(game.genre));
  // Сеттинг — тоже список через запятую («Фэнтези, Нечисть»): сравниваем наборами,
  // иначе «Фэнтези» и «Фэнтези, Нечисть» считались разными.
  const settings = new Set(splitList(game.setting));
  return games
    .filter((g) => g.slug !== game.slug)
    .map((g) => {
      const genreHits = intersectSize(genres, new Set(splitList(g.genre)));
      const settingHits = intersectSize(settings, new Set(splitList(g.setting)));
      const tagHits = Math.min(
        TAG_CAP,
        intersectSize(tags, new Set(splitList(g.features))),
      );
      return {
        g,
        score:
          genreHits * GENRE_W +
          (settingHits > 0 ? SETTING_W : 0) +
          tagHits * TAG_W,
        genreHits,
        settingHits,
      };
    })
    .filter((x) => x.score > 0)
    // Ничья — по числу общих жанров, потом по оценке, потом по слагу.
    // Слаг, а не название: localeCompare в Node и в браузере может дать разный
    // порядок, а список рисуется и на сервере, и на клиенте.
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.genreHits - a.genreHits ||
        b.settingHits - a.settingHits ||
        parseNum(b.g.rating) - parseNum(a.g.rating) ||
        (a.g.slug < b.g.slug ? -1 : a.g.slug > b.g.slug ? 1 : 0),
    )
    .slice(0, n)
    .map((x) => x.g);
}

// Настроение (AI-теги): 5 уровней — chill / intense / mindfuck / casual / hardcore
export const MOODS = {
  chill: { key: "chill", icon: FiCoffee, label: "Chill", desc: "расслабляющая" },
  intense: { key: "intense", icon: FiZap, label: "Intense", desc: "напряжённая" },
  mindfuck: { key: "mindfuck", icon: FiLayers, label: "Mindfuck", desc: "сложная" },
  casual: { key: "casual", icon: FiTarget, label: "Casual", desc: "казуальная" },
  hardcore: { key: "hardcore", icon: FaFire, label: "Hardcore", desc: "хардкорная" },
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
