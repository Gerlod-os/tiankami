import { describe, test, expect } from "vitest";
import { computeRarities } from "../rarity.js";
import { recommendSimilar, moodOf } from "../recommend.js";

const G = (slug, title, rating, hours, extra = {}) => ({
  slug,
  title,
  rating: String(rating),
  hours: String(hours),
  genre: "",
  features: "",
  setting: "",
  ...extra,
});

const collections = [
  {
    name: "ЗОЛОТОЙ СПИСОК",
    games: [{ name: "Hades", rank: "" }],
  },
];

describe("computeRarities", () => {
  const games = [
    G("hades", "Hades", 10, 300),
    G("balatro", "Balatro", 10, 500),
    G("sots", "Slay the Spire", 10, 1000),
    G("dd", "Darkest Dungeon", 10, 100),
    G("mc", "Monster Train", 9, 50),
    G("brotato", "Brotato", 7, 20),
    G("weak", "Слабая игра", 4, 3),
  ];
  const { bySlug } = computeRarities(games, collections);

  test("mythic — топ-3 по часам среди 10/10", () => {
    expect(bySlug["sots"]).toBe("mythic");
    expect(bySlug["balatro"]).toBe("mythic");
    expect(bySlug["hades"]).toBe("mythic");
    expect(bySlug["dd"]).not.toBe("mythic");
  });
  test("legendary — золотой список (если не mythic)", () => {
    // Hades и mythic и в золотом — mythic старше; проверим не-mythic легенду
    const { bySlug: b2 } = computeRarities(
      [G("h2", "Hades", 8, 5)],
      collections
    );
    expect(b2["h2"]).toBe("legendary");
  });
  test("epic при оценке >= 9", () => {
    expect(bySlug["mc"]).toBe("epic");
  });
  test("rare при оценке >= 7", () => {
    expect(bySlug["brotato"]).toBe("rare");
  });
  test("common для остальных", () => {
    expect(bySlug["weak"]).toBe("common");
  });
});

describe("recommendSimilar", () => {
  const cur = G("cur", "Текущая", 8, 10, {
    genre: "Экшен, Метроидвания",
    features: "Пиксельарт, Сложная",
    setting: "Тёмное фэнтези",
  });
  const games = [
    cur,
    G("a", "A", 9, 10, { genre: "Экшен, Метроидвания", features: "Пиксельарт, Сложная" }),
    G("b", "B", 9, 10, { genre: "Экшен", features: "Пиксельарт" }),
    G("c", "C", 10, 10, { genre: "Карточный", features: "Спокойная" }),
  ];

  test("особенности весят больше жанра", () => {
    const rec = recommendSimilar(cur, games, 2);
    expect(rec[0].slug).toBe("a");
  });
  test("не рекомендует саму себя и режет до n", () => {
    const rec = recommendSimilar(cur, games, 2);
    expect(rec).toHaveLength(2);
    expect(rec.every((g) => g.slug !== "cur")).toBe(true);
  });
  test("несовпадающие не попадают", () => {
    const rec = recommendSimilar(cur, games, 4);
    expect(rec.map((g) => g.slug)).not.toContain("c");
  });
});

describe("moodOf (5 настроений)", () => {
  test("hardcore при сложности 9-10", () => {
    expect(moodOf(G("x", "X", 9, 150, { complexity: "9" })).key).toBe("hardcore");
  });
  test("mindfuck при сложности 8 или 100+ часов", () => {
    expect(moodOf(G("x", "X", 9, 150, { complexity: "8" })).key).toBe("mindfuck");
    expect(moodOf(G("x", "X", 7, 150, { complexity: "5" })).key).toBe("mindfuck");
  });
  test("intense для экшенов", () => {
    expect(moodOf(G("x", "X", 8, 10, { genre: "Экшен", complexity: "6" })).key).toBe("intense");
  });
  test("chill для карточных/автобатлеров", () => {
    expect(moodOf(G("x", "X", 7, 10, { genre: "Карточный", complexity: "3" })).key).toBe("chill");
  });
  test("casual для простых", () => {
    expect(moodOf(G("x", "X", 6, 10, { genre: "Аркада", complexity: "4" })).key).toBe("casual");
  });
});
