import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FiX, FiArrowRight } from "react-icons/fi";
import { GameDetails } from "./GameDetails";

// Модалка быстрого просмотра: Escape, клик по фону, блокировка скролла,
// фокус-трап + возврат фокуса (Г2)
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
          'a[href], button, iframe, [tabindex]:not([tabindex="-1"])'
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
    >
      <div
        className="absolute inset-0 bg-night-900/85 backdrop-blur-sm"
        onClick={onClose}
      />
      <div ref={boxRef} className="card relative max-h-[88vh] w-full max-w-4xl animate-fadeUp overflow-y-auto p-5 sm:p-7">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl font-black text-ink">{game.title}</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="btn-ghost !p-3"
            aria-label="Закрыть"
          >
            <FiX />
          </button>
        </div>
        <GameDetails game={game} />
        <div className="mt-6 flex justify-end">
          <Link to={`/catalog/${game.slug}`} className="btn-primary text-sm">
            Страница игры <FiArrowRight />
          </Link>
        </div>
      </div>
    </div>
  );
}
