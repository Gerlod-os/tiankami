import { useEffect, useRef, useState } from "react";

// Общая привязка выпадающего списка к кнопке.
//
// Зачем портал, а не absolute: панель фильтров стала прокручиваемой
// (max-h + overflow-y-auto), а такой контейнер обрезает всё, что вылезает
// за его край. Список годов из 18 пунктов так и пропадал: карточка кончалась
// на 496 px, а список шёл до 561 (замер 13.11.2026). Портал в body живёт
// поверх и не зависит от прокрутки родителя.
//
// Координаты считаются от кнопки. При прокрутке и ресайзе позиция
// пересчитывается в кадре, а не закрывается — иначе на телефоне список
// захлопывался сразу после открытия.
export function useAnchoredPanel({ width = 340, gap = 6, minBelow = 260 } = {}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  const measure = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const w = Math.min(width, window.innerWidth - 16);
    const left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8));
    const below = window.innerHeight - r.bottom - gap - 8;
    const up = below < minBelow && r.top > below;
    const space = up ? r.top - gap - 8 : below;
    setPos({
      left,
      width: w,
      top: up ? undefined : r.bottom + gap,
      bottom: up ? window.innerHeight - r.top + gap : undefined,
      maxHeight: Math.max(160, Math.min(360, space)),
    });
  };

  useEffect(() => {
    if (!open) return undefined;
    measure();
    let raf = 0;
    const onMove = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        measure();
      });
    };
    window.addEventListener("scroll", onMove, { passive: true, capture: true });
    window.addEventListener("resize", onMove);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
    // measure читает размеры DOM — от рендера не зависит
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, width, gap, minBelow]);

  // Клик вне (учитывая портал) и Escape — общее поведение для обоих списков.
  useEffect(() => {
    if (!open) return undefined;
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
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return { open, setOpen, pos, btnRef, panelRef, measure };
}
