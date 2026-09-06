import { useEffect, useState } from "react";
import { parseRuDate } from "./date.js";

// Дата из таблицы + время МСК → момент времени (UTC+3)
export function streamMoment(dateRu, timeStr) {
  const d = parseRuDate(dateRu);
  if (!d) return null;
  const m = String(timeStr || "").match(/(\d{1,2}):(\d{2})/);
  const h = m ? parseInt(m[1], 10) : 12;
  const min = m ? parseInt(m[2], 10) : 0;
  return new Date(d.getTime() + h * 3600_000 + min * 60_000 - 3 * 3600_000);
}

// Обратный отсчёт. На SSR — заглушка, тик только в браузере (без hydration-mismatch).
export function useCountdown(target) {
  const [left, setLeft] = useState(null);
  useEffect(() => {
    if (!target) {
      setLeft(null);
      return undefined;
    }
    const tick = () =>
      setLeft(Math.max(0, target.getTime() - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [target]);
  if (left == null) return null;
  const s = Math.floor(left / 1000);
  return {
    done: left <= 0,
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}
