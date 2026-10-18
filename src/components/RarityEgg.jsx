import { useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { RARITY_META } from "../utils/rarity";

export function RarityEgg({ rarity = "common", size = 22, className = "" }) {
  const uid = useId().replace(/:/g, "");
  const meta = RARITY_META[rarity] || RARITY_META.common;
  const c = meta.color;
  const anchorRef = useRef(null);
  const [tip, setTip] = useState(null);

  // Подсказка живёт в портале и позиционируется от яйца: карточки, модалка и
  // списки обрезают `absolute`-подсказку своим overflow, и она резалась по краю
  // (замечено владельцем 18.10.2026). Прижимаем к краям окна, чтобы не уезжала.
  const TIP_W = 176;
  const GAP = 8;
  const showTip = () => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = Math.max(GAP, Math.min(r.left + r.width / 2 - TIP_W / 2, window.innerWidth - TIP_W - GAP));
    const above = r.top > 130;
    setTip({ x, y: above ? r.top - GAP : r.bottom + GAP, above });
  };
  const hideTip = () => setTip(null);

  const renderDefs = () => {
    switch (rarity) {
      case "common":
        return (
          <radialGradient id={`eg${uid}`} cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#b8b0a8" stopOpacity="0.8" />
            <stop offset="40%" stopColor="#8a8078" />
            <stop offset="100%" stopColor="#4a4540" />
          </radialGradient>
        );
      case "rare":
        return (
          <>
            <radialGradient id={`eg${uid}`} cx="35%" cy="30%" r="80%">
              <stop offset="0%" stopColor="#a0e8ff" stopOpacity="0.9" />
              <stop offset="30%" stopColor="#40b8d8" />
              <stop offset="100%" stopColor="#1a4a6a" />
            </radialGradient>
            <linearGradient id={`egR${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </>
        );
      case "epic":
        return (
          <>
            <radialGradient id={`eg${uid}`} cx="35%" cy="30%" r="80%">
              <stop offset="0%" stopColor="#d8a0ff" stopOpacity="0.85" />
              <stop offset="35%" stopColor="#8a30c0" />
              <stop offset="100%" stopColor="#2a0a50" />
            </radialGradient>
            <radialGradient id={`egG${uid}`} cx="30%" cy="25%" r="50%">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
          </>
        );
      case "legendary":
        return (
          <>
            <radialGradient id={`eg${uid}`} cx="35%" cy="30%" r="80%">
              <stop offset="0%" stopColor="#ffe8a0" stopOpacity="0.95" />
              <stop offset="30%" stopColor="#d4a020" />
              <stop offset="100%" stopColor="#7a5a00" />
            </radialGradient>
            <linearGradient id={`egR${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </>
        );
      case "mythic":
        return (
          <>
            {/* Радужный перелив: шесть стопов разного оттенка по диагонали.
                Однотонный сине-фиолетовый читался как тёмное эпическое — проверено 18.10.2026 */}
            <linearGradient id={`eg${uid}`} x1="10%" y1="0%" x2="90%" y2="100%">
              <stop offset="0%" stopColor="#ff4fa3" />
              <stop offset="22%" stopColor="#a05cff" />
              <stop offset="44%" stopColor="#3f8cff" />
              <stop offset="62%" stopColor="#3fd8d0" />
              <stop offset="80%" stopColor="#5fe08a" />
              <stop offset="100%" stopColor="#ffd166" />
            </linearGradient>
            <radialGradient id={`egN${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ff60a0" stopOpacity="0.55" />
              <stop offset="50%" stopColor="#60a0ff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#60ff90" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`egR${uid}`} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.45" />
            </linearGradient>
          </>
        );
      default:
        return (
          <radialGradient id={`eg${uid}`} cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="25%" stopColor={c} />
            <stop offset="100%" stopColor="#1a1a2e" />
          </radialGradient>
        );
    }
  };

  const renderBody = () => {
    const shell = `url(#eg${uid})`;
    switch (rarity) {
      case "common":
        return (
          <path d="M32 3 C 19 3 8 22 8 38 C 8 53 19 61 32 61 C 45 61 56 53 56 38 C 56 22 45 3 32 3 Z" fill={shell} stroke="#6a6058" strokeWidth="1.5" />
        );
      case "rare":
        return (
          <>
            <path d="M32 3 C 19 3 8 22 8 38 C 8 53 19 61 32 61 C 45 61 56 53 56 38 C 56 22 45 3 32 3 Z" fill={shell} stroke="#2a7a9a" strokeWidth="1.5" />
            <path d="M20 30 C 22 28 26 28 28 30 C 26 32 22 32 20 30 Z" fill="#fff" opacity="0.25" />
            <path d="M30 35 C 32 33 36 33 38 35 C 36 37 32 37 30 35 Z" fill="#fff" opacity="0.2" />
            <path d="M24 40 C 26 38 30 38 32 40 C 30 42 26 42 24 40 Z" fill="#fff" opacity="0.15" />
            <path d="M36 44 C 38 42 42 42 44 44 C 42 46 38 46 36 44 Z" fill="#fff" opacity="0.15" />
            <path d="M32 3 C 19 3 8 22 8 38 C 8 53 19 61 32 61 C 45 61 56 53 56 38 C 56 22 45 3 32 3 Z" fill={`url(#egR${uid})`} />
          </>
        );
      case "epic":
        return (
          <>
            <path d="M32 3 C 19 3 8 22 8 38 C 8 53 19 61 32 61 C 45 61 56 53 56 38 C 56 22 45 3 32 3 Z" fill={shell} stroke="#6a10a0" strokeWidth="1.5" />
            <polygon points="22,28 25,22 28,28 25,32" fill="#e0b0ff" opacity="0.7" />
            <polygon points="36,38 39,32 42,38 39,42" fill="#d090ff" opacity="0.6" />
            <polygon points="28,44 31,38 34,44 31,48" fill="#c080f0" opacity="0.5" />
            <path d="M32 3 C 19 3 8 22 8 38 C 8 53 19 61 32 61 C 45 61 56 53 56 38 C 56 22 45 3 32 3 Z" fill={`url(#egG${uid})`} />
          </>
        );
      case "legendary":
        return (
          <>
            <path d="M32 3 C 19 3 8 22 8 38 C 8 53 19 61 32 61 C 45 61 56 53 56 38 C 56 22 45 3 32 3 Z" fill={shell} stroke="#b08010" strokeWidth="1.5" />
            <ellipse cx="32" cy="32" rx="22" ry="26" fill="none" stroke="#d4a020" strokeWidth="1" opacity="0.5" />
            <circle cx="22" cy="24" r="2.5" fill="#d02040" opacity="0.9" />
            <circle cx="42" cy="24" r="2.5" fill="#d02040" opacity="0.9" />
            <circle cx="22" cy="40" r="2" fill="#d02040" opacity="0.8" />
            <circle cx="42" cy="40" r="2" fill="#d02040" opacity="0.8" />
            <circle cx="32" cy="16" r="2" fill="#d02040" opacity="0.85" />
            <path d="M32 3 C 19 3 8 22 8 38 C 8 53 19 61 32 61 C 45 61 56 53 56 38 C 56 22 45 3 32 3 Z" fill={`url(#egR${uid})`} />
          </>
        );
      case "mythic":
        return (
          <>
            <path d="M32 3 C 19 3 8 22 8 38 C 8 53 19 61 32 61 C 45 61 56 53 56 38 C 56 22 45 3 32 3 Z" fill={shell} stroke="#8060ff" strokeWidth="1.5" />
            <path d="M32 3 C 19 3 8 22 8 38 C 8 53 19 61 32 61 C 45 61 56 53 56 38 C 56 22 45 3 32 3 Z" fill={`url(#egN${uid})`} />
            <circle cx="20" cy="20" r="0.8" fill="#fff" opacity="0.9" />
            <circle cx="38" cy="18" r="0.6" fill="#fff" opacity="0.7" />
            <circle cx="44" cy="30" r="0.7" fill="#fff" opacity="0.8" />
            <circle cx="24" cy="42" r="0.5" fill="#fff" opacity="0.6" />
            <circle cx="34" cy="50" r="0.8" fill="#fff" opacity="0.9" />
            <circle cx="46" cy="48" r="0.6" fill="#fff" opacity="0.5" />
            <circle cx="16" cy="34" r="0.7" fill="#fff" opacity="0.7" />
            <circle cx="28" cy="28" r="0.5" fill="#fff" opacity="0.8" />
          </>
        );
      default:
        return (
          <path d="M32 3 C 19 3 8 22 8 38 C 8 53 19 61 32 61 C 45 61 56 53 56 38 C 56 22 45 3 32 3 Z" fill={c} stroke={c} strokeWidth="1.5" />
        );
    }
  };

  return (
    <span
      ref={anchorRef}
      className={"group/egg relative inline-flex " + className}
      style={{ width: size, height: size }}
      onMouseEnter={showTip}
      onMouseLeave={hideTip}
    >
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        aria-label={`Редкость: ${meta.ru}`}
        role="img"
        style={{
          filter:
            rarity === "common"
              ? undefined
              : `drop-shadow(0 0 ${rarity === "mythic" ? 8 : 5}px ${c})`,
        }}
      >
        <defs>{renderDefs()}</defs>
        {renderBody()}
      </svg>
      {tip &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            className="egg-tip pointer-events-none fixed z-[80] w-44 rounded-btn border border-white/10 bg-night-900/95 p-2 text-center shadow-card"
            style={{
              left: tip.x,
              top: tip.y,
              transform: tip.above ? "translateY(-100%)" : "none",
            }}
          >
            <span className="block font-display text-xs font-extrabold" style={{ color: c }}>
              {meta.ru}
            </span>
            <span className="mt-0.5 block text-[10px] leading-snug text-ink-dim">
              {meta.desc}
            </span>
          </span>,
          document.body,
        )}
    </span>
  );
}
