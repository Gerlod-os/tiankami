import { useEffect, useState } from "react";
import { FaTwitch } from "react-icons/fa";
import { BRAND } from "../config/branding";
import { safeGet, safeSet } from "../utils/storage";
import { afterLoad } from "../utils/idle";

const CACHE_KEY = "tiankami_twitch_status";
const TTL = 5 * 60 * 1000; // 5 минут

async function loadStatus() {
  const cached = safeGet(CACHE_KEY);
  if (cached && Date.now() - cached.ts < TTL) return cached;
  try {
    const res = await fetch(`https://decapi.me/twitch/uptime/${BRAND.twitchLogin}`);
    const text = (await res.text()).trim();
    const live = !/offline|unknown|error/i.test(text);
    const next = { ts: Date.now(), live, text };
    safeSet(CACHE_KEY, next);
    return next;
  } catch {
    return cached || { ts: Date.now(), live: false, text: "" };
  }
}

export function TwitchHeaderWidget() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let alive = true;
    const stop = afterLoad(
      () => {
        loadStatus().then((s) => {
          if (alive) setStatus(s);
        });
      },
      { interaction: true }
    );
    return () => {
      alive = false;
      stop();
    };
  }, []);

  const live = status?.live;
  return (
    <a
      href={BRAND.links.twitch}
      target="_blank"
      rel="noopener noreferrer"
      className="chip border border-white/10 bg-white/5 transition hover:border-pastel-purple/50 hover:shadow-glow-purple"
      title={live ? `В эфире: ${status?.text || ""}` : "Канал на Twitch"}
    >
      <FaTwitch className="text-pastel-purple" />
      <span
        className={
          "h-2 w-2 rounded-full " +
          (live ? "bg-red-400 animate-pulseSoft" : "bg-ink-faint")
        }
      />
      <span className={live ? "text-red-300" : "text-ink-dim"}>
        {status == null ? "Twitch" : live ? "LIVE" : "offline"}
      </span>
    </a>
  );
}
