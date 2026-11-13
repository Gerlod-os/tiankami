import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiCheck, FiChevronDown, FiSearch, FiTag, FiX } from "react-icons/fi";

// Выбор тегов: кнопка в панели фильтров + выпадающий список с поиском.
// Список живёт порталом в body: панель фильтров скроллится и обрезает
// absolute-потомков, а тегов 257 — список должен быть виден целиком
// (слово владельца 13.11.2026: «если их много, чтобы открывались в выпадающем»).
export function TagPicker({ items, selected, onToggle, onClear, max = 5 }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const inputRef = useRef(null);

  const measure = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.min(340, window.innerWidth - 16);
    const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8));
    const below = window.innerHeight - r.bottom - 12;
    const openUp = below < 260 && r.top > below;
    setPos({
      left,
      width,
      top: openUp ? undefined : r.bottom + 6,
      bottom: openUp ? window.innerHeight - r.top + 6 : undefined,
      maxHeight: Math.max(180, Math.min(360, (openUp ? r.top : below) - 12)),
    });
  };

  useEffect(() => {
    if (!open) return undefined;
    measure();
    inputRef.current?.focus();
    const onDown = (e) => {
      if (panelRef.current?.contains(e.target)) return;
      if (btnRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    // Список привязан к кнопке по координатам: при прокрутке (в том числе
    // внутри панели фильтров) пересчитываем позицию, а не закрываем — иначе
    // на телефоне список захлопывался сразу после открытия (замер 13.11.2026).
    let raf = 0;
    const onMove = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        measure();
      });
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onMove, { passive: true, capture: true });
    window.addEventListener("resize", onMove);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((x) => x.tag.toLowerCase().includes(s));
  }, [items, q]);

  const full = selected.size >= max;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Фильтр по тегам"
        onClick={() => setOpen((o) => !o)}
        className="input relative flex !h-12 w-full items-center gap-2 !py-2 pl-3 pr-8 text-left text-xs font-semibold"
      >
        <FiTag className="shrink-0 text-pastel-amber" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">
          {selected.size ? `Теги: ${selected.size}` : "Любые теги"}
        </span>
        <FiChevronDown
          className={
            "pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-pastel-amber transition " +
            (open ? "rotate-180" : "")
          }
        />
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            role="listbox"
            aria-multiselectable="true"
            aria-label="Теги игр"
            data-tag-panel
            style={{
              left: pos.left,
              width: pos.width,
              top: pos.top,
              bottom: pos.bottom,
              maxHeight: pos.maxHeight,
            }}
            className="fixed z-[60] flex flex-col overflow-hidden rounded-card border border-white/15 bg-night-700 shadow-card"
          >
            <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-2.5">
              <FiSearch className="shrink-0 text-ink-faint" aria-hidden="true" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Найти тег…"
                aria-label="Поиск по тегам"
                className="w-full bg-transparent py-2.5 text-xs text-ink outline-none placeholder:text-ink-faint"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  aria-label="Очистить поиск"
                  className="shrink-0 rounded p-0.5 text-ink-dim hover:text-ink"
                >
                  <FiX aria-hidden="true" />
                </button>
              )}
            </div>

            <ul className="min-h-0 flex-1 overflow-y-auto p-1">
              {list.map(({ tag, count }) => {
                const on = selected.has(tag);
                const off = !on && full;
                return (
                  <li key={tag}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={on}
                      disabled={off}
                      onClick={() => onToggle(tag)}
                      className={
                        "flex w-full items-center gap-2 rounded-btn px-2 py-1.5 text-left text-xs transition " +
                        (off
                          ? "cursor-not-allowed text-ink-faint opacity-50"
                          : on
                            ? "bg-white/10 text-ink"
                            : "text-ink-dim hover:bg-white/5 hover:text-ink")
                      }
                    >
                      <span
                        className={
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded border " +
                          (on
                            ? "border-pastel-pink bg-pastel-pink text-night-900"
                            : "border-white/25")
                        }
                      >
                        {on && <FiCheck aria-hidden="true" />}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{tag}</span>
                      <span className="shrink-0 text-[11px] text-ink-faint">{count}</span>
                    </button>
                  </li>
                );
              })}
              {list.length === 0 && (
                <li className="px-2 py-4 text-center text-xs text-ink-dim">
                  Такого тега нет
                </li>
              )}
            </ul>

            <div className="flex shrink-0 items-center justify-between gap-2 border-t border-white/10 px-2.5 py-2 text-[11px] text-ink-faint">
              <span>
                Выбрано {selected.size} из {max}
              </span>
              {selected.size > 0 && (
                <button
                  type="button"
                  onClick={onClear}
                  className="font-semibold text-ink-dim transition hover:text-pastel-pink"
                >
                  Снять все
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
