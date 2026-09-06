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
