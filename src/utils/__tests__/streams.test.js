import { describe, test, expect } from "vitest";
import { cleanStreamTitle, videoToEntry } from "../streams.js";

describe("cleanStreamTitle", () => {
  test("отрезает хвост команд канала", () => {
    expect(
      cleanStreamTitle(
        "Закрываем локи на 100% и финалим игру! | • !indiwd • !yt • !tg • !таблица"
      )
    ).toBe("Закрываем локи на 100% и финалим игру!");
  });

  test("заголовок без хвоста не трогает", () => {
    expect(cleanStreamTitle("Парируем и кайфуем в новом соулсе!")).toBe(
      "Парируем и кайфуем в новом соулсе!"
    );
  });

  test("вертикальная черта без команд остаётся в названии", () => {
    expect(cleanStreamTitle("Стрим | Разбор игры")).toBe("Стрим | Разбор игры");
  });

  test("пустое остаётся пустым", () => {
    expect(cleanStreamTitle("")).toBe("");
    expect(cleanStreamTitle(null)).toBe("");
  });
});

describe("videoToEntry", () => {
  test("время UTC переводится в московское", () => {
    const entry = videoToEntry({
      id: "2903087930",
      title: "Закрываем локи на 100% и финалим игру! | • !yt",
      createdAt: "2026-10-17T09:45:28Z",
      lengthSeconds: 32073,
      game: { name: "Castlevania: Belmont's Curse" },
    });
    expect(entry).toMatchObject({
      date: "17.10.2026",
      time: "12:45",
      game: "Закрываем локи на 100% и финалим игру!",
      category: "Castlevania: Belmont's Curse",
      streamLink: "https://www.twitch.tv/videos/2903087930",
    });
  });

  test("конец считается по длительности", () => {
    const entry = videoToEntry({
      id: "1",
      title: "Стрим",
      createdAt: "2026-10-14T08:17:16Z", // 11:17 МСК
      lengthSeconds: 42083, // 11:41:23
      game: { name: "Valor Mortis" },
    });
    expect(entry.time).toBe("11:17");
    expect(entry.endTime).toBe("22:58");
  });

  test("стрим за полночь не получает диапазон", () => {
    const entry = videoToEntry({
      id: "2",
      title: "Ночной",
      createdAt: "2026-10-14T20:00:00Z", // 23:00 МСК
      lengthSeconds: 7200,
      game: { name: "X" },
    });
    expect(entry.date).toBe("14.10.2026");
    expect(entry.endTime).toBeUndefined();
  });

  test("без даты записи — пропуск", () => {
    expect(videoToEntry({ id: "3", title: "Без даты" })).toBeNull();
  });
});
