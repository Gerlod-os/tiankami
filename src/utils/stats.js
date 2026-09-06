import { parseNum, hasMI } from "./normalize";
import { parseRuDate } from "./date";

export function computeStats(games, collections) {
  const total = games.length;
  const done = games.filter((g) => g.status === "Пройдено").length;
  const hours = Math.round(games.reduce((s, g) => s + parseNum(g.hours), 0));
  const mi = games.filter((g) => hasMI(g)).length;
  return { total, done, hours, mi, collections: collections.length };
}

export function lastPlayedGame(games) {
  let best = null;
  let bestT = -Infinity;
  for (const g of games) {
    const d = parseRuDate(g.playedDate);
    if (d && d.getTime() > bestT) {
      bestT = d.getTime();
      best = g;
    }
  }
  return best;
}

export function topRated(games, n = 8) {
  return [...games]
    .filter((g) => parseNum(g.rating) > 0)
    .sort(
      (a, b) =>
        parseNum(b.rating) - parseNum(a.rating) ||
        parseNum(b.hours) - parseNum(a.hours)
    )
    .slice(0, n);
}
