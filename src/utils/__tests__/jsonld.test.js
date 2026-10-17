import { describe, test, expect } from "vitest";
import { jsonLdFor } from "../jsonld.js";

const game = {
  title: "Hades",
  slug: "hades",
  image: "https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/header.jpg",
  genre: "Экшен",
  setting: "Древнегреческая мифология",
  status: "Пройдено",
  rating: "10",
  notes: "Легендарный и самый лучший рогЛАЙТ.",
  releaseDate: "06.12.2018",
};

const collection = {
  name: "Топ Карточных",
  slug: "карточные",
  description: "Лучшие карточные рогалики",
  games: [{ title: "Balatro", slug: "balatro" }],
};

const parse = (html) =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) =>
    JSON.parse(m[1])
  );

describe("jsonLdFor: страница игры", () => {
  const html = jsonLdFor("/catalog/hades", { game, site: "https://gerlod-os.github.io/tiankami" });

  test("блоков два: VideoGame и хлебные крошки", () => {
    expect(parse(html)).toHaveLength(2);
  });

  test("VideoGame со своими полями", () => {
    const [gameLd] = parse(html);
    expect(gameLd["@type"]).toBe("VideoGame");
    expect(gameLd.name).toBe("Hades");
    expect(gameLd.url).toBe("https://gerlod-os.github.io/tiankami/catalog/hades/");
    expect(gameLd.gamePlatform).toContain("PC");
    expect(gameLd.genre).toContain("Экшен");
    expect(gameLd.datePublished).toBe("2018-12-06");
  });

  test("оценка Тиана идёт отзывом автора, а не средней", () => {
    const [gameLd] = parse(html);
    expect(gameLd.review["@type"]).toBe("Review");
    expect(gameLd.review.reviewRating.ratingValue).toBe(10);
    expect(gameLd.aggregateRating).toBeUndefined();
  });

  test("хлебные крошки ведут с главной через каталог", () => {
    const [, crumbs] = parse(html);
    expect(crumbs["@type"]).toBe("BreadcrumbList");
    const names = crumbs.itemListElement.map((i) => i.name);
    expect(names).toEqual(["Главная", "Каталог", "Hades"]);
    const urls = crumbs.itemListElement.map((i) => i.item);
    expect(urls[urls.length - 1]).toBeUndefined();
  });
});

describe("jsonLdFor: страница подборки", () => {
  test("хлебные крошки с названием подборки", () => {
    const html = jsonLdFor("/collections/карточные", { collection, site: "https://gerlod-os.github.io/tiankami" });
    const [crumbs] = parse(html);
    expect(crumbs["@type"]).toBe("BreadcrumbList");
    expect(crumbs.itemListElement.map((i) => i.name)).toEqual(["Главная", "Подборки", "Топ Карточных"]);
  });
});

describe("jsonLdFor: чего не надо", () => {
  test("на главной разметки нет", () => {
    expect(jsonLdFor("/", { game, collection })).toBe("");
  });

  test("игра без оценки — без отзыва", () => {
    const noRating = { ...game, rating: "" };
    const [gameLd] = parse(jsonLdFor("/catalog/hades", { game: noRating, site: "s" }));
    expect(gameLd.review).toBeUndefined();
  });

  test("несуществующий адрес — пусто", () => {
    expect(jsonLdFor("/oops/nothing", { game, collection })).toBe("");
  });
});
