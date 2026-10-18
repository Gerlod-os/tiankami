// Плейлисты канала на YouTube → ссылки для игр.
// Плейлисты называются по названию игры, поэтому совпадение ищется по названию.
// Заполняются только пустые поля: ссылка из таблицы главнее, её не переписываем.

const norm = (s) => String(s || "").toLowerCase().replace(/[^0-9a-zа-яё]+/gi, "");

export const playlistUrl = (id) => `https://www.youtube.com/playlist?list=${id}`;

/** Карта «нормализованное название плейлиста» → адрес. */
export function playlistsByTitle(playlists) {
  const map = new Map();
  for (const p of playlists || []) {
    if (!p?.id || !p?.title) continue;
    const key = norm(p.title);
    if (!map.has(key)) map.set(key, playlistUrl(p.id));
  }
  return map;
}

/**
 * Дополняет пустые `youtube` у игр, которым нашёлся одноимённый плейлист.
 * Возвращает { games, filled } — filled это названия, которым поставили ссылку.
 */
export function fillYouTubeFromPlaylists(games, playlists) {
  const map = playlistsByTitle(playlists);
  const filled = [];
  const out = (games || []).map((g) => {
    if (g.youtube || !g.title) return g;
    const url = map.get(norm(g.title));
    if (!url) return g;
    filled.push(g.title);
    return { ...g, youtube: url };
  });
  return { games: out, filled };
}
