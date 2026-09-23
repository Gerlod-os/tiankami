import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  FaTwitch,
  FaYoutube,
  FaDiscord,
  FaVk,
  FaTelegramPlane,
} from "react-icons/fa";
import {
  FiHome,
  FiGrid,
  FiFolder,
  FiCalendar,
  FiInfo,
  FiRefreshCw,
  FiMenu,
  FiX,
  FiAward,
} from "react-icons/fi";
import { BRAND } from "../config/branding";
import { MASCOTS } from "../config/mascots";
import { TwitchHeaderWidget } from "./TwitchHeaderWidget";
import { FxPanel } from "./FxPanel";
import { YandexMetrika } from "./YandexMetrika";
import { useData } from "./DataProvider";

const NAV = [
  { to: "/", label: "Главная", icon: FiHome, end: true },
  { to: "/catalog", label: "Каталог", icon: FiGrid },
  { to: "/collections", label: "Подборки", icon: FiFolder },
  { to: "/mi", label: "МИ", icon: FiAward },
  { to: "/schedule", label: "Расписание", icon: FiCalendar },
  { to: "/about", label: "Обо мне", icon: FiInfo },
];

const SOCIALS = [
  {
    href: "twitch",
    icon: FaTwitch,
    cls: "soc-twitch",
    label: "Twitch канал Tiankami",
  },
  {
    href: "youtube",
    icon: FaYoutube,
    cls: "soc-youtube",
    label: "YouTube канал Tiankami",
  },
  {
    href: "discord",
    icon: FaDiscord,
    cls: "soc-discord",
    label: "Discord коммьюнити",
  },
  { href: "vk", icon: FaVk, cls: "soc-vk", label: "ВКонтакте" },
  {
    href: "telegram",
    icon: FaTelegramPlane,
    cls: "soc-telegram",
    label: "Телеграм",
  },
];

