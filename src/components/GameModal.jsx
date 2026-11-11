import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { FiX, FiArrowRight } from "react-icons/fi";
import { GameDetails } from "./GameDetails";

// Панель быстрого просмотра: Escape закрывает, фокус возвращается на карточку.
// Ловушки фокуса нет намеренно: панель не модальная (aria-modal=false),
// страница вокруг живая, и Tab должен свободно уходить из панели на страницу.
// Раньше здесь запирался Tab — остаток от полноэкранной модалки.
export function GameModal({ game, onClose }) {
  const boxRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!game) return undefined;
    const prevFocus = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // Клик мимо панели закрывает её. Исключение — клик по карточке игры:
    // она сама переключит панель на другую игру, закрывать перед этим незачем.
    const onDown = (e) => {
      const box = boxRef.current;
      if (!box || box.contains(e.target)) return;
      if (e.target.closest?.('a[href*="/catalog/"]')) return;
      onClose();
    };
    document.addEventListener("pointerdown", onDown);
    // Скролл страницы не блокируем: владелец 11.11.2026 попросил, чтобы при
    // открытом просмотре по странице можно было листать дальше. Поэтому же
    // убрано затемнение на весь экран — панель висит сбоку и не запирает страницу.
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
      prevFocus?.focus?.();
    };
  }, [game, onClose]);

  // Порталом в body: у обёртки страницы `overflow-x: clip`, а он делает её
  // содержащим блоком для `position: fixed` — оверлей начинался ниже шапки
  // и не закрывал верхние 24 px (замер 18.10.2026). В портале предков нет.
  if (!game || typeof document === "undefined") return null;

  return createPortal(
    // Панель, а не полноэкранное окно: стоит у правого края, страница вокруг
    // остаётся живой и прокручивается. aria-modal=false — фон не заблокирован.
    <div
      className="pointer-events-none fixed inset-0 z-50 flex items-end justify-end p-3 sm:items-start sm:p-6"
      role="dialog"
      aria-modal="false"
      aria-label={game.title}
    >
      <div
        ref={boxRef}
        className="pointer-events-auto relative max-h-[78vh] w-full max-w-[560px] animate-fadeUp overflow-y-auto rounded-card border border-white/10 bg-night-900/95 shadow-card backdrop-blur sm:max-h-[calc(100vh-3rem)]"
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
