// YouTube: авторство канала стримера через noembed.
// ЖЁСТКОЕ ПРАВИЛО: не более 20 запросов к noembed за сессию; результат кэшируется бессрочно.
import { BRAND } from "../config/branding";
import { safeGet, safeSet, sessionGet, sessionSet } from "./storage";

export const NOEMBED_SESSION_LIMIT = 20;
const SESSION_KEY = "tiankami_noembed_session_count";

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

// 'match' | 'mismatch' | 'unknown'
export async function checkYouTubeAuthor(url) {
  const info = parseYouTubeUrl(url);
  if (!info) return "unknown";
  const key = info.videoId || info.playlistId;
  const cacheKey = `tiankami_yt_author_${key}`;
  const cached = safeGet(cacheKey);
  if (cached) return cached;

  const used = sessionGet(SESSION_KEY) || 0;
  if (used >= NOEMBED_SESSION_LIMIT) return "unknown"; // лимит сессии исчерпан
  sessionSet(SESSION_KEY, used + 1);

  try {
    const res = await fetch(
      `https://noembed.com/embed?url=${encodeURIComponent(url)}`
    );
    if (!res.ok) return "unknown";
    const json = await res.json();
    if (json.error) return "unknown";
    const author = String(json.author_name || "").trim().toLowerCase();
    if (!author) return "unknown";
    const result =
      author === BRAND.youtubeChannelName.toLowerCase() ? "match" : "mismatch";
    safeSet(cacheKey, result); // бессрочный кэш
    return result;
  } catch {
    return "unknown";
  }
}
