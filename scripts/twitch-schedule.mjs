// Расписание стримов с Twitch: календарь канала → записи для src/data/schedule.json.
// Календарь публичный (ICS без токена), поэтому ни ключей, ни секретов сборке не нужно.
import { parseIcsEvents, expandEvents } from "../src/utils/ics.js";

// Сколько дней вперёд показывать. Неделя: сетка повторяется, две недели дают
// шесть почти одинаковых строк подряд — читать невозможно.
export const SCHEDULE_DAYS = 7;

/** Сегодняшняя дата по Москве (сборка на GitHub живёт в UTC). */
export function todayMoscow() {
  const now = new Date(Date.now() + 3 * 3600e3);
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Скачивает календарь и разворачивает повторы на SCHEDULE_DAYS дней вперёд.
 * Бросает исключение, если календарь пуст — вызывающий решает, чем заменить.
 */
export async function twitchSchedule(fetchText, url) {
  const ics = await fetchText(url, 3, 15000);
  const events = parseIcsEvents(ics);
  if (!events.length) throw new Error("в календаре нет событий");
  return expandEvents(events, todayMoscow(), SCHEDULE_DAYS).map((e) => ({
    date: e.date,
    time: e.time,
    endTime: e.endTime,
    game: e.game,
    streamLink: e.streamLink,
  }));
}
