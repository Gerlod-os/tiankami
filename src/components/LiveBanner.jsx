import { useEffect, useState } from "react";
import { FaTwitch } from "react-icons/fa";
import { BRAND } from "../config/branding";
import { safeGet, safeSet } from "../utils/storage";
import { afterLoad } from "../utils/idle";

const KEY = "tiankami_twitch_status";
const TTL = 5 * 60 * 1000;

// Стримерская LIVE-плашка: появляется, когда Тиан в эфире (кэш 5 мин).
export function LiveBanner() {
  const [live, setLive] = useState(null);

  useEffect(() => {
    let alive = true;
    const stop = afterLoad(
      () => {
        (async () => {
          const cached = safeGet(KEY);
          if (cached && Date.now() - cached.ts < TTL) {
            if (alive) setLive(cached.live ? cached : null);
            return;
          }
          try {
            const res = await fetch(`https://decapi.me/twitch/uptime/${BRAND.twitchLogin}`);
            const text = (await res.text()).trim();
            // Пустой ответ — это не эфир. Раньше регулярка на пустой строке
            // не срабатывала, и плашка показывала LIVE при пустом 200
            // (проверка 18.11.2026).
            const next = { ts: Date.now(), live: text.length > 0 && !/offline|unknown|error/i.test(text), text };
            safeSet(KEY, next);
            if (alive) setLive(next.live ? next : null);
          } catch {
            if (alive) setLive(null);
          }
        })();
      },
      { interaction: true }
    );
    return () => {
      alive = false;
      stop();
    };
  }, []);

  if (!live) return null;
  return (
    <a
      href={BRAND.links.twitch}
      target="_blank"
      rel="noopener noreferrer"
      className="card flex animate-fadeUp items-center gap-3 border-red-400/40 p-3 transition hover:shadow-[0_0_30px_rgba(248,113,113,0.35)]"
      style={{ borderColor: "rgba(248,113,113,0.4)" }}
    >
      <span className="relative flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
      </span>
      <span className="min-w-0 flex-1 truncate font-display font-extrabold text-ink">
        Тиан В ЭФИРЕ {live.text ? `уже ${live.text}` : ""} — идём умирать в рогалики!
      </span>
      <span className="btn-primary !px-3 !py-1.5 text-xs">
        <FaTwitch /> Смотреть
      </span>
    </a>
  );
}
