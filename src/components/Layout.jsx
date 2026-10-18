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
  FiMenu,
  FiX,
  FiAward,
} from "react-icons/fi";
import { BRAND } from "../config/branding";
import { MASCOTS } from "../config/mascots";
import { TwitchHeaderWidget } from "./TwitchHeaderWidget";
import { FxPanel } from "./FxPanel";
import { YandexMetrika } from "./YandexMetrika";

const NAV = [
  { to: "/", label: "Главная", icon: FiHome, end: true },
  { to: "/catalog", label: "Каталог", icon: FiGrid },
  { to: "/collections", label: "Подборки", icon: FiFolder },
  { to: "/mi", label: "Мастер Игорей", icon: FiAward },
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [flip, setFlip] = useState(0);
  const drawerRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setMenuOpen(false);
  }, [location.pathname]);

  // Меню — модальное состояние: фон не прокручивается, Tab ходит по панели,
  // Escape закрывает, фокус возвращается на кнопку. Без этого панель — просто
  // выехавший справа блок, а страница под ним едет (замер 18.10.2026: 1200 px).
  useEffect(() => {
    if (!menuOpen) return undefined;
    const prevFocus = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusables = () =>
      drawerRef.current
        ? [...drawerRef.current.querySelectorAll(
            'a[href], button, [tabindex]:not([tabindex="-1"])',
          )]
        : [];
    focusables()[0]?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const els = focusables();
      if (!els.length) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [menuOpen]);

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <YandexMetrika />
      <FxPanel />

      <header className="sticky top-0 z-40 border-b border-white/5 bg-night-800">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link
            to="/"
            className="group flex min-w-0 items-center gap-3"
            aria-label="TianKami — на главную"
          >
            {/* Логотип обрезан по кругу: белая стикерная обводка кроассана выходила
                на край и читалась белой дугой. Картинка увеличена внутри круга,
                артефакт ушёл за обрез (решение владельца 18.10.2026). */}
            <span
              key={flip}
              onClick={() => setFlip((f) => f + 1)}
              className={
                "relative h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-full shadow-glow-pink transition-transform group-hover:scale-105 " +
                (flip > 0 ? "logo-flip" : "")
              }
            >
              <img
                src={MASCOTS.logo}
                alt="Аватар Tiankami — кроассан-геймпад"
                width={512}
                height={512}
                className="h-full w-full object-cover"
              />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="section-accent block truncate font-display text-xl font-black tracking-wide">
                TianKami
              </span>
            </span>
          </Link>

          <nav
            className="mx-auto hidden items-center gap-1 lg:flex"
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
                    "nav-link group flex items-center gap-1 whitespace-nowrap " +
                    (isActive ? "nav-link-active" : "")
                  }
                >
                  <span
                    className={`hidden transition-transform group-hover:scale-110 xl:inline-flex ${iconColor}`}
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
              className="btn-ghost !p-3 lg:hidden"
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
            className="fixed inset-0 z-40 bg-night-900/85 lg:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <div
            ref={drawerRef}
            className="drawer lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Меню"
          >
            <div className="mb-6 flex items-center justify-between">
              <img
                src={MASCOTS.logo}
                alt=""
                width={512}
                height={512}
                className="h-10 w-10 rounded-full object-cover"
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

      {/* Подвал — одна строка. Строку «данные: <дата сборки>» владелец убрал:
          дата сборки ничего не говорит читателю, а подпись про рогалик вернул
          (18.10.2026). */}
      <footer className="border-t border-white/5 bg-night-900/60">
        <div className="mx-auto max-w-7xl px-4 py-3 text-center text-[11px] text-ink-faint">
          © {new Date().getFullYear()} {BRAND.name} · {BRAND.footerText} · сделано с{" "}
          <span aria-hidden="true">🥐</span> и любовью
        </div>
      </footer>
    </div>
  );
}
