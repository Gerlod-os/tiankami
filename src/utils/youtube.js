// YouTube: разбор адреса и ключ ролика/плейлиста.
// Авторство проверяется на сборке (src/utils/youtubeOwners.js), а не в браузере:
// раньше каждая страница игры ждала noembed.com и показывала плеер на 294 мс позже.

// Карта «ID плейлиста → ID первого ролика», собрана scripts/yt-posters.mjs.
// Нужна, чтобы постер плеера был кадром видео, а не обложкой игры.
import posters from "../data/youtube-posters.json";

export function parseYouTubeUrl(url) {
  const s = String(url || "").trim();
  if (!/^https?:\/\//i.test(s)) return null;
  const video = s.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i
  );
  const playlist = s.match(/[?&]list=([\w-]+)/i);
  if (!video && !playlist) return null;
  const videoId = video ? video[1] : null;
  const playlistId = playlist ? playlist[1] : null;
  let embedUrl = null;
  if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
  else if (playlistId)
    embedUrl = `https://www.youtube.com/embed/videoseries?list=${playlistId}`;
  return { videoId, playlistId, embedUrl };
}

/**
 * ID ролика для постера: у обычной ссылки берём videoId напрямую,
 * у плейлиста — первый ролик из карты. null, если кадра нет.
 */
export function posterVideoId(url) {
  const yt = parseYouTubeUrl(url);
  if (!yt) return null;
  if (yt.videoId) return yt.videoId;
  return posters[yt.playlistId] || null;
}
