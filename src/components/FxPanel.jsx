import { useEffect, useRef, useState } from "react";
import { LuSparkles } from "react-icons/lu";
import { safeGet, safeSet } from "../utils/storage";
import { afterLoad } from "../utils/idle";

const KEY = "tiankami_fx_enabled";
const COLORS = ["#FFB6C1", "#C9A0DC", "#A0C4FF", "#FFD9A0", "#9FE2B9"];
const KONAMI = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];

// Антиматерия: частицы сталкиваются → вспышка → возрождаются через 2с.
// Звёздная пыль с параллаксом + репульсия от курсора. Konami code → 🥐.
// Перф-гард: адаптивное число частиц, запуск через afterLoad(300ms),
// полное отключение при prefers-reduced-motion.
export function FxPanel() {
  // SSR-детерминировано: всегда true на первом рендере, сохранённый выбор
  // применяется в эффекте — без hydration mismatch (Г1)
  const [enabled, setEnabled] = useState(true);
  const [toast, setToast] = useState(false);
  const canvasRef = useRef(null);
  const booted = useRef(false);

  useEffect(() => {
    if (!booted.current) {
      booted.current = true;
      const saved = safeGet(KEY);
      if (saved === false) {
        setEnabled(false);
        return;
      }
    }
    safeSet(KEY, enabled);
    if (!enabled) return undefined;
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return undefined;

    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");

    let raf = 0;
    let cleanupFns = [];
    const mouse = { x: -9999, y: -9999, nx: 0, ny: 0 };
    let emojiUntil = 0;
    let kIdx = 0;

    const engine = () => {
      const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      resize();
      const onMove = (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.nx = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.ny = (e.clientY / window.innerHeight) * 2 - 1;
      };
      const onKey = (e) => {
        const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        kIdx = k === KONAMI[kIdx] ? kIdx + 1 : 0;
        if (kIdx === KONAMI.length) {
          kIdx = 0;
          emojiUntil = Date.now() + 10000;
          setToast(true);
          setTimeout(() => setToast(false), 4000);
        }
      };
      window.addEventListener("resize", resize);
      window.addEventListener("mousemove", onMove, { passive: true });
      window.addEventListener("keydown", onKey);
      cleanupFns = [
        () => window.removeEventListener("resize", resize),
        () => window.removeEventListener("mousemove", onMove),
        () => window.removeEventListener("keydown", onKey),
      ];

      // адаптивная плотность: меньше на мобильных/hi-dpi — стабильные 60fps
      const area = window.innerWidth * window.innerHeight;
      const nParts = Math.max(24, Math.min(56, Math.round(area / 30000)));
      const nStars = Math.max(16, Math.min(46, Math.round(area / 40000)));

      const spawn = (p) => {
        p.x = Math.random() * canvas.width;
        p.y = Math.random() * canvas.height;
        p.vx = (Math.random() - 0.5) * 0.5;
        p.vy = (Math.random() - 0.5) * 0.5;
        p.r = 1.6 + Math.random() * 2.4;
        p.color = COLORS[(Math.random() * COLORS.length) | 0];
        p.alpha = 0.3 + Math.random() * 0.5;
        p.phase = Math.random() * Math.PI * 2;
        p.alive = true;
        p.respawnAt = 0;
        return p;
      };
      const particles = Array.from({ length: nParts }, () => spawn({}));
      const stars = Array.from({ length: nStars }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 0.5 + Math.random() * 1.1,
        depth: 0.3 + Math.random() * 0.7,
        tw: Math.random() * Math.PI * 2,
      }));
      const flashes = [];

      const tick = (t) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const emojiMode = Date.now() < emojiUntil;

        for (const s of stars) {
          const ox = -mouse.nx * 14 * s.depth;
          const oy = -mouse.ny * 10 * s.depth;
          ctx.globalAlpha = 0.35 + 0.3 * Math.sin(t / 900 + s.tw);
          ctx.fillStyle = "#EDEAF6";
          ctx.beginPath();
          ctx.arc(s.x + ox, s.y + oy, s.r, 0, Math.PI * 2);
          ctx.fill();
        }

        for (const p of particles) {
          if (!p.alive) {
            if (t >= p.respawnAt) spawn(p);
            else continue;
          }
          const dxm = p.x - mouse.x;
          const dym = p.y - mouse.y;
          const dm = Math.hypot(dxm, dym);
          if (dm < 130 && dm > 0.01) {
            const f = ((130 - dm) / 130) * 0.6;
            p.vx += (dxm / dm) * f;
            p.vy += (dym / dm) * f;
          }
          p.vx *= 0.985;
          p.vy *= 0.985;
          p.x += p.vx + Math.sin(t / 1600 + p.phase) * 0.2;
          p.y += p.vy + Math.cos(t / 1800 + p.phase) * 0.2;
          if (p.x < -20) p.x = canvas.width + 20;
          if (p.x > canvas.width + 20) p.x = -20;
          if (p.y < -20) p.y = canvas.height + 20;
          if (p.y > canvas.height + 20) p.y = -20;
        }
        for (let i = 0; i < particles.length; i++) {
          const a = particles[i];
          if (!a.alive) continue;
          for (let j = i + 1; j < particles.length; j++) {
            const b = particles[j];
            if (!b.alive) continue;
            if (Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r + 3) {
              a.alive = false;
              b.alive = false;
              a.respawnAt = b.respawnAt = t + 2000;
              flashes.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, t0: t, color: a.color });
            }
          }
        }
        for (const p of particles) {
          if (!p.alive) continue;
          ctx.globalAlpha = p.alpha * (0.7 + 0.3 * Math.sin(t / 700 + p.phase));
          if (emojiMode) {
            ctx.font = `${10 + p.r * 3}px serif`;
            ctx.fillText("🥐", p.x, p.y);
          } else {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        for (let i = flashes.length - 1; i >= 0; i--) {
          const f = flashes[i];
          const age = (t - f.t0) / 500;
          if (age >= 1) {
            flashes.splice(i, 1);
            continue;
          }
          ctx.globalAlpha = 1 - age;
          ctx.strokeStyle = f.color;
          ctx.lineWidth = 2 * (1 - age);
          ctx.beginPath();
          ctx.arc(f.x, f.y, 4 + age * 26, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const stop = afterLoad(engine, { minIdle: 300 });
    return () => {
      stop();
      cancelAnimationFrame(raf);
      cleanupFns.forEach((fn) => fn());
    };
  }, [enabled]);

  return (
    <>
      {enabled && (
        <canvas
          ref={canvasRef}
          className="pointer-events-none fixed inset-0 z-30"
          aria-hidden="true"
        />
      )}
      {toast && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 animate-fadeUp rounded-card border border-pastel-amber/50 bg-night-900/95 px-6 py-3 font-display font-extrabold text-pastel-amber shadow-glow-pink">
          🥐 РЕЖИМ КРОАССАНА АКТИВИРОВАН! +100 к уюту
        </div>
      )}
      <button
        type="button"
        onClick={() => setEnabled((v) => !v)}
        title={enabled ? "Выключить эффекты" : "Включить уютные эффекты"}
        aria-pressed={enabled}
        aria-label="Переключить визуальные эффекты"
        className={
          "fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border text-xl transition duration-300 " +
          (enabled
            ? "border-pastel-pink/50 bg-gradient-to-br from-pastel-pink/30 to-pastel-purple/30 text-pastel-pink shadow-glow-pink"
            : "border-white/10 bg-night-600/80 text-ink-faint hover:text-ink")
        }
      >
        <LuSparkles />
      </button>
    </>
  );
}
