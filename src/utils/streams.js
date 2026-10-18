// Прошедшие трансляции Twitch → записи для расписания.
// Twitch отдаёт историю записей (VOD): заголовок, время начала в UTC, длительность, игру.

const pad = (n) => String(n).padStart(2, "0");
const MARK = " | ";

/**
 * Заголовок без хвоста команд канала: «… | • !indiwd • !yt • !tg • !таблица».
 * Режем только если в хвосте есть «!» — иначе можно порезать живое название.
 */
export function cleanStreamTitle(title) {
  const s = String(title || "").trim();
  if (!s) return "";
  const cut = s.indexOf(MARK);
  if (cut > 0) {
    const tail = s.slice(cut + MARK.length);
    if (tail.includes("!")) return s.slice(0, cut).trim();
  }
  return s;
}

/** Запись Twitch (createdAt в UTC) → строка расписания по Москве. */
export function videoToEntry(node) {
  if (!node || !node.createdAt) return null;
  const created = new Date(node.createdAt);
  if (Number.isNaN(created.getTime())) return null;

  const start = new Date(created.getTime() + 3 * 3600e3); // МСК, перевода часов нет
  const lengthSec = Number(node.lengthSeconds) || 0;
  const end = new Date(start.getTime() + lengthSec * 1000);

  const entry = {
    date: `${pad(start.getUTCDate())}.${pad(start.getUTCMonth() + 1)}.${start.getUTCFullYear()}`,
    time: `${pad(start.getUTCHours())}:${pad(start.getUTCMinutes())}`,
    game: cleanStreamTitle(node.title),
    category: node.game?.name || "",
    streamLink: node.id ? `https://www.twitch.tv/videos/${node.id}` : "https://twitch.tv/tiankami",
  };
  // Стрим, переваливший за полночь, диапазоном не показываем: конец был бы «меньше» начала.
  if (lengthSec && end.getUTCDate() === start.getUTCDate()) {
    entry.endTime = `${pad(end.getUTCHours())}:${pad(end.getUTCMinutes())}`;
  }
  return entry;
}
