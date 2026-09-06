import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaTwitch } from "react-icons/fa";
import { FiCalendar } from "react-icons/fi";
import { BRAND } from "../config/branding";
import { MASCOTS } from "../config/mascots";
import { safeGet, safeSet } from "../utils/storage";
import { afterLoad } from "../utils/idle";

const STATUS_KEY = "tiankami_twitch_status";
const AVATAR_KEY = "tiankami_twitch_avatar";
const STATUS_TTL = 5 * 60 * 1000;
const AVATAR_TTL = 24 * 60 * 60 * 1000; // 24 часа

export function TwitchWidgetInHero() {
  const [status, setStatus] = useState(null);
  const [avatar, setAvatar] = useState(MASCOTS.logo);

  useEffect(() => {
    let alive = true;
    const stop = afterLoad(() => {
    (async () => {
      const cached = safeGet(STATUS_KEY);
      if (cached && Date.now() - cached.ts < STATUS_TTL) {
        setStatus(cached);
      } else {
        try {
          const res = await fetch(
            `https://decapi.me/twitch/uptime/${BRAND.twitchLogin}`
          );
          const text = (await res.text()).trim();
          const next = {
            ts: Date.now(),
            live: !/offline|unknown|error/i.test(text),
            text,
          };
          safeSet(STATUS_KEY, next);
          if (alive) setStatus(next);
        } catch {
          if (alive) setStatus(cached || { live: false, text: "" });
        }
      }
      const av = safeGet(AVATAR_KEY);
      if (av && Date.now() - av.ts < AVATAR_TTL && av.url) {
        setAvatar(av.url);
      } else {
        try {
          const res = await fetch(
            `https://decapi.me/twitch/avatar/${BRAND.twitchLogin}`
          );
          const url = (await res.text()).trim();
          if (/^https?:\/\//.test(url)) {
            safeSet(AVATAR_KEY, { ts: Date.now(), url });
            if (alive) setAvatar(url);
          }
        } catch {
          /* остаётся локальный логотип */
        }
      }
    })();
    }, { interaction: true });
    return () => {
      alive = false;
      stop();
    };
  }, []);

  const live = status?.live;
  return (
    <div className="card flex items-center gap-4 p-4">
      <img
        src={avatar}
        alt="Аватар канала Tiankami"
        className="h-14 w-14 rounded-full border-2 border-pastel-pink object-cover shadow-glow-pink"
        loading="lazy"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-display text-lg font-extrabold text-ink">
            {BRAND.name}
          </span>
          <span
            className={
              "chip " +
              (live
                ? "bg-red-400/15 text-red-300 border border-red-400/30"
                : "bg-white/10 text-ink-dim border border-white/15")
            }
          >
            {status == null
              ? "…"
              : live
                ? `В эфире${status.text ? ` · ${status.text}` : ""}`
                : "не в эфире"}
          </span>
        </div>
        <p className="mt-0.5 truncate text-sm text-ink-dim">
          {live ? "Идём умирать в рогалики — залетай!" : "Стримы каждый день, кроме субботы"}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <a
          className="btn-primary !px-3 !py-1.5 text-sm"
          href={BRAND.links.twitch}
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaTwitch /> Смотреть
        </a>
        <Link className="btn-ghost !px-3 !py-1.5 text-sm" to="/schedule">
          <FiCalendar /> Расписание
        </Link>
      </div>
    </div>
  );
}
