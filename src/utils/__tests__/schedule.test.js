import { describe, test, expect } from "vitest";
import { isStreamFinished, splitSchedule } from "../schedule.js";

const today = "18.10.2026";
const stream = (date, time, endTime) => ({ date, time, endTime, game: "Стрим" });

const list = [
  stream("19.10.2026", "12:00", "16:00"),
  stream("18.10.2026", "10:00", "14:00"),
  stream("17.10.2026", "10:00", "14:00"),
];

describe("isStreamFinished", () => {
  test("сегодняшний стрим после конца — закончился", () => {
    expect(isStreamFinished(list[1], today, "15:00")).toBe(true);
  });
  test("сегодняшний стрим до конца — идёт", () => {
    expect(isStreamFinished(list[1], today, "11:00")).toBe(false);
  });
  test("завтрашний стрим не считается закончившимся", () => {
    expect(isStreamFinished(list[0], today, "23:59")).toBe(false);
  });
  test("без времени суток (пререндер) ничего не отбрасываем", () => {
    expect(isStreamFinished(list[1], today, "")).toBe(false);
  });
});

describe("splitSchedule", () => {
  test("утром сегодняшний стрим ещё впереди", () => {
    const { upcoming, past } = splitSchedule(list, today, "09:00");
    expect(upcoming.map((s) => s.date)).toEqual(["18.10.2026", "19.10.2026"]);
    expect(past.map((s) => s.date)).toEqual(["17.10.2026"]);
  });

  test("после конца сегодняшнего стрима он пропадает из ближайших", () => {
    const { upcoming } = splitSchedule(list, today, "15:00");
    expect(upcoming.map((s) => s.date)).toEqual(["19.10.2026"]);
  });

  test("без времени суток показываем всё, что не в прошлом", () => {
    const { upcoming } = splitSchedule(list, today, "");
    expect(upcoming.map((s) => s.date)).toEqual(["18.10.2026", "19.10.2026"]);
  });

  test("порядок наводится по дате, даже если данные пришли не по порядку", () => {
    const { upcoming } = splitSchedule(list, today, "09:00");
    expect(upcoming[0].date < upcoming[1].date).toBe(true);
  });

  test("прошедших не больше семи и свежие сверху", () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      stream(`${String(i + 1).padStart(2, "0")}.10.2026`, "10:00", "14:00")
    );
    const { past } = splitSchedule(many, today, "09:00");
    expect(past).toHaveLength(7);
    expect(past[0].date).toBe("10.10.2026");
    expect(past[6].date).toBe("04.10.2026");
  });
});
