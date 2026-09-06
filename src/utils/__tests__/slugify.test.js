import { describe, test, expect } from "vitest";
import { slugify, uniqueSlug } from "../slugify.js";

describe("slugify", () => {
  test("латиница: пробелы → дефисы", () => {
    expect(slugify("20 Minutes Till Dawn")).toBe("20-minutes-till-dawn");
  });
  test("кириллица сохраняется", () => {
    expect(slugify("Тайгер и Турбо")).toBe("тайгер-и-турбо");
  });
  test("спецсимволы удаляются", () => {
    expect(slugify("Slay the Spire! (v2)")).toBe("slay-the-spire-v2");
  });
  test("повторные дефисы схлопываются, краевые убираются", () => {
    expect(slugify(" --Game--  Name-- ")).toBe("game-name");
  });
});

describe("uniqueSlug", () => {
  test("свободный слаг возвращается как есть", () => {
    expect(uniqueSlug("hades", new Set())).toBe("hades");
  });
  test("коллизии получают суффикс -2, -3", () => {
    const used = new Set(["hades", "hades-2"]);
    expect(uniqueSlug("hades", used)).toBe("hades-3");
  });
});
