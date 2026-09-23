import { useId } from "react";

// 3D-кубок «Мастер Игорей» — SVG с золотым градиентом, свечением и частицами
export function MITrophy({ size = "sm", className = "" }) {
  const uid = useId().replace(/:/g, "");
  const px =
    size === "lg" ? "text-[110px]" : size === "md" ? "text-4xl" : size === "xs" ? "text-base" : "text-2xl";

  return (
    <span
      className={"relative inline-flex items-center justify-center " + className}
      title="Кубок «Мастер Игорей» — игра участвовала в МИ"
      aria-label="Кубок Мастера Игорей"
      role="img"
    >
      <span className={`trophy-spin ${px} leading-none`}>
        <svg
          viewBox="0 0 64 72"
          width="100%"
          height="100%"
          style={{ filter: "drop-shadow(0 0 12px rgba(255,217,160,.9)) drop-shadow(0 0 28px rgba(255,182,193,.5))" }}
        >
          <defs>
            <linearGradient id={`tg${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffe8a0" />
              <stop offset="30%" stopColor="#d4a020" />
              <stop offset="70%" stopColor="#f0c860" />
              <stop offset="100%" stopColor="#8a6a00" />
            </linearGradient>
            <linearGradient id={`tgR${uid}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#fff" stopOpacity="0" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0.3" />
            </linearGradient>
            <radialGradient id={`tgG${uid}`} cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Ножка кубка */}
          <rect x="27" y="54" width="10" height="12" rx="2" fill={`url(#tg${uid})`} stroke="#8a6a00" strokeWidth="0.8" />
          {/* Основание */}
          <rect x="20" y="64" width="24" height="5" rx="2.5" fill={`url(#tg${uid})`} stroke="#8a6a00" strokeWidth="0.8" />
          {/* Чаша */}
          <path d="M14 12 C 14 12 14 48 32 50 C 50 48 50 12 50 12 C 50 12 40 18 32 18 C 24 18 14 12 14 12 Z" fill={`url(#tg${uid})`} stroke="#8a6a00" strokeWidth="1" />
          {/* Блик на чаше */}
          <path d="M14 12 C 14 12 14 48 32 50 C 50 48 50 12 50 12 C 50 12 40 18 32 18 C 24 18 14 12 14 12 Z" fill={`url(#tgG${uid})`} />
          {/* Ручки */}
          <path d="M14 18 C 4 18 4 32 18 32" fill="none" stroke={`url(#tg${uid})`} strokeWidth="3" strokeLinecap="round" />
          <path d="M50 18 C 60 18 60 32 46 32" fill="none" stroke={`url(#tg${uid})`} strokeWidth="3" strokeLinecap="round" />
          {/* Звезда на кубке */}
          <polygon points="32,24 34,30 40,30 35,34 37,40 32,36 27,40 29,34 24,30 30,30" fill="#fff" opacity="0.7" />
          {/* Блик слева */}
          <path d="M20 16 C 20 16 20 30 24 36 C 22 30 22 20 20 16 Z" fill={`url(#tgR${uid})`} />
        </svg>
      </span>
      {/* Золотая пыль */}
      <span className="trophy-dust absolute h-1 w-1 rounded-full bg-pastel-amber" style={{ left: "10%", top: "15%", boxShadow: "0 0 6px #ffd880" }} />
      <span className="trophy-dust absolute h-0.5 w-0.5 rounded-full bg-pastel-pink" style={{ right: "8%", top: "30%", animationDelay: ".7s", boxShadow: "0 0 4px #ffb6c1" }} />
      <span className="trophy-dust absolute h-1 w-1 rounded-full bg-pastel-amber" style={{ left: "25%", bottom: "5%", animationDelay: "1.3s", boxShadow: "0 0 6px #ffd880" }} />
      <span className="trophy-dust absolute h-0.5 w-0.5 rounded-full bg-pastel-amber" style={{ right: "20%", bottom: "20%", animationDelay: ".3s", boxShadow: "0 0 4px #ffd880" }} />
    </span>
  );
}
