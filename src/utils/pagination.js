// Математика страниц каталога: сколько страниц, сколько карточек показывать,
// какие номера вывести. Чистые функции — их можно проверить тестом без браузера.

export function pagesCount(total, perPage) {
  if (!(total > 0) || !(perPage > 0)) return 0;
  return Math.ceil(total / perPage);
}

// Карточки одной страницы: берём порцию со смещением, а не «первые N».
// Именно здесь была ошибка: slice(0, page * perPage) показывал на второй
// странице первые 48 карточек, то есть первые 24 повторялись.
export function pageSlice(list, page, perPage) {
  const items = Array.isArray(list) ? list : [];
  if (!(perPage > 0)) return [];
  const pages = pagesCount(items.length, perPage);
  if (!pages) return [];
  const n = Number(page);
  const safe = Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
  const current = Math.min(safe, pages);
  const start = (current - 1) * perPage;
  return items.slice(start, start + perPage);
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