export function Layout({ children }) {
  const location = useLocation();
  const { refresh, refreshing, resetCache } = useData();
  const [menuOpen, setMenuOpen] = useState(false);
  const [flash, setFlash] = useState(0);
  const [flip, setFlip] = useState(0);

  const firstRoute = useRef(true);
  useEffect(() => {
    window.scrollTo({ top: 0 });
    setMenuOpen(false);
    // warp-вспышка только при SPA-переходах, НЕ на первичной загрузке (F1)
    if (firstRoute.current) {
      firstRoute.current = false;
      return;
    }
    setFlash((f) => f + 1);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <YandexMetrika />
      <FxPanel />
      {flash > 0 && (
        <div key={flash} className="warp-flash" aria-hidden="true" />
      )}

      <header className="sticky top-0 z-40 border-b border-white/5 bg-night-800/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link
            to="/"
            className="group flex items-center gap-3"
            aria-label="TianKami — на главную"
          >
            <img
              key={flip}
              src={MASCOTS.logo}
              alt="Аватар Tiankami — кроассан-геймпад"
              onClick={() => setFlip((f) => f + 1)}
              className={
                "h-11 w-11 cursor-pointer rounded-full border-2 border-white object-cover shadow-glow-pink transition-transform group-hover:scale-105 " +
                (flip > 0 ? "logo-flip" : "")
              }
            />
            <span className="leading-tight">
              <span className="section-accent block font-display text-xl font-black tracking-wide">
                TianKami
              </span>
              <span className="block text-[11px] font-semibold uppercase tracking-widest text-ink-faint">
                {BRAND.tagline} · рогалики
              </span>
            </span>
          </Link>

          <nav
            className="mx-auto hidden gap-1 md:flex"
            aria-label="Основная навигация"
          >
            {NAV.map(({ to, label, icon: Icon, end }) => {
              const iconColor =
                to === "/"
                  ? "text-pastel-pink"
                  : to === "/catalog"
                    ? "text-pastel-mint"
                    : to === "/collections"
                      ? "text-pastel-blue"
                      : to === "/mi"
                        ? "text-pastel-amber"
                        : "text-pastel-purple";
              return (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    "nav-link group flex items-center gap-1.5 " +
                    (isActive ? "nav-link-active" : "")
                  }
                >
                  <span
                    className={`transition-transform group-hover:scale-110 ${iconColor}`}
                  >
                    <Icon className="text-base" />
                  </span>
                  {label}
                </NavLink>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <TwitchHeaderWidget />
            <div className="hidden items-center gap-1 xl:flex">
              {SOCIALS.map(({ href, icon: Icon, cls, label }) => (
                <a
                  key={href}
                  className={"soc " + cls}
                  href={BRAND.links[href]}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                >
                  <Icon />
                </a>
              ))}
            </div>
            <button
              type="button"
              className="btn-ghost !p-3 md:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Открыть меню"
              aria-expanded={menuOpen}
            >
              <FiMenu />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-night-900/70 backdrop-blur-sm md:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <div
            className="drawer md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Меню"
          >
            <div className="mb-6 flex items-center justify-between">
              <img
                src={MASCOTS.logo}
                alt=""
                className="h-10 w-10 rounded-full border-2 border-white object-cover"
              />
              <button
                type="button"
                className="btn-ghost !p-3"
                onClick={() => setMenuOpen(false)}
                aria-label="Закрыть меню"
              >
                <FiX />
              </button>
            </div>
            <nav
              className="flex flex-col gap-1"
              aria-label="Мобильная навигация"
            >
              {NAV.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    "flex items-center gap-3 rounded-btn px-4 py-3 font-display font-bold " +
                    (isActive
                      ? "bg-pastel-pink/15 text-pastel-pink"
                      : "text-ink-dim hover:bg-white/5 hover:text-ink")
                  }
                >
                  <Icon /> {label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-6 flex gap-2">
              {SOCIALS.map(({ href, icon: Icon, cls, label }) => (
                <a
                  key={href}
                  className={"soc " + cls}
                  href={BRAND.links[href]}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>
        </>
      )}

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        {children}
      </main>

      <footer className="border-t border-white/5 bg-night-900/60">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <img
                src={MASCOTS.logo}
                alt=""
                className="h-9 w-9 rounded-full border border-pastel-purple/60 object-cover"
                loading="lazy"
              />
              <span className="section-accent font-display text-lg font-black">
                TianKami
              </span>
            </div>
            <p className="mt-3 text-sm text-ink-dim">
              Уютный хардкор: рогалики, новинки в первые дни релиза, МИ и
              ламповое коммьюнити. {BRAND.footerText}
            </p>
          </div>
          <div className="text-sm">
            <h3 className="font-display font-extrabold text-ink">Разделы</h3>
            <ul className="mt-3 grid grid-cols-2 gap-2 text-ink-dim">
              {NAV.map(({ to, label }) => (
                <li key={to}>
                  <Link className="transition hover:text-pastel-pink" to={to}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="text-sm">
            <h3 className="font-display font-extrabold text-ink">
              Соцсети и данные
            </h3>
            <div className="mt-3 flex gap-2">
              {SOCIALS.map(({ href, icon: Icon, cls, label }) => (
                <a
                  key={href}
                  className={"soc " + cls}
                  href={BRAND.links[href]}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                >
                  <Icon />
                </a>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                resetCache();
                refresh();
              }}
              className="btn-ghost mt-4 !px-3 !py-1.5 text-xs"
              title="Сбросить кэш и свериться с Google Таблицей"
            >
              <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
              Обновить данные
            </button>
          </div>
        </div>
        <div className="border-t border-white/5 py-4 text-center text-xs text-ink-faint">
          © {new Date().getFullYear()} {BRAND.name} · {BRAND.footerText} ·
          сделано с 🥐 и любовью
        </div>
      </footer>
    </div>
  );
}
