// Безопасная работа с localStorage (SSR-safe).
// Убрано 18.11.2026: safeRemove, sessionGet, sessionSet, hashStr — ни одна не
// вызывалась ни в src, ни в scripts, а hashStr жил только в тесте.
export function safeGet(key) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const raw = window.localStorage.getItem(key);
    return raw == null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

export function safeSet(key, value) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* переполнение — не критично */
  }
}
