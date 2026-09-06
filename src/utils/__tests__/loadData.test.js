import { describe, test, expect } from "vitest";
import { normalizeScheduleRows, enrichWithLocal } from "../loadData.js";
import { hashStr } from "../storage.js";

describe("normalizeScheduleRows", () => {
  test("ISO-даты конвертируются в DD.MM.YYYY и сортируются", () => {
    const rows = [
      { date: "2026-09-06", time: "10:00", game: "Рогалики", streamLink: "" },
      { date: "04.09.2026", time: "12:00", game: "МИ", streamLink: "" },
    ];
    const s = normalizeScheduleRows(rows);
    expect(s[0].date).toBe("04.09.2026");
    expect(s[1].date).toBe("06.09.2026");
  });
  test("неполные строки отбрасываются", () => {
    const s = normalizeScheduleRows([
      { date: "2026-09-06", time: "", game: "" },
      { date: "гараж", time: "10:00", game: "X" },
    ]);
    expect(s).toHaveLength(0);
  });
});

describe("enrichWithLocal / storage", () => {
  test("enrichWithLocal не ломает игры без appId", () => {
    const g = enrichWithLocal([{ title: "Нет игры такой", slug: "x" }]);
    expect(g[0]).toEqual({ title: "Нет игры такой", slug: "x" });
  });
  test("hashStr детерминирован и чувствителен", () => {
    expect(hashStr("abc")).toBe(hashStr("abc"));
    expect(hashStr("abc")).not.toBe(hashStr("abd"));
  });
});
