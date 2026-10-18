import { describe, test, expect } from "vitest";
import { parseRuDate, formatRuDate, normalizeDateCell } from "../date.js";

describe("parseRuDate", () => {
  test("DD.MM.YYYY", () => {
    const d = parseRuDate("11.11.2024");
    expect(d.getUTCFullYear()).toBe(2024);
    expect(d.getUTCMonth()).toBe(10);
    expect(d.getUTCDate()).toBe(11);
  });
  test("YYYY-MM-DD", () => {
    const d = parseRuDate("2024-10-28");
    expect(formatRuDate(d)).toBe("28.10.2024");
  });
  test("невалидная календарная дата отклоняется", () => {
    expect(parseRuDate("31.02.2024")).toBeNull();
  });
  test("мусор отклоняется", () => {
    expect(parseRuDate("когда-нибудь")).toBeNull();
  });
  test("пустая строка → null", () => {
    expect(parseRuDate("")).toBeNull();
    expect(parseRuDate(null)).toBeNull();
  });
  test("високосный день валиден", () => {
    expect(parseRuDate("29.02.2024")).not.toBeNull();
    expect(parseRuDate("29.02.2023")).toBeNull();
  });
  test("formatRuDate паддировает нули", () => {
    expect(formatRuDate(parseRuDate("01.03.2020"))).toBe("01.03.2020");
  });
});

describe("normalizeDateCell", () => {
  test("американская запись с однозначным днём приводится к дд.мм.гггг", () => {
    expect(normalizeDateCell("8/27/2024")).toBe("27.08.2024");
  });
  test("день впереди месяца тоже разбирается", () => {
    expect(normalizeDateCell("27/8/2024")).toBe("27.08.2024");
  });
  test("ISO приводится", () => {
    expect(normalizeDateCell("2024-10-28")).toBe("28.10.2024");
  });
  test("правильная дата остаётся как была", () => {
    expect(normalizeDateCell("27.08.2024")).toBe("27.08.2024");
  });
  test("неоднозначное 3/4/2025 не переставляется", () => {
    expect(normalizeDateCell("3/4/2025")).toBe("3/4/2025");
  });
  test("мусор и пустое остаются строкой", () => {
    expect(normalizeDateCell("когда-нибудь")).toBe("когда-нибудь");
    expect(normalizeDateCell("")).toBe("");
    expect(normalizeDateCell(null)).toBe("");
  });
  test("несуществующая дата не превращается в валидную", () => {
    expect(normalizeDateCell("2/30/2024")).toBe("2/30/2024");
  });
});
