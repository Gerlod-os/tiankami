import { describe, test, expect } from "vitest";
import { parseIcsEvents, expandEvents } from "../ics.js";

// Фрагмент настоящего календаря Twitch: те же поля и порядок строк.
const ICS = [
  "BEGIN:VCALENDAR",
  "PRODID:-//twitch.tv//StreamSchedule//1.0",
  "VERSION:2.0",
  "NAME:TianKami",
  "BEGIN:VEVENT",
  "UID:mo-1",
  "DTSTAMP:20241022T081537Z",
  "DTSTART;TZID=/Europe/Moscow:20241028T120000",
  "DTEND;TZID=/Europe/Moscow:20241028T160000",
  "SUMMARY:Ежедневные рогалики и новинки!",
  "CATEGORIES:Games + Demos",
  "RRULE:FREQ=WEEKLY;BYDAY=MO",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "UID:sa-1",
  "DTSTART;TZID=/Europe/Moscow:20241026T110000",
  "DTEND;TZID=/Europe/Moscow:20241026T150000",
  "SUMMARY:ШОУ Мастер Игорей раз в две субботы!",
  "RRULE:FREQ=WEEKLY;BYDAY=SA",
  "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");

const window = () => new Date(Date.UTC(2026, 9, 18)); // 18.10.2026, воскресенье

describe("parseIcsEvents", () => {
  test("читает события, время и правило повтора", () => {
    const events = parseIcsEvents(ICS);
    expect(events).toHaveLength(2);
    expect(events[0].summary).toBe("Ежедневные рогалики и новинки!");
    expect(events[0].start).toMatchObject({ y: 2024, mo: 10, d: 28, h: 12, mi: 0 });
    expect(events[0].end).toMatchObject({ h: 16, mi: 0 });
    expect(events[0].rrule).toMatchObject({ freq: "WEEKLY", byday: ["MO"], interval: 1 });
    expect(events[1].rrule.byday).toEqual(["SA"]);
  });

  test("перенос строки с пробелом не ломает разбор", () => {
    // По RFC 5545 перенос — это CRLF + пробел, и этот пробел в значение не входит.
    const folded = ICS.replace("SUMMARY:ШОУ Мастер Игорей", "SUMMARY:ШОУ Мастер Игоре\r\n й");
    const events = parseIcsEvents(folded);
    expect(events[1].summary).toBe("ШОУ Мастер Игорей раз в две субботы!");
  });
});

describe("expandEvents", () => {
  test("неделя 18–24.10.2026: понедельник и суббота, ровно по одному разу", () => {
    const out = expandEvents(parseIcsEvents(ICS), window(), 7);
    expect(out.map((e) => e.date)).toEqual(["19.10.2026", "24.10.2026"]);
    expect(out[0]).toMatchObject({ time: "12:00", endTime: "16:00", game: "Ежедневные рогалики и новинки!" });
    expect(out[1]).toMatchObject({ time: "11:00", endTime: "15:00" });
  });

  test("до начала повтора событий нет", () => {
    const out = expandEvents(parseIcsEvents(ICS), new Date(Date.UTC(2024, 9, 1)), 7);
    expect(out).toHaveLength(0);
  });

  test("EXDATE убирает конкретный день", () => {
    const withEx = ICS.replace(
      "RRULE:FREQ=WEEKLY;BYDAY=MO",
      "EXDATE;TZID=/Europe/Moscow:20261019T120000\r\nRRULE:FREQ=WEEKLY;BYDAY=MO"
    );
    const out = expandEvents(parseIcsEvents(withEx), window(), 7);
    expect(out.map((e) => e.date)).toEqual(["24.10.2026"]);
  });

  test("время в UTC переводится в московское", () => {
    const utc = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "DTSTART:20261019T070000Z",
      "DTEND:20261019T110000Z",
      "SUMMARY:Стрим по UTC",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const out = expandEvents(parseIcsEvents(utc), window(), 7);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ date: "19.10.2026", time: "10:00", endTime: "14:00" });
  });

  test("событие без правила показывается только в свой день", () => {
    const single = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "DTSTART;TZID=/Europe/Moscow:20261021T190000",
      "DTEND;TZID=/Europe/Moscow:20261021T220000",
      "SUMMARY:Разовый стрим",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const out = expandEvents(parseIcsEvents(single), window(), 7);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ date: "21.10.2026", time: "19:00" });
  });

  test("отменённое событие не попадает в список", () => {
    const cancelled = ICS.replace("RRULE:FREQ=WEEKLY;BYDAY=MO", "STATUS:CANCELLED\r\nRRULE:FREQ=WEEKLY;BYDAY=MO");
    const out = expandEvents(parseIcsEvents(cancelled), window(), 7);
    expect(out.map((e) => e.date)).toEqual(["24.10.2026"]);
  });

  test("повтор раз в две недели учитывает INTERVAL", () => {
    const biweekly = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "DTSTART;TZID=/Europe/Moscow:20261005T120000", // понедельник
      "DTEND;TZID=/Europe/Moscow:20261005T160000",
      "SUMMARY:Раз в две недели",
      "RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const out = expandEvents(parseIcsEvents(biweekly), window(), 21);
    // 05.10 — нулевая неделя, дальше чётные: 19.10 и 02.11.
    expect(out.map((e) => e.date)).toEqual(["19.10.2026", "02.11.2026"]);
  });
});
