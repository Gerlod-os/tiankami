// Авторство ссылок YouTube — один раз на сборке, а не в браузере.
//
// Раньше каждая страница игры перед показом плеера ждала noembed.com:
// замер 18.10.2026 — запрос уходил на 109 мс, iframe появлялся на 403 мс.
// Ответ не меняется от визита к визиту, поэтому его место в данных сборки.
//
// Правило прежнее: плеер показываем, только если видео с канала стримера.
// Не смогли проверить (сервис молчит, ссылка битая) — показываем: молча
// спрятать рабочий плеер хуже, чем показать чужой ролик.
import fs from "node:fs";
import { parseYouTubeUrl } from "./youtube.js";

const NOEMBED = "https://noembed.com/embed?url=";

// «Tian Kami» и «Tiankami» — один канал: на YouTube имя с пробелом.
// Сравнивать в лоб нельзя: раньше из-за этого 48 своих видео считались чужими
// и плеер на них не показывался (найдено 18.10.2026).
const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, "");

function readCache(file) {
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

async function askNoembed(url, fetchImpl, timeoutMs) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(NOEMBED + encodeURIComponent(url), {
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json?.error) return null;
    const author = String(json?.author_name || "").trim().toLowerCase();
    return author || null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/**
 * Проставляет games[].youtubeOwn: true — своё, false — чужое, undefined — не знаем.
 * Результат кэшируется в файле: проверяем только новые ссылки.
 * @returns {{checked:number, own:number, foreign:number, unknown:number, cached:number}}
 */
export async function markYoutubeOwners(games, options = {}) {
  const {
    cachePath,
    channelName = "Tiankami",
    fetchImpl = globalThis.fetch,
    concurrency = 6,
    timeoutMs = 5000,
  } = options;
  const cache = cachePath ? readCache(cachePath) : {};
  const wanted = new Map(); // ключ → адрес, только непроверенные
  let cached = 0;

  for (const g of games || []) {
    if (!g?.youtube) continue;
    // Плейлисты noembed не разбирает («no matching providers found»):
    // для них проверки нет, плеер показываем. Спрашивать бессмысленно.
    const key = parseYouTubeUrl(g.youtube)?.videoId;
    if (!key) continue;
    if (cache[key]) {
      g.youtubeOwn = cache[key] === "match";
      cached += 1;
    } else if (!wanted.has(key)) {
      wanted.set(key, g.youtube);
    }
  }

  const entries = [...wanted.entries()];
  const verdict = new Map();
  let cursor = 0;
  let own = 0;
  let foreign = 0;
  let unknown = 0;

  const worker = async () => {
    while (cursor < entries.length) {
      const [key, url] = entries[cursor++];
      const author = await askNoembed(url, fetchImpl, timeoutMs);
      if (!author) {
        unknown += 1;
        verdict.set(key, null);
        continue;
      }
      const match = norm(author) === norm(channelName);
      verdict.set(key, match ? "match" : "mismatch");
      if (match) own += 1;
      else foreign += 1;
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, entries.length) }, worker),
  );

  for (const g of games || []) {
    if (!g?.youtube || g.youtubeOwn !== undefined) continue;
    const key = parseYouTubeUrl(g.youtube)?.videoId;
    if (!key) continue;
    const v = verdict.get(key);
    if (v === "match") g.youtubeOwn = true;
    else if (v === "mismatch") g.youtubeOwn = false;
  }

  // В кэш — только определённые ответы: «не знаю» перепроверим в следующий раз.
  if (cachePath) {
    let changed = false;
    for (const [key, v] of verdict) {
      if (v && cache[key] !== v) {
        cache[key] = v;
        changed = true;
      }
    }
    if (changed) fs.writeFileSync(cachePath, JSON.stringify(cache, null, 1));
  }

  return { checked: entries.length, own, foreign, unknown, cached };
}
