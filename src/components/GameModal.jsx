import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { FiX, FiArrowRight } from "react-icons/fi";
import { LuPin, LuPinOff, LuGrip } from "react-icons/lu";
import { GameDetails } from "./GameDetails";

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

// Окно быстрого просмотра: таскается за шапку, меняет размер за правый нижний
// угол, закрепляется. Escape и клик мимо закрывают обычное окно; закреплённое
// они не трогают — это и есть защита от случайного закрытия (11.11.2026).
export function GameModal({ game, onClose }) {
  const boxRef = useRef(null);
  const closeRef = useRef(null);
  const dragRef = useRef(null);
  const resizeRef = useRef(null);
  const [frame, setFrame] = useState(null);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    setFrame(null);
    setPinned(false);
  }, [game?.slug]);

  useEffect(() => {
    if (!game) return undefined;
    const prev = document.activeElement;
    closeRef.current?.focus();
    return () => prev?.focus?.();
  }, [game?.slug]);

  useEffect(() => {
    if (!game) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape" && !pinned) onClose();
    };
    const onDown = (e) => {
      if (pinned) return;
      const box = boxRef.current;
      if (!box || box.contains(e.target)) return;
      if (e.target.closest?.('a[href*="/catalog/"]')) return;
      // Угол окна скруглён: точка в 20 px от правого нижнего угла — это промах
      // по ручке ресайза, а не клик мимо. Раньше окно из-за этого закрывалось
      // ровно тогда, когда тянули за угол (11.11.2026).
      const r = box.getBoundingClientRect();
      if (e.clientX > r.right - 20 && e.clientY > r.bottom - 20) return;
      onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [game, onClose, pinned]);

  // Порталом в body: у обёртки страницы `overflow-x: clip`, а он делает её
  // содержащим блоком для `position: fixed` (замер 18.10.2026).
  if (!game || typeof document === "undefined") return null;

  const isDesktop = window.innerWidth >= 640;
  const rect = () => {
    const r = boxRef.current.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  };

  const startDrag = (e) => {
    if (!isDesktop || e.button !== 0 || e.target.closest("button")) return;
    const r = rect();
    dragRef.current = { x: e.clientX, y: e.clientY, ...r };
    setFrame(r);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const moveDrag = (e) => {
    const d = dragRef.current;
    if (!d) return;
    setFrame({
      left: clamp(d.left + e.clientX - d.x, 8, window.innerWidth - 160),
      top: clamp(d.top + e.clientY - d.y, 8, window.innerHeight - 56),
      width: d.width,
      height: d.height,
    });
  };

  const startResize = (e) => {
    if (!isDesktop || e.button !== 0) return;
    const r = rect();
    resizeRef.current = { x: e.clientX, y: e.clientY, ...r };
    setFrame(r);
    e.currentTarget.setPointerCapture(e.pointerId);
    e.stopPropagation();
  };
  const moveResize = (e) => {
    const d = resizeRef.current;
    if (!d) return;
    setFrame({
      left: d.left,
      top: d.top,
      width: clamp(d.width + e.clientX - d.x, 360, window.innerWidth - d.left - 8),
      height: clamp(d.height + e.clientY - d.y, 240, window.innerHeight - d.top - 8),
    });
  };

  const iconBtn =
    "rounded-btn p-1.5 text-ink-dim transition hover:bg-white/10 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pastel-pink/70";

  const style =
    isDesktop && frame
      ? { left: frame.left, top: frame.top, width: frame.width, height: frame.height }
      : undefined;

  const boxClass =
    "pointer-events-auto fixed flex flex-col overflow-hidden border-white/10 bg-night-900 shadow-card " +
    (isDesktop
      ? "rounded-card border bg-night-900/95 backdrop-blur" +
        (!style ? " right-6 top-6 h-auto max-h-[calc(100dvh-3rem)] w-[560px]" : "")
      : "inset-0 h-[100dvh] w-full");

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 z-50"
      role="dialog"
      aria-modal="false"
      aria-label={game.title}
    >
      <div ref={boxRef} className={boxClass} style={style}>
        {/* Шапка окна: за неё таскаем, в ней же закрепление и закрытие. */}
        <div
          className="flex shrink-0 select-none items-center gap-2 border-b border-white/10 bg-night-800/70 px-3 py-2"
          style={{ cursor: isDesktop ? "move" : "default", touchAction: "none" }}
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={() => { dragRef.current = null; }}
          onPointerCancel={() => { dragRef.current = null; }}
        >
          <LuGrip className="shrink-0 text-ink-faint" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-sm font-black leading-tight text-ink">
              {game.title}
            </h2>
            <p className="truncate text-xs text-ink-dim">
              {game.genre}
              {game.setting ? ` · ${game.setting}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            {isDesktop && (
              <button
                type="button"
                onClick={() => setPinned((p) => !p)}
                className={iconBtn + (pinned ? " text-pastel-amber" : "")}
                title={pinned ? "Открепить" : "Закрепить — Escape и клик мимо не закроют"}
                aria-label={pinned ? "Открепить" : "Закрепить"}
              >
                {pinned ? <LuPinOff /> : <LuPin />}
              </button>
            )}
            <button
              ref={closeRef}
              type="button"
              onClick={() => {
                // Закреплённое окно случайно не закрыть: первое нажатие снимает
                // закрепление, второе уже закрывает.
                if (pinned) { setPinned(false); return; }
                onClose();
              }}
              className={iconBtn}
              title={pinned ? "Снимите закрепление, чтобы закрыть" : "Закрыть"}
              aria-label="Закрыть"
            >
              <FiX />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3 pt-3">
          <GameDetails game={game} compact />
        </div>
        {/* Кнопка на всю ширину, без разделительной полосы: геометрия окна
            не рвётся линией перед самым низом (11.11.2026). */}
        <div className="shrink-0 px-4 pb-4 pt-1">
          <Link to={`/catalog/${game.slug}`} className="btn-primary w-full text-sm">
            Страница игры <FiArrowRight />
          </Link>
        </div>
        {isDesktop && (
          <div
            className="absolute bottom-0 right-0 z-20 flex h-6 w-6 cursor-nwse-resize items-end justify-end p-1.5"
            style={{ touchAction: "none" }}
            onPointerDown={startResize}
            onPointerMove={moveResize}
            onPointerUp={() => { resizeRef.current = null; }}
            onPointerCancel={() => { resizeRef.current = null; }}
            title="Изменить размер"
            aria-hidden="true"
          >
            <span className="h-2 w-2 border-b-2 border-r-2 border-white/40" />
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
