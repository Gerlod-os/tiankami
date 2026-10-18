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
 * Дополняет пустые `youtube` у игр: сначала одноимённый плейлист, потом видео
 * канала (плейлиста может не быть вовсе — MINOS на канале пятью видео).
 * `videos` — [{ game, url }] из scripts/yt-videos.mjs.
 * Возвращает { games, filled, fromVideos }.
 */
export function fillYouTubeFromPlaylists(games, playlists, videos = []) {
  const map = playlistsByTitle(playlists);
  const videoMap = new Map(
    (videos || [])
      .filter((v) => v?.game && v?.url)
      .map((v) => [norm(v.game), v.url]),
  );
  const filled = [];
  const fromVideos = [];
  const out = (games || []).map((g) => {
    if (g.youtube || !g.title) return g;
    const url = map.get(norm(g.title));
    if (url) {
      filled.push(g.title);
      return { ...g, youtube: url };
    }
    const video = videoMap.get(norm(g.title));
    if (video) {
      fromVideos.push(g.title);
      return { ...g, youtube: video };
    }
    return g;
  });
  return { games: out, filled, fromVideos };
}
