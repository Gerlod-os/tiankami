// Обложки Steam для игр, которым в таблице картинки нет.
// Важно: новый путь header.jpg на CDN у свежих игр отдаёт 404 (проверено
// 18.10.2026 на The Looper и Tower Tactics 2) — обложку берём из appdetails,
// где лежит полный адрес текущей картинки.

const norm = (s) => String(s || "").toLowerCase().replace(/[^0-9a-zа-яё]+/gi, "");

/** Опечатки и уточнения: «The Baazar» ↔ «The Bazaar», «Gvalt / Гвалт» ↔ «Гвалт». */
export function titlesClose(a, b) {
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return false;
  if (x === y) return true;
  if (x.includes(y) || y.includes(x)) return Math.min(x.length, y.length) >= 5;
  if (x.length < 6 || y.length < 6) return false;
  let dist = levenshtein(x, y);
  if (dist <= 2) return true;
  // «Gvalt / Гвалт» — сравниваем ещё и части по слэшу
  const partsA = String(a).split(/[/|,;]/).map((p) => norm(p)).filter(Boolean);
  const partsB = String(b).split(/[/|,;]/).map((p) => norm(p)).filter(Boolean);
  for (const pa of partsA) for (const pb of partsB) {
    if (pa && pb && (pa === pb || levenshtein(pa, pb) <= 2)) return true;
  }
  return false;
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
  return d[m][n];
}
