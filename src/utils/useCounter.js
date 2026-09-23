import { useEffect, useRef, useState } from "react";

export function useCounter(target, duration) {
  if (duration === undefined) duration = 1200;
  var isClient = typeof window !== "undefined";
  var numTarget = 0;
  if (isClient && typeof target === "number" && !isNaN(target)) {
    numTarget = target;
  }
  var _s = useState(numTarget),
    value = _s[0],
    setValue = _s[1];
  var started = useRef(false);

  useEffect(function () {
    if (started.current) return;
    started.current = true;
    var reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    setValue(0);
    var t0 = performance.now();
    var raf = 0;
    var tick = function (t) {
      var p = Math.min(1, (t - t0) / duration);
      var eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(numTarget * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return function () {
      cancelAnimationFrame(raf);
    };
  }, [numTarget, duration]);

  return value;
}
