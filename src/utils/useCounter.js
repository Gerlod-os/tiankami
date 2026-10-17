import { useEffect, useState } from "react";

// Анимированный счётчик: SSR и первый клиентский рендер рисуют итоговое
// значение (гидратация совпадает), эффект в браузере «набегает» с нуля.
// Без гварда «запущено»: StrictMode в DEV делает mount→cleanup→mount,
// гвард оставлял счётчик навсегда на 0 (cleanup гасил rAF, повторный
// запуск выходил по гварду). Уважает prefers-reduced-motion.
export function useCounter(target, duration) {
  if (duration === undefined) duration = 1200;
  const numTarget =
    typeof target === "number" && !isNaN(target) ? target : 0;
  const [value, setValue] = useState(numTarget);

  useEffect(() => {
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || numTarget === 0) {
      setValue(numTarget);
      return;
    }
    setValue(0);
    const t0 = performance.now();
    let raf = 0;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(numTarget * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [numTarget, duration]);

  return value;
}
