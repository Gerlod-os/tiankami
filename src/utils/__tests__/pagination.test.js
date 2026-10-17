import { describe, test, expect } from "vitest";
import { pagesCount, visibleFor, pageNumbers } from "../pagination.js";

describe("pagesCount", () => {
  test("округляет вверх", () => {
    expect(pagesCount(459, 24)).toBe(20); // 19 полных + 3 игры
  });
  test("ровное деление — без лишней страницы", () => {
    expect(pagesCount(48, 24)).toBe(2);
  });
  test("пустой список — ноль страниц", () => {
    expect(pagesCount(0, 24)).toBe(0);
  });
});

describe("visibleFor", () => {
  test("страница 1 показывает первую двадцатьчетверку", () => {
    expect(visibleFor(1, 459, 24)).toBe(24);
  });
  test("последняя страница не вылезает за список", () => {
    expect(visibleFor(20, 459, 24)).toBe(459);
  });
  test("страница за пределами работает как последняя", () => {
    expect(visibleFor(99, 459, 24)).toBe(459);
  });
  test("нулевая и мусорная страница — первая", () => {
    expect(visibleFor(0, 459, 24)).toBe(24);
    expect(visibleFor("", 459, 24)).toBe(24);
  });
});

describe("pageNumbers", () => {
  test("мало страниц — показываем все", () => {
    expect(pageNumbers(5, 1)).toEqual([1, 2, 3, 4, 5]);
  });
  test("середина — по два номера вокруг текущего", () => {
    expect(pageNumbers(20, 10)).toEqual([1, "…", 8, 9, 10, 11, 12, "…", 20]);
  });
  test("начало — без троеточия слева", () => {
    expect(pageNumbers(20, 1)).toEqual([1, 2, 3, "…", 20]);
  });
  test("конец — без троеточия справа", () => {
    expect(pageNumbers(20, 20)).toEqual([1, "…", 18, 19, 20]);
  });
  test("одна страница — один номер", () => {
    expect(pageNumbers(1, 1)).toEqual([1]);
  });
  test("нет страниц — пусто", () => {
    expect(pageNumbers(0, 1)).toEqual([]);
  });
});
