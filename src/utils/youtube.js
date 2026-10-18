// YouTube: разбор адреса и ключ ролика/плейлиста.
// Авторство проверяется на сборке (src/utils/youtubeOwners.js), а не в браузере:
// раньше каждая страница игры ждала noembed.com и показывала плеер на 294 мс позже.

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
