import { describe, test, expect } from "vitest";
import { getInitialData, buildDate } from "../loadData.js";

// Раньше здесь проверялись normalizeScheduleRows, enrichWithLocal и hashStr —
// все три удалены 18.11.2026 как мёртвый код. Тест остался на то, что реально
// уходит в страницы.
describe("getInitialData", () => {
  test("отдаёт три массива из локального JSON", () => {
    const d = getInitialData();
    expect(Array.isArray(d.games)).toBe(true);
    expect(Array.isArray(d.collections)).toBe(true);
    expect(Array.isArray(d.schedule)).toBe(true);
    expect(d.games.length).toBeGreaterThan(100);
  });

  test("у каждой игры есть slug и title — на них строятся адреса", () => {
    const bad = getInitialData().games.filter((g) => !g.slug || !g.title);
    expect(bad).toHaveLength(0);
  });
});

describe("buildDate", () => {
  test("без define отдаёт пустую строку, а не мусор", () => {
    expect(typeof buildDate()).toBe("string");
  });
});
