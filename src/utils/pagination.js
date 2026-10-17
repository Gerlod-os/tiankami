// Математика страниц каталога: сколько страниц, сколько карточек показывать,
// какие номера вывести. Чистые функции — их можно проверить тестом без браузера.

export function pagesCount(total, perPage) {
  if (!(total > 0) || !(perPage > 0)) return 0;
  return Math.ceil(total / perPage);
}

// Сколько карточек показать на странице `page` из `total`.
// Страница за пределами списка ведёт себя как последняя, мусорная — как первая.
export function visibleFor(page, total, perPage) {
  const pages = pagesCount(total, perPage);
  if (!pages) return 0;
  const n = Number(page);
  const safe = Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
  // Последняя страница показывает ровно столько, сколько осталось, а не полный шаг.
  return Math.min(Math.min(safe, pages) * perPage, total);
}

// Номера страниц для полосы навигации: первая, последняя, по два номера вокруг текущей.
// «…» — разрыв, а не число. На вход — сколько страниц всего.
export function pageNumbers(pagesTotal, current) {
  if (!(pagesTotal > 0)) return [];
  const pages = Math.floor(pagesTotal);
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);

  const c = Math.min(Math.max(Math.floor(Number(current) || 1), 1), pages);
  const keep = new Set([1, pages, c - 2, c - 1, c, c + 1, c + 2]);
  const out = [];
  let prev = 0;
  for (const n of [...keep].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b)) {
    if (prev && n - prev > 1) out.push("…");
    out.push(n);
    prev = n;
  }
  return out;
}
