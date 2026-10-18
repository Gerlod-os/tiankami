import { describe, test, expect } from "vitest";
import { pagesCount, pageSlice, pageNumbers } from "../pagination.js";

const LIST = Array.from({ length: 459 }, (_, i) => i);

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

describe("pageSlice", () => {
  test("первая страница — первые 24 карточки", () => {
    const page = pageSlice(LIST, 1, 24);
    expect(page).toHaveLength(24);
    expect(page[0]).toBe(0);
  });
  test("вторая страница начинается с 25-й карточки, а не с первой", () => {
    const page = pageSlice(LIST, 2, 24);
    expect(page).toHaveLength(24);
    expect(page[0]).toBe(24);
    expect(page).not.toContain(0);
  });
  test("последняя страница — остаток, а не полный шаг", () => {
    expect(pageSlice(LIST, 20, 24)).toHaveLength(3);
  });
  test("страница за пределами — последняя", () => {
    expect(pageSlice(LIST, 99, 24)).toHaveLength(3);
  });
  test("нулевая и мусорная страница — первая", () => {
    expect(pageSlice(LIST, 0, 24)[0]).toBe(0);
    expect(pageSlice(LIST, "", 24)[0]).toBe(0);
  });
  test("пустой список — пусто", () => {
    expect(pageSlice([], 1, 24)).toEqual([]);
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
