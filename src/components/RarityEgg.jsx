import { useId } from "react";
import { RARITY_META } from "../utils/rarity";

// Драконье яйцо редкости (стиль Monster Train) с tooltip
export function RarityEgg({ rarity = "common", size = 22, className = "" }) {
  const uid = useId().replace(/[:]/g, "");
  const meta = RARITY_META[rarity] || RARITY_META.common;
  const c = meta.color;

  return (
    <span
      className={"group/egg relative inline-flex " + className}
      style={{ width: size, height: size }}
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
        <defs>
          <radialGradient id={`g${uid}`} cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="25%" stopColor={c} />
            <stop offset="100%" stopColor={rarity === "common" ? "#565b66" : "#1a1a2e"} />
          </radialGradient>
          <linearGradient id={`r${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFB6C1" />
            <stop offset="35%" stopColor="#FFD9A0" />
            <stop offset="70%" stopColor="#9FE2B9" />
            <stop offset="100%" stopColor="#A0C4FF" />
          </linearGradient>
        </defs>
        <path
          d="M32 3 C 19 3 8 22 8 38 C 8 53 19 61 32 61 C 45 61 56 53 56 38 C 56 22 45 3 32 3 Z"
          fill={rarity === "mythic" ? `url(#r${uid})` : `url(#g${uid})`}
          stroke={c}
          strokeWidth="2"
        />
        {/* чешуя/узоры по уровням */}
        {rarity !== "common" && (
          <>
            <circle cx="24" cy="30" r="3.4" fill="#fff" opacity="0.5" />
            <circle cx="38" cy="42" r="2.6" fill="#fff" opacity="0.35" />
          </>
        )}
        {(rarity === "epic" || rarity === "legendary" || rarity === "mythic") && (
          <path
            d="M20 46 q6 -6 12 0 q6 6 12 0"
            stroke={rarity === "legendary" ? "#b76e79" : "#fff"}
            strokeWidth="2"
            fill="none"
            opacity="0.6"
          />
        )}
        {rarity === "legendary" && (
          <path d="M32 20 l5 8 -5 8 -5 -8 Z" fill="#e63956" opacity="0.95" />
        )}
        {rarity === "mythic" && (
          <path
            d="M24 34 q8 -10 16 0 q-4 -2 -8 -2 q-4 0 -8 2 Z"
            fill="#1a1a2e"
            opacity="0.8"
          />
        )}
      </svg>
      <span className="egg-tip pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-44 -translate-x-1/2 rounded-btn border border-white/10 bg-night-900/95 p-2 text-center shadow-card group-hover/egg:block">
        <span className="block font-display text-xs font-extrabold" style={{ color: c }}>
          {meta.ru}
        </span>
        <span className="mt-0.5 block text-[10px] leading-snug text-ink-dim">
          {meta.desc}
        </span>
      </span>
    </span>
  );
}
