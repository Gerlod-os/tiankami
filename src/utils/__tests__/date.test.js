import { describe, test, expect } from "vitest";
import { parseRuDate, formatRuDate } from "../date.js";

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
