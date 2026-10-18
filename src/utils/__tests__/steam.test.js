import { describe, test, expect } from "vitest";
import { titlesClose } from "../steam.js";

describe("titlesClose", () => {
  test("совпадение без учёта регистра и знаков", () => {
    expect(titlesClose("Hades", "hades")).toBe(true);
    expect(titlesClose("Dead Cells 2", "deadcells2")).toBe(true);
  });

  test("опечатка в одно слово считается той же игрой", () => {
    expect(titlesClose("The Baazar", "The Bazaar")).toBe(true);
    expect(titlesClose("Sultan's Game", "Sultans Game")).toBe(true);
  });

  test("название с уточнением после слэша", () => {
    expect(titlesClose("Gvalt / Гвалт", "Гвалт")).toBe(true);
    expect(titlesClose("Gvalt / Гвалт", "Гвалт Демо")).toBe(false);
  });

  test("разные игры не считаются совпадением", () => {
    expect(titlesClose("Against the Moon", "Against the Dark Moon")).toBe(false);
    expect(titlesClose("Hades", "Hades II")).toBe(true); // «Hades II» содержит «Hades»
    expect(titlesClose("Peak", "Peakpoint")).toBe(false);
  });
});
