// Отложенный запуск некритичной работы (из Lighthouse-отчёта):
// выводит сетевые запросы и canvas-анимации из критического пути рендера.
export function afterLoad(
  cb,
  { minIdle = 3000, timeout = 2500, interaction = false, interactionFallback = 12000 } = {}
) {
  if (typeof window === "undefined") return () => {};
  let done = false;
  let timer = 0;
  let idleId = 0;
  const cleanups = [];

  const run = () => {
    if (done) return;
    done = true;
    cleanups.forEach((fn) => fn());
    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(() => cb(), { timeout });
    } else {
      timer = setTimeout(cb, 0);
    }
  };

  if (interaction) {
    const events = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"];
    const onInteract = () => run();
    events.forEach((e) => {
      window.addEventListener(e, onInteract, { passive: true, once: true });
      cleanups.push(() => window.removeEventListener(e, onInteract));
    });
    const fallback = setTimeout(run, interactionFallback);
    cleanups.push(() => clearTimeout(fallback));
  } else {
    const t0 = Date.now();
    const onLoaded = () => {
      const wait = Math.max(0, minIdle - (Date.now() - t0));
      timer = setTimeout(run, wait);
    };
    if (document.readyState === "complete") onLoaded();
    else {
      window.addEventListener("load", onLoaded, { once: true });
      cleanups.push(() => window.removeEventListener("load", onLoaded));
    }
    const guard = setTimeout(run, minIdle + 6000);
    cleanups.push(() => clearTimeout(guard));
  }

  return () => {
    done = true;
    cleanups.forEach((fn) => fn());
    clearTimeout(timer);
    if (idleId && "cancelIdleCallback" in window) window.cancelIdleCallback(idleId);
  };
}
