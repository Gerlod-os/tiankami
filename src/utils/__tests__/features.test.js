import { describe, test, expect } from "vitest";
import { splitFeatures, featureCounts, matchesFeatures } from "../normalize.js";

describe("splitFeatures", () => {
  test("режет по запятой и убирает пробелы", () => {
    expect(splitFeatures("Декбилдер, Пиксельарт,Кооп")).toEqual([
      "Декбилдер",
      "Пиксельарт",
      "Кооп",
    ]);
  });
  test("пустое значение — пустой список", () => {
    expect(splitFeatures("")).toEqual([]);
    expect(splitFeatures(null)).toEqual([]);
    expect(splitFeatures(" , , ")).toEqual([]);
  });
});

describe("featureCounts", () => {
  const games = [
    { features: "Декбилдер, Кооп" },
    { features: "Декбилдер" },
    { features: "Пиксельарт, Кооп" },
    { features: "" },
  ];

  test("считает, у скольких игр встречается тег", () => {
    const m = Object.fromEntries(featureCounts(games).map((x) => [x.tag, x.count]));
    expect(m).toEqual({ Декбилдер: 2, Кооп: 2, Пиксельарт: 1 });
  });

  test("сортировка по частоте, при равенстве — по алфавиту", () => {
    const order = featureCounts(games).map((x) => x.tag);
    // Декбилдер и Кооп по 2 — алфавит ставит «Декбилдер» первым, редкий тег в конце.
    expect(order).toEqual(["Декбилдер", "Кооп", "Пиксельарт"]);
  });

  test("игра без тегов ничего не добавляет", () => {
    expect(featureCounts([{ features: "" }, { features: null }])).toEqual([]);
  });
});

describe("matchesFeatures", () => {
  const game = { features: "Декбилдер, Кооп" };

  test("пустой выбор пропускает всё", () => {
    expect(matchesFeatures(game, new Set())).toBe(true);
    expect(matchesFeatures(game, [])).toBe(true);
  });

  test("совпал один тег — игра проходит (логика «ИЛИ»)", () => {
    expect(matchesFeatures(game, new Set(["Кооп"]))).toBe(true);
    expect(matchesFeatures(game, ["Другое", "Декбилдер"])).toBe(true);
  });

  test("нет ни одного общего тега — игра отсеивается", () => {
    expect(matchesFeatures(game, new Set(["Пиксельарт"]))).toBe(false);
  });

  test("подстрока не считается совпадением", () => {
    expect(matchesFeatures(game, new Set(["Кооператив"]))).toBe(false);
  });
});
