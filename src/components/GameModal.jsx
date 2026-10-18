import { useEffect, useRef } from "react";
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

  if (!game) return null;

  return (
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
        <div className="relative">
          {game.image ? (
            <img
              src={game.image}
              alt={`Обложка ${game.title}`}
              width={460}
              height={215}
              className="h-[150px] w-full rounded-t-card object-cover"
            />
          ) : (
            <div className="h-[120px] w-full rounded-t-card bg-gradient-to-br from-night-700 to-night-600" />
          )}
          <div className="pointer-events-none absolute inset-0 rounded-t-card bg-gradient-to-t from-night-900 via-night-900/30 to-transparent" />
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
        <div className="p-5">
          <h2 className="font-display text-xl font-black text-ink">
            {game.title}
          </h2>
          <div className="mt-3">
            <GameDetails game={game} compact />
          </div>
          <div className="mt-5 flex justify-end">
            <Link to={`/catalog/${game.slug}`} className="btn-primary text-sm">
              Страница игры <FiArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
