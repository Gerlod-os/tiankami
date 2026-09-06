import { useEffect, useRef, useState } from "react";

// Анимированный счётчик: SSR рендерит итоговое значение,
// в браузере — плавно «набегает» с нуля (уважает prefers-reduced-motion).
export function useCounter(target, duration = 1200) {
  const [value, setValue] = useState(target);
  const played = useRef(false);

  useEffect(() => {
    if (played.current) return;
    played.current = true;
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !target) {
      setValue(target);
      return undefined;
    }
    setValue(0);
    const t0 = performance.now();
    let raf = 0;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}
