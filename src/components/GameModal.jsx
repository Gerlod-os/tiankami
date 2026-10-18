import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { FiX, FiArrowRight } from "react-icons/fi";
import { GameDetails } from "./GameDetails";

// Модалка быстрого просмотра: Escape, клик по фону, блокировка скролла
export function GameModal({ game, onClose }) {
  const boxRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!game) return undefined;
    const prevFocus = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && boxRef.current) {
        const els = boxRef.current.querySelectorAll(
          'a[href], button, iframe, [tabindex]:not([tabindex="-1"])',
        );
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
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      prevFocus?.focus?.();
    };
  }, [game, onClose]);

  // Порталом в body: у обёртки страницы `overflow-x: clip`, а он делает её
  // содержащим блоком для `position: fixed` — оверлей начинался ниже шапки
  // и не закрывал верхние 24 px (замер 18.10.2026). В портале предков нет.
  if (!game || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={game.title}
      style={{
        backgroundImage: game.image
          ? `linear-gradient(to bottom, rgba(10,10,30,0.7), rgba(10,10,30,0.95)), url(${game.image})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div
        className="absolute inset-0 bg-night-900/75"
        onClick={onClose}
      />
      <div
        ref={boxRef}
        className="relative max-h-[88vh] w-full max-w-[640px] animate-fadeUp overflow-y-auto rounded-card border border-white/10 bg-night-900/95 shadow-card"
      >
        {/* Обложка 192×96 — ровно 2:1, как у Steam. Широкая полоса резала
            верх арта: у игр с персонажем срезало голову (замечено 18.10.2026). */}
        <div className="flex items-start gap-4 p-5 pb-0">
          {game.image ? (
            <img
              src={game.image}
              alt={`Обложка ${game.title}`}
              width={460}
              height={215}
              className="h-[96px] w-[192px] shrink-0 rounded-btn border border-white/10 object-cover"
            />
          ) : (
            <div className="h-[96px] w-[192px] shrink-0 rounded-btn border border-dashed border-white/15 bg-gradient-to-br from-night-700 to-night-600" />
          )}
          <div className="min-w-0 flex-1 pr-9">
            <h2 className="font-display text-lg font-black leading-tight text-ink">
              {game.title}
            </h2>
            <p className="mt-1 line-clamp-2 text-xs text-ink-dim">
              {game.genre}
              {game.setting ? ` · ${game.setting}` : ""}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-10 rounded-full border border-white/15 bg-night-900/80 p-2 text-ink-dim backdrop-blur transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pastel-pink/70"
            aria-label="Закрыть"
          >
            <FiX />
          </button>
        </div>
        <div className="p-5 pt-4">
          <GameDetails game={game} compact />
          <div className="mt-5 flex justify-end">
            <Link to={`/catalog/${game.slug}`} className="btn-primary text-sm">
              Страница игры <FiArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
