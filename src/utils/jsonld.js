// JSON-LD для страниц: VideoGame + хлебные крошки.
// Нужно поисковикам: без разметки страница игры для них — просто текст.
// Оценка Тиана идёт отзывом автора, а не aggregateRating: одна оценка — не «средняя по отзывам».

// Ловушка безопасности: JSON.stringify сам экранирует кавычки, но данные приходят
// из чужой таблицы и могут содержать </script> — такой текст закрыл бы тег разметки.
// Заменяем угловую скобку на её юникод-запись: для парсера это тот же текст.
const safe = (v) => String(v).replace(/</g, "\\u003c").replace(/>/g, "\\u003e");

function script(obj) {
  return `<script type="application/ld+json">${safe(JSON.stringify(obj))}</script>`;
}

// «06.12.2018» → «2018-12-06»; если дата не нашлась — null
function isoDate(raw) {
  const m = String(raw || "").match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

function crumbs(site, items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, url], i) => {
      const last = i === items.length - 1;
      return {
        "@type": "ListItem",
        position: i + 1,
        name,
        // У последнего пункта адрес не указываем — Google подставит адрес страницы.
        ...(last ? {} : { item: url }),
      };
    }),
  };
}

function gameLd(site, game) {
  const url = `${site}/catalog/${game.slug}/`;
  const rating = Number(String(game.rating || "").trim());
  const published = isoDate(game.releaseDate);

  const obj = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.title,
    url,
    description: String(game.notes || "").slice(0, 300) || `${game.title} — рогалик в каталоге Tiankami.`,
    gamePlatform: ["PC"],
    publisher: {
      "@type": "Organization",
      name: "Tiankami",
    },
  };
  if (game.image) obj.image = game.image;
  if (game.genre) obj.genre = String(game.genre).split(",").map((s) => s.trim()).filter(Boolean);
  if (game.setting) obj.about = { "@type": "Thing", name: String(game.setting).split(",")[0].trim() };
  if (published) obj.datePublished = published;
  // Оценка Тиана — его отзыв, а не средняя оценка посетителей.
  if (Number.isFinite(rating) && rating > 0) {
    obj.review = {
      "@type": "Review",
      author: { "@type": "Person", name: "Tiankami" },
      reviewRating: { "@type": "Rating", ratingValue: rating, bestRating: 10, worstRating: 1 },
    };
  }
  return script(obj);
}

/**
 * Разметка для адреса. Возвращает HTML с тегами <script> или пустую строку.
 * game/collection — объект данных для этого адреса (уже найденный по slug).
 */
export function jsonLdFor(pathname, { game, collection, site = "" } = {}) {
  const base = String(site).replace(/\/$/, "");
  const clean = String(pathname || "").replace(/\/$/, "") || "/";

  if (clean.startsWith("/catalog/") && game) {
    return (
      gameLd(base, game) +
      script(
        crumbs(base, [
          ["Главная", base + "/"],
          ["Каталог", base + "/catalog/"],
          [game.title, base + "/catalog/" + game.slug + "/"],
        ])
      )
    );
  }

  if (clean.startsWith("/collections/") && collection) {
    return script(
      crumbs(base, [
        ["Главная", base + "/"],
        ["Подборки", base + "/collections/"],
        [collection.name, base + "/collections/" + collection.slug + "/"],
      ])
    );
  }

  return "";
}
