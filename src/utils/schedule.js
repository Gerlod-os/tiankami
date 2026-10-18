import { useEffect, useState } from "react";
import { parseRuDate } from "./date";

/**
 * Текущее время по Москве, «ЧЧ:ММ». Считается только в браузере: в пререндере
 * его нет, иначе серверная разметка разойдётся с клиентской (React #418).
 * Пока пусто — страница показывает расписание без учёта времени суток.
 */
export function useMoscowTime() {
  const [now, setNow] = useState("");
  useEffect(() => {
    const tick = () => {
      const n = new Date(Date.now() + 3 * 3600e3);
      setNow(
        `${String(n.getUTCHours()).padStart(2, "0")}:${String(n.getUTCMinutes()).padStart(2, "0")}`
      );
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/** Сегодняшний стрим, который уже закончился, в «ближайшие» не берём. */
export function isStreamFinished(stream, todayRu, nowHHMM) {
  if (!stream || !nowHHMM || stream.date !== todayRu) return false;
  return String(stream.endTime || stream.time || "23:59") < nowHHMM;
}

/**
 * Делит расписание на ближайшие и прошедшие.
 * Сортировка по дате обязательна: Твич отдаёт сетку не по порядку.
 */
export function splitSchedule(list, todayRu, nowHHMM) {
  const sorted = [...(list || [])].sort(
    (a, b) => (parseRuDate(a.date)?.getTime() || 0) - (parseRuDate(b.date)?.getTime() || 0)
  );
  const todayMs = parseRuDate(todayRu)?.getTime() ?? 0;
  const upcoming = sorted.filter((s) => {
    const ms = parseRuDate(s.date)?.getTime() || 0;
    return ms >= todayMs && !isStreamFinished(s, todayRu, nowHHMM);
  });
  const past = sorted
    .filter((s) => (parseRuDate(s.date)?.getTime() || 0) < todayMs)
    .slice(-5)
    .reverse();
  return { upcoming, past };
}
