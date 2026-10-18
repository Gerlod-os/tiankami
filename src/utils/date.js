// Единый парсер дат: DD.MM.YYYY и YYYY-MM-DD. Никогда не использовать new Date(str) напрямую!
export function parseRuDate(dateStr) {
  if (!dateStr || !String(dateStr).trim()) return null;
  const s = String(dateStr).trim();
  const ruMatch = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/); // DD.MM.YYYY
  if (ruMatch) {
    const [_, day, month, year] = ruMatch;
    return createSafeDate(parseInt(year, 10), parseInt(month, 10), parseInt(day, 10));
  }
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})$/); // YYYY-MM-DD
  if (isoMatch) {
    const [_, year, month, day] = isoMatch;
    return createSafeDate(parseInt(year, 10), parseInt(month, 10), parseInt(day, 10));
  }
  return null;
}

function createSafeDate(year, month, day) {
  const d = new Date(Date.UTC(year, month - 1, day));
  if (isNaN(d.getTime())) return null;
  if (
    d.getUTCDate() !== day ||
    d.getUTCMonth() !== month - 1 ||
    d.getUTCFullYear() !== year
  )
    return null;
  return d;
}

export function formatRuDate(date) {
  if (!date) return "";
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${date.getUTCFullYear()}`;
}

export function todayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

// Названия держу массивами, а не через Intl: пререндер считает даты в Node,
// браузер — в своём ICU, и расхождение даёт React #418 (уже ловили на сайте).
const WEEKDAYS_SHORT = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
const MONTHS_GENITIVE = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

/** «сб, 6 сентября» — для расписания, где день недели важнее года. */
export function formatRuDateLong(date) {
  if (!date) return "";
  return `${WEEKDAYS_SHORT[date.getUTCDay()]}, ${date.getUTCDate()} ${
    MONTHS_GENITIVE[date.getUTCMonth()]
  }`;
}

/**
 * Дата из ячейки таблицы → «дд.мм.гггг».
 * Понятную дату приводит, непонятную отдаёт как есть: молча переставить день
 * и месяц хуже, чем оставить строку, которую видно в отчёте.
 */
export function normalizeDateCell(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  const known = parseRuDate(s);
  if (known) return formatRuDate(known);
  // 8/27/2024 — запись «месяц/день/год». Разбираем только там, где спутать
  // нельзя: второе число больше 12 — значит это день, и наоборот.
  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (us) {
    const a = Number(us[1]);
    const b = Number(us[2]);
    const month = b > 12 ? a : a > 12 ? b : null;
    const day = b > 12 ? b : a > 12 ? a : null;
    if (month) {
      const d = createSafeDate(Number(us[3]), month, day);
      if (d) return formatRuDate(d);
    }
  }
  return s;
}
